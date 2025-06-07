/**
 * @file chrome_extension/background.js
 * @description Service worker for the JobHunter Chrome Extension (Manifest V3).
 * Handles core background tasks such as authentication, communication between
 * popup/content scripts, and managing the job search process.
 * This script operates as a classic script, not an ES module.
 */

// Import utility scripts. These scripts are expected to attach their respective
// objects (e.g., JobHunterAPI, JobHunterStorage) to the global 'self.JobHunter' namespace.
// 'content/common.js' should ideally be imported first if it sets up 'self.JobHunter' and 'self.JobHunter.log'.
importScripts(
  'content/common.js',
  'utils/api.js',
  'utils/storage.js'
  // 'utils/parser.js' // Uncomment if background script needs direct access to parser functions
);

// Assign convenient references to the imported utility modules.
// These fallbacks ensure the script doesn't crash if a utility fails to load/initialize.
const Common = self.JobHunter || {};
const API = (self.JobHunter && self.JobHunter.JobHunterAPI) || {};
const Storage = (self.JobHunter && self.JobHunter.JobHunterStorage) || {};

/**
 * Logger function for the background script.
 * Uses the log function from Common utilities if available, otherwise falls back to console.log.
 * @param {string} msg - The message to log.
 * @param {'log'|'info'|'warn'|'error'} [level='log'] - The log level.
 */
const log = typeof Common.log === 'function'
  ? (msg, level) => Common.log(msg, level, 'BG') // Pass a component name like 'BG' if common.log supports it
  : (msg, level = 'log') => {
      console[level](
        '%cJobHunter (BG)%c ' + msg,
        'color:#fff;background:#4B8BFF;padding:2px 4px;border-radius:3px;font-weight:bold;',
        'color:#222;'
      );
    };

log('Background service worker started and utilities loaded.', 'info');

/**
 * Listener for messages sent from other parts of the extension (popup, content scripts).
 * Routes messages to appropriate handler functions based on `message.action`.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    log(`Received message: action = "${message.action}"`, 'info');
    try {
      let result;
      switch (message.action) {
        case 'login':
          result = await handleLogin(message.email, message.password);
          break;
        case 'logout':
          result = await handleLogout();
          break;
        case 'getSearchPreferences':
          result = await handleGetSearchPreferences();
          break;
        case 'startSearch':
          // Pass sender.tab to handleStartSearch to provide context about the calling tab if available
          result = await handleStartSearch(sender.tab);
          break;
        case 'checkLoginStatus':
          result = await handleCheckLoginStatus();
          break;
        default:
          result = { success: false, error: 'Unknown action' };
          log(`Unknown action received: "${message.action}"`, 'warn');
      }
      sendResponse(result);
    } catch (err) {
      log(`Error in message handler for action "${message.action}": ${err.message}`, 'error');
      sendResponse({ success: false, error: String(err.message || err) });
    }
  })();

  // Return true to indicate that sendResponse will be called asynchronously.
  return true;
});

/**
 * Handles user login by authenticating against the backend and storing credentials.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<object>} Object indicating success or failure with an error message.
 */
