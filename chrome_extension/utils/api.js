// API utility functions for communicating with the Rails backend

const API_BASE_URL = 'http://localhost:3000/api/v1';

/**
 * Get an authentication token from the server
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<string>} Authentication token
 */
export async function getAuthToken(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/sign_in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: {
          email,
          password
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('API authentication error:', error);
    throw error;
  }
}

/**
 * Get user's search preferences from the server
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Search preferences
 */
export async function getSearchPreferences(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/search_preferences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch search preferences');
    }

    return await response.json();
  } catch (error) {
    console.error('API get preferences error:', error);
    throw error;
  }
}

/**
 * Save a job listing to the server
 * @param {string} token - Authentication token
 * @param {Object} jobData - Job listing data
 * @returns {Promise<Object>} Saved job listing
 */
export async function saveJobListing(token, jobData) {
  try {
    const response = await fetch(`${API_BASE_URL}/job_listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({ job_listing: jobData })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save job listing');
    }

    return await response.json();
  } catch (error) {
    console.error('API save job listing error:', error);
    throw error;
  }
}

/**
 * Send multiple job listings to the server
 * @param {string} token - Authentication token
 * @param {Array<Object>} jobListings - Array of job listing data
 * @returns {Promise<Object>} Result with count of saved listings
 */
export async function sendJobListings(token, jobListings) {
  try {
    // Process in batches to avoid overwhelming the server
    const batchSize = 10;
    let savedCount = 0;
    
    for (let i = 0; i < jobListings.length; i += batchSize) {
      const batch = jobListings.slice(i, i + batchSize);
      
      const response = await fetch(`${API_BASE_URL}/job_listings/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ job_listings: batch })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to save batch starting at index ${i}`);
      }
      
      const result = await response.json();
      savedCount += result.saved_count || 0;
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return { success: true, saved_count: savedCount };
  } catch (error) {
    console.error('API send job listings error:', error);
    throw error;
  }
}

/**
 * Update a job listing status
 * @param {string} token - Authentication token
 * @param {string} id - Job listing ID
 * @param {string} status - New status value
 * @returns {Promise<Object>} Updated job listing
 */
export async function updateJobStatus(token, id, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/job_listings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({ job_listing: { status } })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update job status');
    }

    return await response.json();
  } catch (error) {
    console.error('API update job status error:', error);
    throw error;
  }
}