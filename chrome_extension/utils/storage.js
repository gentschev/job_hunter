// Storage utility functions for the Chrome extension

/**
 * Store user credentials in Chrome's local storage
 * @param {string} email - User's email
 * @param {string} token - Authentication token
 * @returns {Promise<void>}
 */
export async function storeCredentials(email, token) {
  try {
    await chrome.storage.local.set({
      credentials: {
        email,
        token,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error storing credentials:', error);
    throw error;
  }
}

/**
 * Get stored credentials from Chrome's local storage
 * @returns {Promise<Object|null>} Credentials object or null if not found
 */
export async function getStoredCredentials() {
  try {
    const data = await chrome.storage.local.get('credentials');
    if (!data || !data.credentials) {
      return null;
    }
    
    // Optional: Check if token is expired (e.g., if timestamp is too old)
    // This depends on your token expiration policy
    
    return data.credentials;
  } catch (error) {
    console.error('Error getting credentials:', error);
    throw error;
  }
}

/**
 * Clear stored credentials from Chrome's local storage
 * @returns {Promise<void>}
 */
export async function clearCredentials() {
  try {
    await chrome.storage.local.remove('credentials');
  } catch (error) {
    console.error('Error clearing credentials:', error);
    throw error;
  }
}

/**
 * Store search preferences in Chrome's local storage for quick access
 * @param {Object} preferences - Search preferences object
 * @returns {Promise<void>}
 */
export async function storeSearchPreferences(preferences) {
  try {
    await chrome.storage.local.set({
      searchPreferences: {
        data: preferences,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error storing search preferences:', error);
    throw error;
  }
}

/**
 * Get stored search preferences from Chrome's local storage
 * @returns {Promise<Object|null>} Search preferences or null if not found
 */
export async function getStoredSearchPreferences() {
  try {
    const data = await chrome.storage.local.get('searchPreferences');
    if (!data || !data.searchPreferences) {
      return null;
    }
    
    // Optional: Check if preferences are stale (e.g., if timestamp is too old)
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - data.searchPreferences.timestamp > ONE_HOUR) {
      return null; // Stale data, should refresh from server
    }
    
    return data.searchPreferences.data;
  } catch (error) {
    console.error('Error getting search preferences:', error);
    throw error;
  }
}

/**
 * Store job listings in Chrome's local storage
 * @param {Array<Object>} jobListings - Array of job listing objects
 * @returns {Promise<void>}
 */
export async function storeJobListings(jobListings) {
  try {
    // First get existing listings to avoid overwriting
    const existing = await getStoredJobListings();
    
    // Merge listings, avoiding duplicates by external_id
    const mergedListings = [...existing];
    const existingIds = new Set(existing.map(job => job.external_id));
    
    for (const job of jobListings) {
      if (!existingIds.has(job.external_id)) {
        mergedListings.push(job);
        existingIds.add(job.external_id);
      }
    }
    
    // Store with timestamp
    await chrome.storage.local.set({
      jobListings: {
        data: mergedListings,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error storing job listings:', error);
    throw error;
  }
}

/**
 * Get stored job listings from Chrome's local storage
 * @returns {Promise<Array<Object>>} Array of job listing objects
 */
export async function getStoredJobListings() {
  try {
    const data = await chrome.storage.local.get('jobListings');
    if (!data || !data.jobListings || !data.jobListings.data) {
      return [];
    }
    
    return data.jobListings.data;
  } catch (error) {
    console.error('Error getting job listings:', error);
    return [];
  }
}

/**
 * Clear stored job listings from Chrome's local storage
 * @returns {Promise<void>}
 */
export async function clearJobListings() {
  try {
    await chrome.storage.local.remove('jobListings');
  } catch (error) {
    console.error('Error clearing job listings:', error);
    throw error;
  }
}

/**
 * Check if there's a pending search flag
 * @returns {Promise<boolean>} True if there's a pending search
 */
export async function getPendingSearch() {
  try {
    const data = await chrome.storage.local.get('pendingSearch');
    return !!(data && data.pendingSearch);
  } catch (error) {
    console.error('Error getting pending search flag:', error);
    return false;
  }
}

/**
 * Clear the pending search flag
 * @returns {Promise<void>}
 */
export async function clearPendingSearch() {
  try {
    await chrome.storage.local.remove('pendingSearch');
  } catch (error) {
    console.error('Error clearing pending search flag:', error);
    throw error;
  }
}