async function handleLogin(email, password) {
  try {
    if (!API.getAuthToken) throw new Error("API.getAuthToken utility is not available.");
    const token = await API.getAuthToken(email, password);

    if (!Storage.storeCredentials) throw new Error("Storage.storeCredentials utility is not available.");
    await Storage.storeCredentials(email, token);

    log('Login successful, credentials stored.');
    return { success: true, email: email };
  } catch (err) {
    log(`Login failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

/**
 * Handles user logout by clearing stored credentials.
 * @returns {Promise<object>} Object indicating success or failure with an error message.
 */
async function handleLogout() {
  try {
    if (!Storage.clearCredentials) throw new Error("Storage.clearCredentials utility is not available.");
    await Storage.clearCredentials();
    log('Logout successful, credentials cleared.');
    return { success: true };
  } catch (err) {
    log(`Logout failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

/**
 * Fetches search preferences for the logged-in user from the backend API.
 * @returns {Promise<object>} Object containing preferences on success, or error details.
 * Note: Login requirement has been removed for testing purposes.
 */
async function handleGetSearchPreferences() {
  try {
    log('Skipping authentication check for search preferences (simplified version)');
    
    // Return dummy preferences for now - no API call needed
    return { 
      success: true, 
      preferences: {
        job_titles: ["Software Engineer", "Full Stack Developer"],
        locations: ["Remote", "San Francisco, CA"],
        industries: ["Technology", "Software"]
      } 
    };
    
    /* Original code with authentication - commented out
    if (!Storage.getStoredCredentials) throw new Error("Storage.getStoredCredentials utility is not available.");
    const creds = await Storage.getStoredCredentials();

    if (!creds?.token) {
      log('Cannot get search preferences: Not logged in.', 'warn');
      return { success: false, error: 'Not logged in' };
    }

    if (!API.getSearchPreferences) throw new Error("API.getSearchPreferences utility is not available.");
    const prefs = await API.getSearchPreferences(creds.token);

    log('Search preferences retrieved.');
    return { success: true, preferences: prefs };
    */
  } catch (err) {
    log(`Failed to get search preferences: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

/**
 * Initiates a job search.
 * If already on LinkedIn, sends a message to the content script to start.
 * Otherwise, navigates to LinkedIn Jobs and sets a flag for the search to resume on page load.
 * @param {chrome.tabs.Tab} [senderTab] - The tab from which the message was sent (if applicable).
 * @returns {Promise<object>} Object indicating success and if navigation is occurring.
 */
async function handleStartSearch(senderTab) {
  try {
    let tabToUse = senderTab;

    // If senderTab is not the active content tab (e.g., if message is from popup),
    // find the active tab in the last focused window.
    if (!tabToUse || (senderTab && senderTab.url && !senderTab.url.startsWith("http"))) {
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      tabToUse = activeTab;
    }

    // If no suitable tab is found (e.g., all windows minimized), create a new tab.
    if (!tabToUse) {
      log('No active tab found for search, creating a new tab for LinkedIn Jobs.');
      tabToUse = await chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/' });
      await chrome.storage.local.set({ pendingSearch: true });
      log('Navigating to LinkedIn, search pending.');
      return { success: true, navigating: true };
    }

    // If the determined tab is already on LinkedIn, send a message to its content script.
    if (tabToUse.url && tabToUse.url.includes('linkedin.com')) {
      log(`Starting search on existing LinkedIn tab: ID ${tabToUse.id}`);
      // Ensure content script is listening for { action: 'startSearch' }
      const response = await chrome.tabs.sendMessage(tabToUse.id, { action: 'startSearch' });
      log(`Received response from content script: ${JSON.stringify(response)}`);
      return { success: true };
    }

    // Otherwise, update the tab's URL to LinkedIn Jobs and set the pendingSearch flag.
    log(`Navigating tab ${tabToUse.id} to LinkedIn Jobs, search pending.`);
    await chrome.tabs.update(tabToUse.id, { url: 'https://www.linkedin.com/jobs/' });
    await chrome.storage.local.set({ pendingSearch: true });
    return { success: true, navigating: true };

  } catch (err) {
    log(`Failed to start search: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

/**
 * Checks the current login status by looking for stored credentials.
 * @returns {Promise<object>} Object indicating login status and user email if logged in.
 */
async function handleCheckLoginStatus() {
  try {
    if (!Storage.getStoredCredentials) throw new Error("Storage.getStoredCredentials utility is not available.");
    const creds = await Storage.getStoredCredentials();
    const loggedIn = !!(creds && creds.token);
    log(`Login status checked: ${loggedIn ? 'Logged in as ' + creds.email : 'Not logged in'}`);
    return {
      loggedIn: loggedIn,
      email: creds?.email || null,
    };
  } catch (err) {
    log(`Error checking login status: ${err.message}`, 'error');
    return { loggedIn: false, error: err.message };
  }
}

/**
 * Listener for tab updates. Used to resume a pending job search after
 * the extension navigates to LinkedIn Jobs.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Proceed only if the tab has finished loading and is a LinkedIn jobs page.
  if (changeInfo.status !== 'complete' || !tab.url || !tab.url.includes('linkedin.com/jobs')) {
    return;
  }

  try {
    const isPending = Storage.getPendingSearch
      ? await Storage.getPendingSearch()
      : (await chrome.storage.local.get('pendingSearch')).pendingSearch;

    if (!isPending) {
      return;
    }

    log(`Tab ${tabId} updated to LinkedIn Jobs and a search is pending. Resuming...`);

    if (Storage.clearPendingSearch) {
      await Storage.clearPendingSearch();
    } else {
      await chrome.storage.local.remove('pendingSearch');
    }

    // Send message to content script to start the search.
    await chrome.tabs.sendMessage(tabId, { action: 'startSearch' });
    log(`Resumed search on tab ${tabId} after navigation.`);
  } catch (err) {
    log(`Failed to resume search on tab ${tabId}: ${err.message}`, 'error');
  }
});

/**
 * Listener for extension installation or update.
 * Can be used for initial setup or data migrations.
 */
chrome.runtime.onInstalled.addListener(details => {
  log(`Extension event: ${details.reason}. Version: ${chrome.runtime.getManifest().version}`);
  if (details.reason === 'install') {
    log('Performing first-time setup tasks...');
    // Example: Initialize default settings in chrome.storage.local if needed
  } else if (details.reason === 'update') {
    log('Extension updated. Performing any necessary migrations...');
  }
});

/**
 * Listener for messages from content scripts.
 * This handles 'searchComplete' and 'searchError' messages and forwards them to the popup.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log(`Received message from content script: ${JSON.stringify(message)}`);
  
  // Forward search-related messages to any open popup
  if (message.action === 'searchComplete' || message.action === 'searchError') {
    log(`Forwarding ${message.action} message to popup`);
    chrome.runtime.sendMessage(message).catch(err => {
      // This will happen if no popup is open to receive the message - it's normal
      log(`No receiver for ${message.action} message: ${err.message}`, 'info');
    });
  }
  
  sendResponse({ received: true });
});