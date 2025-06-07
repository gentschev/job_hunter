// chrome_extension/utils/json_parser.js
(() => {
  const globalScope = typeof window !== 'undefined' ? window : self;

  globalScope.JobHunter = globalScope.JobHunter || {};
  const log = (globalScope.JobHunter && typeof globalScope.JobHunter.log === 'function')
    ? globalScope.JobHunter.log
    : (message, level = 'log') => {
        const prefix = '%cJobHunter (JSON Parser)%c';
        const styles = [
          'color:#fff;background:#0073b1;padding:2px 4px;border-radius:3px;font-weight:bold;',
          'color:#222;'
        ];
        console[level](prefix, ...styles, message);
      };

  /**
   * Extract job IDs from URN format
   * @param {string} urn - URN like "urn:li:fsd_jobPostingCard:(4226352667,SEMANTIC_SEARCH)"
   * @returns {string|null} - Job ID or null if not found
   */
  function extractJobIdFromURN(urn) {
    try {
      if (!urn || typeof urn !== 'string') return null;
      
      const match = urn.match(/\((\d+),/);
      return match ? match[1] : null;
    } catch (e) {
      log(`Error extracting job ID from URN "${urn}": ${e.message}`, 'error');
      return null;
    }
  }

  /**
   * Find all JSON containers in the document
   * @returns {NodeList} - All code elements that might contain job data
   */
  function findJobDataContainers() {
    try {
      // Multiple selector strategies for finding JSON containers
      const selectors = [
        'code[id*="bpr-guid"]',
        'code[id*="datalet"]',
        'script[type="application/json"]',
        'code:not([class]):not([style])', // Unclassed code elements
      ];

      let containers = [];
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        containers = containers.concat(Array.from(elements));
      });

      // Remove duplicates
      containers = [...new Set(containers)];
      
      log(`Found ${containers.length} potential JSON containers`);
      return containers;
    } catch (e) {
      log(`Error finding JSON containers: ${e.message}`, 'error');
      return [];
    }
  }

  /**
   * Safely parse JSON with multiple strategies
   * @param {string} jsonText - JSON string to parse
   * @returns {Object|null} - Parsed object or null if failed
   */
  function parseJobJSON(jsonText) {
    try {
      if (!jsonText || typeof jsonText !== 'string') return null;

      // Clean and prepare JSON text
      let cleanJson = jsonText.trim();
      
      // Handle HTML entities
      cleanJson = cleanJson
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      // Try parsing directly
      try {
        return JSON.parse(cleanJson);
      } catch (e1) {
        // Try with different cleaning strategies
        log(`First JSON parse failed, trying fallback strategies`, 'warn');
        
        // Remove any leading/trailing non-JSON content
        const jsonMatch = cleanJson.match(/\{.*\}/s);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        throw e1;
      }
    } catch (e) {
      log(`JSON parsing failed: ${e.message}`, 'error');
      return null;
    }
  }

  /**
   * Extract job cards from parsed JSON data
   * @param {Object} data - Parsed JSON object
   * @returns {Array} - Array of job card objects
   */
  function extractJobCards(data) {
    try {
      if (!data || typeof data !== 'object') return [];

      const jobCards = [];

      // Recursive function to search for job cards in nested objects
      function searchForJobCards(obj, path = '') {
        if (!obj || typeof obj !== 'object') return;

        // Look for job card patterns
        if (obj.jobCard) {
          jobCards.push(obj.jobCard);
          log(`Found job card at path: ${path}.jobCard`);
        }

        if (obj.jobPostingCard || obj.jobPostingCardWrapper) {
          jobCards.push(obj);
          log(`Found job posting card at path: ${path}`);
        }

        // Look for URN patterns
        if (typeof obj === 'string' && obj.includes('urn:li:fsd_jobPostingCard:')) {
          jobCards.push({ urn: obj });
          log(`Found job URN at path: ${path}`);
        }

        // Recursively search nested objects and arrays
        for (const [key, value] of Object.entries(obj)) {
          const newPath = path ? `${path}.${key}` : key;
          
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              searchForJobCards(item, `${newPath}[${index}]`);
            });
          } else if (typeof value === 'object') {
            searchForJobCards(value, newPath);
          }
        }
      }

      searchForJobCards(data);
      return jobCards;
    } catch (e) {
      log(`Error extracting job cards: ${e.message}`, 'error');
      return [];
    }
  }

  /**
   * Extract job metadata from job card data
   * @param {Object} jobCard - Job card object from JSON
   * @returns {Object|null} - Structured job data or null
   */
  function extractJobMetadata(jobCard) {
    try {
      if (!jobCard) return null;

      const metadata = {
        external_id: null,
        url: null,
        tracking_data: {},
        urn: null,
        raw_data: jobCard
      };

      // Extract from URN (simple case)
      if (jobCard.urn) {
        metadata.urn = jobCard.urn;
        metadata.external_id = extractJobIdFromURN(jobCard.urn);
      }

      // Extract from job posting card wrapper
      if (jobCard.jobPostingCardWrapper) {
        const wrapper = jobCard.jobPostingCardWrapper;
        
        if (wrapper['*jobPostingCard']) {
          metadata.urn = wrapper['*jobPostingCard'];
          metadata.external_id = extractJobIdFromURN(wrapper['*jobPostingCard']);
        }

        if (wrapper.jobTrackingData) {
          metadata.tracking_data = wrapper.jobTrackingData;
          
          if (wrapper.jobTrackingData.navigationAction?.actionTarget) {
            metadata.url = wrapper.jobTrackingData.navigationAction.actionTarget;
          }
        }
      }

      // Build job URL if we have an ID but no URL
      if (metadata.external_id && !metadata.url) {
        metadata.url = `https://www.linkedin.com/jobs/view/${metadata.external_id}/`;
      }

      // Only return if we found a valid job ID
      return metadata.external_id ? metadata : null;
    } catch (e) {
      log(`Error extracting job metadata: ${e.message}`, 'error');
      return null;
    }
  }

  /**
   * Main function to extract all job IDs from current page
   * @returns {Array} - Array of job metadata objects
   */
  function extractJobIDsFromPage() {
    try {
      log('Starting job ID extraction from page');
      
      const containers = findJobDataContainers();
      const allJobMetadata = [];

      containers.forEach((container, index) => {
        log(`Processing container ${index + 1}/${containers.length}`);
        
        const jsonData = parseJobJSON(container.textContent);
        if (!jsonData) {
          log(`Container ${index + 1} contains no valid JSON`);
          return;
        }

        const jobCards = extractJobCards(jsonData);
        log(`Found ${jobCards.length} job cards in container ${index + 1}`);

        jobCards.forEach(jobCard => {
          const metadata = extractJobMetadata(jobCard);
          if (metadata) {
            allJobMetadata.push(metadata);
            log(`Extracted job ID: ${metadata.external_id}`);
          }
        });
      });

      // Remove duplicates based on external_id
      const uniqueJobs = allJobMetadata.filter((job, index, self) => 
        index === self.findIndex(j => j.external_id === job.external_id)
      );

      log(`Extraction complete: ${uniqueJobs.length} unique jobs found`);
      return uniqueJobs;
    } catch (e) {
      log(`Error in extractJobIDsFromPage: ${e.message}`, 'error');
      return [];
    }
  }

  // Export functions to global scope
  globalScope.JobHunter.JSONParser = Object.assign(globalScope.JobHunter.JSONParser || {}, {
    extractJobIdFromURN,
    findJobDataContainers,
    parseJobJSON,
    extractJobCards,
    extractJobMetadata,
    extractJobIDsFromPage
  });

  log('JSON Parser ready');
})();