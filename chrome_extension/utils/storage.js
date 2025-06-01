// chrome_extension/utils/storage.js
(() => {
  const globalScope = typeof window !== 'undefined' ? window : self;

  globalScope.JobHunter = globalScope.JobHunter || {};
  const log = (globalScope.JobHunter && typeof globalScope.JobHunter.log === 'function')
    ? globalScope.JobHunter.log
    : (message, level = 'log') => {
        const prefix = '%cJobHunter (Storage)%c';
        const styles = [
          'color:#fff;background:#0073b1;padding:2px 4px;border-radius:3px;font-weight:bold;',
          'color:#222;'
        ];
        console[level](prefix, ...styles, message);
      };

  async function storeCredentials(email, token) {
    try {
      await chrome.storage.local.set({
        credentials: { email, token, timestamp: Date.now() }
      });
      log('Credentials stored');
    } catch (error) {
      log(`Error storing credentials: ${error.message}`, 'error');
      throw error;
    }
  }

  async function getStoredCredentials() {
    try {
      const data = await chrome.storage.local.get('credentials');
      if (!data || !data.credentials) {
        return null;
      }
      // Optional: Add token expiry check here if relevant
      return data.credentials;
    } catch (error) {
      log(`Error getting stored credentials: ${error.message}`, 'error');
      throw error; // Re-throw so callers can handle it
    }
  }

  async function clearCredentials() {
    try {
      await chrome.storage.local.remove('credentials');
      log('Credentials cleared');
    } catch (error) {
      log(`Error clearing credentials: ${error.message}`, 'error');
      throw error;
    }
  }

  async function storeSearchPreferences(preferences) {
    try {
      await chrome.storage.local.set({
        searchPreferences: { data: preferences, timestamp: Date.now() }
      });
      log('Search preferences stored');
    } catch (error) {
      log(`Error storing search preferences: ${error.message}`, 'error');
      throw error;
    }
  }

  async function getStoredSearchPreferences() {
    try {
      const data = await chrome.storage.local.get('searchPreferences');
      if (!data || !data.searchPreferences) {
        return null;
      }
      const ONE_HOUR = 60 * 60 * 1000;
      if (Date.now() - data.searchPreferences.timestamp > ONE_HOUR) {
        log('Search preferences data is stale.');
        return null; // Stale data, should refresh from server
      }
      return data.searchPreferences.data;
    } catch (error) {
      log(`Error getting stored search preferences: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async function getPendingSearch() {
    try {
      const data = await chrome.storage.local.get('pendingSearch');
      return !!(data && data.pendingSearch);
    } catch (error) {
      log(`Error getting pending search flag: ${error.message}`, 'error');
      return false;
    }
  }

  async function clearPendingSearch() {
    try {
      await chrome.storage.local.remove('pendingSearch');
      log('Pending search flag cleared');
    } catch (error) {
      log(`Error clearing pending search flag: ${error.message}`, 'error');
      throw error;
    }
  }


  globalScope.JobHunter.JobHunterStorage = Object.assign(globalScope.JobHunter.JobHunterStorage || {}, {
    storeCredentials,
    getStoredCredentials,
    clearCredentials,
    storeSearchPreferences,
    getStoredSearchPreferences,
    getPendingSearch,
    clearPendingSearch
    // Add other storage functions here (storeJobListings, getJobListings, clearJobListings from your Repomix output)
  });

  log('JobHunterStorage helpers ready');
})();