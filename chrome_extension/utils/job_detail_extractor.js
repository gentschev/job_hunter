// chrome_extension/utils/job_detail_extractor.js
(() => {
  const globalScope = typeof window !== 'undefined' ? window : self;

  globalScope.JobHunter = globalScope.JobHunter || {};
  const log = (globalScope.JobHunter && typeof globalScope.JobHunter.log === 'function')
    ? globalScope.JobHunter.log
    : (message, level = 'log') => {
        const prefix = '%cJobHunter (Detail Extractor)%c';
        const styles = [
          'color:#fff;background:#0073b1;padding:2px 4px;border-radius:3px;font-weight:bold;',
          'color:#222;'
        ];
        console[level](prefix, ...styles, message);
      };

  /**
   * Extract job details from a job posting page or expanded job panel
   * @param {string} jobId - The job ID to extract details for
   * @returns {Object|null} - Structured job data or null if extraction fails
   */
  function extractJobDetails(jobId) {
    try {
      log(`Starting job detail extraction for job ID: ${jobId}`);

      // Initialize job data structure
      const jobData = {
        external_id: jobId,
        title: null,
        company: null,
        location: null,
        description: null,
        posted_date: null,
        employment_type: null,
        experience_level: null,
        salary_information: null,
        url: `https://www.linkedin.com/jobs/view/${jobId}/`,
        raw_data: {},
        extraction_timestamp: new Date().toISOString()
      };

      // Strategy 1: Extract from JSON data containers (preferred)
      const jsonData = extractFromJSON(jobId);
      if (jsonData) {
        Object.assign(jobData, jsonData);
        jobData.extraction_method = 'json';
        log(`Successfully extracted job details from JSON for job ${jobId}`);
        return jobData;
      }

      // Strategy 2: Extract from DOM elements (fallback)
      const domData = extractFromDOM(jobId);
      if (domData) {
        Object.assign(jobData, domData);
        jobData.extraction_method = 'dom';
        log(`Successfully extracted job details from DOM for job ${jobId}`);
        return jobData;
      }

      // Strategy 3: Extract from expanded job panel (last resort)
      const panelData = extractFromJobPanel(jobId);
      if (panelData) {
        Object.assign(jobData, panelData);
        jobData.extraction_method = 'panel';
        log(`Successfully extracted job details from panel for job ${jobId}`);
        return panelData;
      }

      log(`Failed to extract job details for job ${jobId}`, 'warn');
      return null;

    } catch (error) {
      log(`Error extracting job details for ${jobId}: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Extract job details from JSON data structures
   * @param {string} jobId - The job ID to look for
   * @returns {Object|null} - Job data or null
   */
  function extractFromJSON(jobId) {
    try {
      // Find JSON containers that might contain detailed job data
      const containers = document.querySelectorAll('code[id*="bpr-guid"], script[type="application/json"]');
      
      for (const container of containers) {
        try {
          const jsonData = JSON.parse(container.textContent);
          const jobDetails = searchForJobDetails(jsonData, jobId);
          
          if (jobDetails) {
            return jobDetails;
          }
        } catch (e) {
          // Skip malformed JSON containers
          continue;
        }
      }

      return null;
    } catch (error) {
      log(`Error in JSON extraction: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Recursively search JSON data for job details matching the job ID
   * @param {Object} data - JSON data to search
   * @param {string} targetJobId - Job ID to match
   * @returns {Object|null} - Job details or null
   */
  function searchForJobDetails(data, targetJobId) {
    if (!data || typeof data !== 'object') return null;

    // Look for job posting structures
    if (data.jobPosting || data.jobPostingCard) {
      const jobData = data.jobPosting || data.jobPostingCard;
      
      // Check if this matches our target job ID
      const foundJobId = extractJobIdFromJobData(jobData);
      if (foundJobId === targetJobId) {
        return extractJobFieldsFromJSON(jobData);
      }
    }

    // Search for job view data structures
    if (data.jobView || data.jobDetails) {
      const jobViewData = data.jobView || data.jobDetails;
      const foundJobId = extractJobIdFromJobData(jobViewData);
      
      if (foundJobId === targetJobId) {
        return extractJobFieldsFromJSON(jobViewData);
      }
    }

    // Recursively search nested objects and arrays
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const result = searchForJobDetails(item, targetJobId);
          if (result) return result;
        }
      } else if (typeof value === 'object' && value !== null) {
        const result = searchForJobDetails(value, targetJobId);
        if (result) return result;
      }
    }

    return null;
  }

  /**
   * Extract job ID from various job data structures
   * @param {Object} jobData - Job data object
   * @returns {string|null} - Job ID or null
   */
  function extractJobIdFromJobData(jobData) {
    if (!jobData) return null;

    // Check direct ID fields
    if (jobData.jobId) return jobData.jobId.toString();
    if (jobData.id) return jobData.id.toString();
    if (jobData.entityUrn) {
      const match = jobData.entityUrn.match(/\d+/);
      if (match) return match[0];
    }

    // Check URN fields
    if (jobData.urn && jobData.urn.includes('jobPosting')) {
      const match = jobData.urn.match(/\((\d+),/);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Extract job fields from JSON job data
   * @param {Object} jobData - JSON job data object
   * @returns {Object} - Extracted job fields
   */
  function extractJobFieldsFromJSON(jobData) {
    const fields = {};

    try {
      // Extract title
      if (jobData.title) {
        fields.title = typeof jobData.title === 'string' ? jobData.title : jobData.title.text;
      }

      // Extract company information
      if (jobData.company) {
        if (typeof jobData.company === 'string') {
          fields.company = jobData.company;
        } else if (jobData.company.name) {
          fields.company = jobData.company.name;
        } else if (jobData.company.companyName) {
          fields.company = jobData.company.companyName;
        }
      }

      // Extract location
      if (jobData.location) {
        if (typeof jobData.location === 'string') {
          fields.location = jobData.location;
        } else if (jobData.location.name) {
          fields.location = jobData.location.name;
        } else if (jobData.location.displayName) {
          fields.location = jobData.location.displayName;
        }
      }

      // Extract description
      if (jobData.description) {
        fields.description = typeof jobData.description === 'string' 
          ? jobData.description 
          : jobData.description.text || JSON.stringify(jobData.description);
      }

      // Extract employment type
      if (jobData.employmentType) {
        fields.employment_type = jobData.employmentType;
      }

      // Extract experience level
      if (jobData.experienceLevel) {
        fields.experience_level = jobData.experienceLevel;
      }

      // Extract posted date
      if (jobData.postedAt || jobData.listedAt || jobData.createdAt) {
        const timestamp = jobData.postedAt || jobData.listedAt || jobData.createdAt;
        fields.posted_date = new Date(timestamp).toISOString();
      }

      // Store raw data for debugging
      fields.raw_data = jobData;

      log(`Extracted fields from JSON: ${Object.keys(fields).join(', ')}`);
      return fields;

    } catch (error) {
      log(`Error extracting fields from JSON: ${error.message}`, 'error');
      return { raw_data: jobData };
    }
  }

  /**
   * Extract job details from DOM elements (fallback method)
   * @param {string} jobId - Job ID to extract details for
   * @returns {Object|null} - Job data or null
   */
  function extractFromDOM(jobId) {
    try {
      const fields = {};

      // Common job detail selectors
      const selectors = {
        title: [
          'h1[data-test-id="job-title"]',
          '.job-details-jobs-unified-top-card__job-title h1',
          '.jobs-unified-top-card__job-title h1',
          'h1.t-24'
        ],
        company: [
          '[data-test-id="job-details-company-name"]',
          '.job-details-jobs-unified-top-card__company-name a',
          '.jobs-unified-top-card__company-name a',
          '.jobs-poster__company-name'
        ],
        location: [
          '[data-test-id="job-details-location"]',
          '.job-details-jobs-unified-top-card__bullet span',
          '.jobs-unified-top-card__bullet span',
          '.jobs-poster__location'
        ],
        description: [
          '[data-test-id="job-details-description"]',
          '.jobs-description-content__text',
          '.jobs-box__html-content',
          '.description'
        ]
      };

      // Extract each field using selectors
      for (const [field, selectorList] of Object.entries(selectors)) {
        for (const selector of selectorList) {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim()) {
            fields[field] = element.textContent.trim();
            break;
          }
        }
      }

      // Only return data if we found at least title and company
      if (fields.title && fields.company) {
        log(`Successfully extracted from DOM: ${Object.keys(fields).join(', ')}`);
        return fields;
      }

      return null;

    } catch (error) {
      log(`Error in DOM extraction: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Extract job details from expanded job panel (when job is selected in search results)
   * @param {string} jobId - Job ID to extract details for
   * @returns {Object|null} - Job data or null
   */
  function extractFromJobPanel(jobId) {
    try {
      // Look for job panel containers
      const panelSelectors = [
        '.jobs-search__job-details',
        '.job-details-container',
        '.jobs-details',
        '[data-job-id="' + jobId + '"]'
      ];

      let jobPanel = null;
      for (const selector of panelSelectors) {
        jobPanel = document.querySelector(selector);
        if (jobPanel) break;
      }

      if (!jobPanel) {
        log(`No job panel found for job ${jobId}`);
        return null;
      }

      const fields = {};

      // Extract title from panel
      const titleElement = jobPanel.querySelector('h1, .job-title, [data-test="job-title"]');
      if (titleElement) {
        fields.title = titleElement.textContent.trim();
      }

      // Extract company from panel
      const companyElement = jobPanel.querySelector('.company-name, [data-test="company-name"], .jobs-poster__company-name');
      if (companyElement) {
        fields.company = companyElement.textContent.trim();
      }

      // Extract description from panel
      const descriptionElement = jobPanel.querySelector('.job-description, .jobs-description, [data-test="job-description"]');
      if (descriptionElement) {
        fields.description = descriptionElement.textContent.trim();
      }

      if (fields.title || fields.company) {
        log(`Successfully extracted from job panel: ${Object.keys(fields).join(', ')}`);
        return fields;
      }

      return null;

    } catch (error) {
      log(`Error in job panel extraction: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Navigate to a specific job's detail page and extract information
   * @param {string} jobId - Job ID to navigate to
   * @returns {Promise<Object|null>} - Promise resolving to job data or null
   */
  async function navigateAndExtract(jobId) {
    try {
      log(`Navigating to job detail page for job ${jobId}`);

      const jobUrl = `https://www.linkedin.com/jobs/view/${jobId}/`;
      
      // Check if we're already on the correct page
      if (window.location.href.includes(jobId)) {
        // Wait for page to load
        await waitForJobDetailsToLoad();
        return extractJobDetails(jobId);
      }

      // Navigate to the job page
      window.location.href = jobUrl;

      // Wait for navigation and page load
      return new Promise((resolve) => {
        const checkLoaded = setInterval(async () => {
          if (window.location.href.includes(jobId)) {
            clearInterval(checkLoaded);
            await waitForJobDetailsToLoad();
            const jobData = extractJobDetails(jobId);
            resolve(jobData);
          }
        }, 500);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkLoaded);
          log(`Navigation timeout for job ${jobId}`, 'warn');
          resolve(null);
        }, 10000);
      });

    } catch (error) {
      log(`Error navigating to job ${jobId}: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Wait for job details to load on the page
   * @returns {Promise<void>}
   */
  function waitForJobDetailsToLoad() {
    return new Promise((resolve) => {
      const checkForContent = () => {
        // Look for key job detail elements
        const hasTitle = document.querySelector('h1[data-test-id="job-title"], .jobs-unified-top-card__job-title h1');
        const hasCompany = document.querySelector('[data-test-id="job-details-company-name"], .jobs-unified-top-card__company-name');
        const hasDescription = document.querySelector('.jobs-description-content__text, .jobs-box__html-content');

        if (hasTitle && hasCompany) {
          log('Job details loaded successfully');
          resolve();
        } else {
          // Keep checking for up to 5 seconds
          setTimeout(checkForContent, 100);
        }
      };

      checkForContent();

      // Timeout after 5 seconds
      setTimeout(() => {
        log('Job details load timeout', 'warn');
        resolve();
      }, 5000);
    });
  }

  /**
   * Extract job details for multiple job IDs with rate limiting
   * @param {Array<string>} jobIds - Array of job IDs to extract
   * @param {Object} options - Options for extraction
   * @returns {Promise<Array<Object>>} - Promise resolving to array of job data
   */
  async function extractMultipleJobDetails(jobIds, options = {}) {
    const {
      delayBetweenRequests = 2000, // 2 second delay between requests
      maxConcurrent = 1, // Process one at a time to avoid detection
      onProgress = null // Progress callback function
    } = options;

    const results = [];
    const total = jobIds.length;

    log(`Starting extraction for ${total} jobs with ${delayBetweenRequests}ms delay`);

    for (let i = 0; i < jobIds.length; i++) {
      const jobId = jobIds[i];
      
      try {
        // Report progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: total,
            jobId: jobId,
            status: 'processing'
          });
        }

        // Extract job details
        const jobData = await navigateAndExtract(jobId);
        
        if (jobData) {
          results.push(jobData);
          log(`Successfully extracted job ${i + 1}/${total}: ${jobId}`);
        } else {
          log(`Failed to extract job ${i + 1}/${total}: ${jobId}`, 'warn');
          results.push({
            external_id: jobId,
            extraction_error: 'Failed to extract job details',
            extraction_timestamp: new Date().toISOString()
          });
        }

        // Add delay between requests (except for the last one)
        if (i < jobIds.length - 1) {
          log(`Waiting ${delayBetweenRequests}ms before next extraction...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
        }

      } catch (error) {
        log(`Error processing job ${jobId}: ${error.message}`, 'error');
        results.push({
          external_id: jobId,
          extraction_error: error.message,
          extraction_timestamp: new Date().toISOString()
        });
      }
    }

    log(`Completed extraction for ${results.length}/${total} jobs`);
    return results;
  }

  // Export functions to global scope
  globalScope.JobHunter.JobDetailExtractor = Object.assign(globalScope.JobHunter.JobDetailExtractor || {}, {
    extractJobDetails,
    extractFromJSON,
    extractFromDOM,
    extractFromJobPanel,
    navigateAndExtract,
    extractMultipleJobDetails,
    waitForJobDetailsToLoad
  });

  log('Job Detail Extractor ready');
})();