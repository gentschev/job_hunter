// Content script for LinkedIn job search and scraping

import { parseJobCard, parseJobDetails } from '../utils/parser.js';
import { 
  getStoredCredentials, 
  getStoredSearchPreferences,
  storeJobListings,
  getStoredJobListings,
  getPendingSearch,
  clearPendingSearch
} from '../utils/storage.js';
import { sendJobListings } from '../utils/api.js';

// Use modern async message handler pattern
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSearch') {
    // Respond immediately to keep the messaging channel open
    sendResponse({ received: true });
    
    // Execute the search asynchronously
    handleStartSearch().then(result => {
      // Use a separate message to send the final result
      chrome.runtime.sendMessage({ 
        action: 'searchComplete', 
        result 
      });
    }).catch(error => {
      chrome.runtime.sendMessage({ 
        action: 'searchError', 
        error: error.message 
      });
    });
    
    return true;
  }
  return false;
});

// Check if we need to start a search when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  const pendingSearch = await getPendingSearch();
  
  if (pendingSearch) {
    // Clear the flag first to avoid loops
    await clearPendingSearch();
    
    // Wait for page to fully load
    setTimeout(async () => {
      await handleStartSearch();
    }, 2000);
  }
});

// Main function to handle the search process
async function handleStartSearch() {
  try {
    // Check if we're on LinkedIn
    if (!window.location.href.includes('linkedin.com')) {
      return { success: false, error: 'Not on LinkedIn' };
    }
    
    // Get credentials and search preferences
    const credentials = await getStoredCredentials();
    if (!credentials || !credentials.token) {
      return { success: false, error: 'Not logged in' };
    }
    
    let preferences = await getStoredSearchPreferences();
    if (!preferences) {
      // Fetch preferences from API if not stored locally
      const message = await chrome.runtime.sendMessage({ 
        action: 'getSearchPreferences' 
      });
      
      if (!message.success) {
        return { success: false, error: 'Failed to get search preferences' };
      }
      
      preferences = message.preferences;
    }
    
    // Display a notification to the user
    showSearchNotification('JobHunter is running a search...');
    
    // For each job title preference, perform a search
    let allJobListings = [];
    
    for (const titlePref of preferences.job_title_preferences) {
      // Build search URLs for each location preference
      for (const locationPref of preferences.location_preferences) {
        const searchUrl = buildSearchUrl(titlePref.title, locationPref.city);
        
        // Navigate to the search URL
        window.location.href = searchUrl;
        
        // Wait for the page to load
        await waitForPageLoad();
        
        // Scrape job listings
        const jobListings = await scrapeJobListings();
        
        // Merge with existing listings
        allJobListings = [...allJobListings, ...jobListings];
      }
    }
    
    // Filter job listings based on industry preferences
    const filteredListings = filterListingsByIndustry(allJobListings, preferences.industry_preferences);
    
    // Store the job listings locally
    await storeJobListings(filteredListings);
    
    // Send the job listings to the backend
    await sendJobListings(credentials.token, filteredListings);
    
    // Display a completion notification
    showSearchNotification(`Found ${filteredListings.length} matching job listings!`);
    
    return { success: true, count: filteredListings.length };
  } catch (error) {
    console.error('Search error:', error);
    showSearchNotification('Error during job search.');
    return { success: false, error: error.message };
  }
}

// Build a LinkedIn job search URL
function buildSearchUrl(jobTitle, location) {
  const encodedTitle = encodeURIComponent(jobTitle);
  const encodedLocation = encodeURIComponent(location);
  return `https://www.linkedin.com/jobs/search/?keywords=${encodedTitle}&location=${encodedLocation}&sortBy=DD`;
}

// Wait for the page to fully load
function waitForPageLoad() {
  return new Promise(resolve => {
    // Check if the page has job cards
    const checkForJobCards = () => {
      const jobCards = document.querySelectorAll('.job-card-container');
      if (jobCards.length > 0) {
        resolve();
      } else {
        // Retry after a short delay
        setTimeout(checkForJobCards, 500);
      }
    };
    
    // Start checking
    setTimeout(checkForJobCards, 1000);
  });
}

// Scrape job listings from the search results page
async function scrapeJobListings() {
  const jobListings = [];
  const jobCards = document.querySelectorAll('.job-card-container');
  
  // Parse basic info from job cards
  for (const jobCard of jobCards) {
    const basicInfo = parseJobCard(jobCard);
    if (basicInfo) {
      jobListings.push(basicInfo);
    }
  }
  
  // For each job card, click it to load details and scrape additional info
  for (let i = 0; i < jobListings.length; i++) {
    // Find and click the corresponding job card
    const jobCards = document.querySelectorAll('.job-card-container');
    if (i < jobCards.length) {
      jobCards[i].click();
      
      // Wait for job details to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the job details panel
      const jobDetailsPanel = document.querySelector('.job-view-layout');
      if (jobDetailsPanel) {
        const detailedInfo = parseJobDetails(jobDetailsPanel);
        
        // Merge the detailed info with the basic info
        jobListings[i] = { ...jobListings[i], ...detailedInfo };
      }
    }
    
    // Add a short delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return jobListings;
}

// Filter job listings based on industry preferences
function filterListingsByIndustry(jobListings, industryPreferences) {
  // Extract blacklisted industries
  const blacklistedIndustries = industryPreferences
    .filter(pref => pref.is_blacklisted)
    .map(pref => pref.industry.toLowerCase());
  
  // Extract prioritized industries with their priority
  const prioritizedIndustries = industryPreferences
    .filter(pref => !pref.is_blacklisted)
    .reduce((acc, pref) => {
      acc[pref.industry.toLowerCase()] = pref.priority;
      return acc;
    }, {});
  
  // Filter out blacklisted industries
  const filteredListings = jobListings.filter(listing => {
    if (!listing.industry) return true; // Keep if no industry info
    
    const industryLower = listing.industry.toLowerCase();
    return !blacklistedIndustries.some(blacklisted => 
      industryLower.includes(blacklisted)
    );
  });
  
  // Sort by industry priority (if available)
  filteredListings.sort((a, b) => {
    if (!a.industry || !b.industry) return 0;
    
    const industryA = a.industry.toLowerCase();
    const industryB = b.industry.toLowerCase();
    
    const priorityA = Object.entries(prioritizedIndustries).reduce((highest, [industry, priority]) => {
      if (industryA.includes(industry) && priority > highest) return priority;
      return highest;
    }, 0);
    
    const priorityB = Object.entries(prioritizedIndustries).reduce((highest, [industry, priority]) => {
      if (industryB.includes(industry) && priority > highest) return priority;
      return highest;
    }, 0);
    
    return priorityB - priorityA; // Higher priority first
  });
  
  return filteredListings;
}

// Show a notification to the user
function showSearchNotification(message) {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('jobhunter-notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'jobhunter-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #0073b1;
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 14px;
      transition: opacity 0.3s ease-in-out;
    `;
    document.body.appendChild(notification);
  }
  
  // Update the message
  notification.textContent = message;
  notification.style.opacity = '1';
  
  // Hide after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}