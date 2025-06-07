// Popup script for the JobHunter extension - Simplified version without login

// Use modern JavaScript with proper DOM content loading approach
document.addEventListener('DOMContentLoaded', initializePopup);

// Main initialization function
function initializePopup() {
  // DOM elements
  const elements = {
    mainSection: document.getElementById('main-section'),
    loadingSection: document.getElementById('loading-section'),
    startSearchButton: document.getElementById('start-search-button'),
    viewDashboardButton: document.getElementById('view-dashboard-button'),
    editPreferencesButton: document.getElementById('edit-preferences-button'),
    searchMessage: document.getElementById('search-message'),
    loadingMessage: document.getElementById('loading-message')
  };

  // Event listeners
  elements.startSearchButton.addEventListener('click', () => handleStartSearch(elements));
  elements.viewDashboardButton.addEventListener('click', handleViewDashboard);
  elements.editPreferencesButton.addEventListener('click', handleEditPreferences);
  
  // Listen for search completion notifications
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'searchComplete') {
      handleSearchComplete(message.result, elements);
    } else if (message.action === 'searchError') {
      showSearchError(message.error, elements);
    }
  });
}

// Handle start search button click
async function handleStartSearch(elements) {
  try {
    showLoading('Starting job search...', elements);
    
    const response = await sendMessage({ action: 'startSearch' });
    
    if (response.success) {
      if (response.navigating) {
        // The search will continue after navigation, close the popup
        window.close();
      } else {
        // If not navigating, we'll receive the final result via a separate message
        // Keep the loading state until we get the result message
      }
    } else {
      hideLoading(elements);
      showSearchError(response.error || 'Search failed.', elements);
    }
  } catch (error) {
    console.error('Search error:', error);
    hideLoading(elements);
    showSearchError('Connection error starting search.', elements);
  }
}

// Handle search completion
function handleSearchComplete(result, elements) {
  hideLoading(elements);
  
  if (result.success) {
    showSearchSuccess(`Found ${result.count} matching job listings!`, elements);
  } else {
    showSearchError(result.error || 'Search failed.', elements);
  }
}

// Handle view dashboard button click
function handleViewDashboard() {
  chrome.tabs.create({ url: 'http://localhost:3000/dashboards/index' });
}

// Handle edit preferences button click
function handleEditPreferences() {
  chrome.tabs.create({ url: 'http://localhost:3000/search_preferences/edit' });
}

// Helper to send messages to the background script
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// UI helper functions
function showLoading(message, elements) {
  elements.mainSection.classList.add('hidden');
  elements.loadingSection.classList.remove('hidden');
  elements.loadingMessage.textContent = message || 'Loading...';
}

function hideLoading(elements) {
  elements.loadingSection.classList.add('hidden');
  elements.mainSection.classList.remove('hidden');
}

function showSearchError(errorMessage, elements) {
  elements.searchMessage.textContent = errorMessage;
  elements.searchMessage.classList.remove('hidden', 'success');
  elements.searchMessage.classList.add('error');
}

function showSearchSuccess(successMessage, elements) {
  elements.searchMessage.textContent = successMessage;
  elements.searchMessage.classList.remove('hidden', 'error');
  elements.searchMessage.classList.add('success');
}