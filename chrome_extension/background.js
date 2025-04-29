// Background script for the JobHunter extension

import { getAuthToken, getSearchPreferences } from './utils/api.js';
import { getStoredCredentials, storeCredentials, clearCredentials } from './utils/storage.js';

// Use more secure message handling for Chrome extensions in 2024+
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Use async handling with proper error management
  (async () => {
    try {
      if (message.action === 'login') {
        const result = await handleLogin(message.email, message.password);
        sendResponse(result);
      } 
      else if (message.action === 'logout') {
        const result = await handleLogout();
        sendResponse(result);
      }
      else if (message.action === 'getSearchPreferences') {
        const result = await handleGetSearchPreferences();
        sendResponse(result);
      }
      else if (message.action === 'startSearch') {
        const result = await handleStartSearch();
        sendResponse(result);
      }
      else if (message.action === 'checkLoginStatus') {
        const result = await handleCheckLoginStatus();
        sendResponse(result);
      }
      else {
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Indicates we'll respond asynchronously
});

// Handle login requests
async function handleLogin(email, password) {
  try {
    const token = await getAuthToken(email, password);
    await storeCredentials(email, token);
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Handle logout requests
async function handleLogout() {
  try {
    await clearCredentials();
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Handle search preferences requests
async function handleGetSearchPreferences() {
  try {
    const credentials = await getStoredCredentials();
    if (!credentials || !credentials.token) {
      return { success: false, error: 'Not logged in' };
    }
    
    const preferences = await getSearchPreferences(credentials.token);
    return { success: true, preferences };
  } catch (error) {
    console.error('Get preferences error:', error);
    return { success: false, error: error.message };
  }
}

// Handle starting a search
async function handleStartSearch() {
  try {
    // Check if we're already on LinkedIn
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url.includes('linkedin.com')) {
      // We're already on LinkedIn, just inject the script
      await chrome.tabs.sendMessage(tab.id, { action: 'startSearch' });
      return { success: true };
    } else {
      // Navigate to LinkedIn first
      await chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/jobs/' });
      
      // We'll need the content script to take over after the page loads
      // Store state to indicate search should start after navigation
      await chrome.storage.local.set({ pendingSearch: true });
      return { success: true, navigating: true };
    }
  } catch (error) {
    console.error('Start search error:', error);
    return { success: false, error: error.message };
  }
}

// Check login status
async function handleCheckLoginStatus() {
  try {
    const credentials = await getStoredCredentials();
    return { 
      loggedIn: !!(credentials && credentials.token), 
      email: credentials ? credentials.email : null 
    };
  } catch (error) {
    console.error('Check login status error:', error);
    return { loggedIn: false, error: error.message };
  }
}