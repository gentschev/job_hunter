// chrome_extension/utils/api.js
(() => {
  const globalScope = typeof window !== 'undefined' ? window : self;

  // Ensure JobHunter base object exists on the global scope
  globalScope.JobHunter = globalScope.JobHunter || {};

  // Safely access log from JobHunter.log or fallback to console.log
  // Assuming common.js (which defines JobHunter.log) might be loaded in this scope
  const log = (globalScope.JobHunter && typeof globalScope.JobHunter.log === 'function')
    ? globalScope.JobHunter.log
    : (message, level = 'log') => {
        const prefix = '%cJobHunter (API)%c';
        const styles = [
          'color:#fff;background:#0073b1;padding:2px 4px;border-radius:3px;font-weight:bold;',
          'color:#222;'
        ];
        console[level](prefix, ...styles, message);
      };

  const API_BASE_URL = 'http://localhost:3000/api/v1';

  async function getAuthToken(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/sign_in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: { // Ensure this matches your Rails AuthController's expected params
            email,
            password
          }
        })
      });

      if (!response.ok) {
        // Try to parse error, but provide a fallback
        let errorMsg = 'Authentication failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch (e) {
          // Parsing JSON failed, stick with default or statusText
          errorMsg = response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      // Ensure your Rails API returns the token in data.token or data.user.token etc.
      // Based on your AuthController, it should be data.token
      if (!data.token) {
        throw new Error('Token not found in authentication response');
      }
      return data.token;
    } catch (error) {
      log(`API authentication error: ${error.message}`, 'error');
      throw error;
    }
  }

  async function getSearchPreferences(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/search_preferences`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token token=${token}` // Or `Bearer ${token}` if your API expects that
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch search preferences');
      }
      return await response.json();
    } catch (error) {
      log(`API get preferences error: ${error.message}`, 'error');
      throw error;
    }
  }

  async function sendJobListings(token, jobListings) {
    try {
      if (!token) {
        throw new Error('Authentication token is required');
      }
      
      if (!jobListings || !Array.isArray(jobListings)) {
        throw new Error('Job listings must be an array');
      }

      const batchSize = 10; // Example batch size
      let savedCount = 0;
      let errors = [];

      for (let i = 0; i < jobListings.length; i += batchSize) {
        const batch = jobListings.slice(i, i + batchSize);
        
        const response = await fetch(`${API_BASE_URL}/job_listings/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ job_listings: batch })
        });

        if (!response.ok) {
          const errorData = await response.json();
          errors.push({ batch_index: i, error: errorData.message || `Failed to save batch starting at index ${i}` });
          continue; // Or throw, depending on desired behavior
        }
        const result = await response.json();
        savedCount += result.saved_count || 0;
        if (result.errors && result.errors.length > 0) {
            errors.push(...result.errors);
        }
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
      }

      if (errors.length > 0) {
        log(`Errors during batch job listing send: ${JSON.stringify(errors)}`, 'warn');
      }
      return { success: true, saved_count: savedCount, errors: errors };

    } catch (error) {
      log(`API send job listings error: ${error.message}`, 'error');
      throw error;
    }
  }

  // Expose helpers on JobHunterAPI, which is on the global JobHunter object
  globalScope.JobHunter.JobHunterAPI = Object.assign(globalScope.JobHunter.JobHunterAPI || {}, {
    getAuthToken,
    getSearchPreferences,
    sendJobListings
    // Add other API functions here as needed (saveJobListing, updateJobStatus from your original Repomix)
  });

  log('JobHunterAPI helpers ready');
})();