// chrome_extension/content/linkedin.js
(() => {
  console.log('[LINKEDIN.JS] Script start'); // 0. Is linkedin.js even starting?

  // Attempt to get the log function first, with robust checking
  let log;
  if (window.JobHunter && typeof window.JobHunter.log === 'function') {
    log = (message, level) => window.JobHunter.log(message, level, 'LINKEDIN');
    log('Successfully attached to JobHunter.log from common.js');
  } else {
    // Fallback logger if JobHunter.log wasn't set by common.js
    // This indicates common.js might have failed or not run as expected.
    log = (message, level = 'log') => {
      const LNK_PREFIX = '%cJobHunter (LINKEDIN - Fallback Log)%c';
      const styles = ['color:red;font-weight:bold;', 'color:inherit;'];
      console[level](LNK_PREFIX, ...styles, message);
    };
    log('Using fallback logger. window.JobHunter or window.JobHunter.log was not found!', 'error');
  }

  log('Attempting to source common utilities...');
  const commonUtils = window.JobHunter;
  log('1. window.JobHunter (at start of linkedin.js):', JSON.stringify(commonUtils ? Object.keys(commonUtils) : undefined));

  const {
    waitForElement,
    scrollToElement,
    // insertJobHunterButton, // Assuming this is also on window.JobHunter if needed
  } = commonUtils || {}; // Fallback to empty object if commonUtils is undefined

  log('2. Sourced common utils (waitForElement etc.)');

  log('Attempting to source JobHunterParser...');
  const JobHunterParser = (window.JobHunter && window.JobHunter.JobHunterParser) || {};
  log('3. window.JobHunter.JobHunterParser:', JSON.stringify(JobHunterParser ? Object.keys(JobHunterParser) : undefined));
  const { parseJobCard, parseJobDetails } = JobHunterParser; // Destructure after checking JobHunterParser

  log('Attempting to source JSONParser...');
  const JSONParser = (window.JobHunter && window.JobHunter.JSONParser) || {};
  log('4. window.JobHunter.JSONParser:', JSON.stringify(JSONParser ? Object.keys(JSONParser) : undefined));

  log('Attempting to source JobDetailExtractor...');
  const JobDetailExtractor = (window.JobHunter && window.JobHunter.JobDetailExtractor) || {};
  log('5. window.JobHunter.JobDetailExtractor:', JSON.stringify(JobDetailExtractor ? Object.keys(JobDetailExtractor) : undefined));

  log('Attempting to source JobHunterStorage...');
  const JobHunterStorage = (window.JobHunter && window.JobHunter.JobHunterStorage) || {};
  log('4. window.JobHunter.JobHunterStorage:', JSON.stringify(JobHunterStorage ? Object.keys(JobHunterStorage) : undefined));
  // const Storage = JobHunterStorage; // No need to rename if you use JobHunterStorage directly

  log('Attempting to source JobHunterAPI...');
  const JobHunterAPI = (window.JobHunter && window.JobHunter.JobHunterAPI) || {};
  log('5. window.JobHunter.JobHunterAPI:', JSON.stringify(JobHunterAPI ? Object.keys(JobHunterAPI) : undefined));
  // const API = JobHunterAPI; // No need to rename

  log('Check 1 (JSONParser.extractJobIDsFromPage exists):', typeof JSONParser.extractJobIDsFromPage === 'function');
  log('Check 2 (JobDetailExtractor.extractJobDetails exists):', typeof JobDetailExtractor.extractJobDetails === 'function');
  log('Check 3 (JobHunterAPI.sendJobListings exists):', typeof JobHunterAPI.sendJobListings === 'function');

  if (typeof JSONParser.extractJobIDsFromPage !== 'function' || 
      typeof JobDetailExtractor.extractJobDetails !== 'function' ||
      typeof JobHunterAPI.sendJobListings !== 'function') {
    log('Required helpers are not available or not functions.', 'error');
    log('JSONParser available functions:', Object.keys(JSONParser));
    log('JobDetailExtractor available functions:', Object.keys(JobDetailExtractor));
    log('JobHunterAPI available functions:', Object.keys(JobHunterAPI));
    return;
  }

  log('All required helpers appear to be available. Proceeding...');

  /**
   * Main function to perform LinkedIn job search and extraction
   * @returns {Promise<Object>} Result object with success status and job count
   */
  async function performLinkedInSearch() {
    try {
      log('=== Stage 1: Job Discovery (JSON Parsing) ===');
      
      // Extract job IDs from current page using JSON parser
      const jobMetadata = JSONParser.extractJobIDsFromPage();
      log(`Stage 1 complete: Found ${jobMetadata.length} job IDs`);
      
      if (jobMetadata.length === 0) {
        return {
          success: true,
          count: 0,
          message: 'No job listings found on current page'
        };
      }

      // Show progress to user
      const jobIds = jobMetadata.map(job => job.external_id);
      log(`Job IDs discovered: ${jobIds.slice(0, 5).join(', ')}${jobIds.length > 5 ? '...' : ''}`);

      log('=== Stage 2: Job Detail Extraction ===');
      
      // Determine extraction strategy based on current page
      const currentUrl = window.location.href;
      let jobDetails = [];

      if (currentUrl.includes('/jobs/view/')) {
        // We're on a job detail page - extract details for current job
        log('Detected job detail page - extracting current job details');
        const currentJobId = currentUrl.match(/\/jobs\/view\/(\d+)/)?.[1];
        
        if (currentJobId) {
          const jobDetail = JobDetailExtractor.extractJobDetails(currentJobId);
          if (jobDetail) {
            jobDetails.push(jobDetail);
            log(`Extracted details for current job: ${currentJobId}`);
          }
        }
      } else {
        // We're on a search results page - extract details for multiple jobs
        log(`Extracting details for ${Math.min(jobIds.length, 5)} jobs (limited for performance)`);
        
        // Limit to first 5 jobs to avoid overwhelming the system
        const limitedJobIds = jobIds.slice(0, 5);
        
        for (let i = 0; i < limitedJobIds.length; i++) {
          const jobId = limitedJobIds[i];
          log(`Processing job ${i + 1}/${limitedJobIds.length}: ${jobId}`);
          
          try {
            // Try to extract details from current page first (faster)
            let jobDetail = JobDetailExtractor.extractJobDetails(jobId);
            
            if (jobDetail) {
              jobDetails.push(jobDetail);
              log(`✅ Extracted details for job ${jobId}`);
            } else {
              log(`⚠️  Could not extract details for job ${jobId}`);
            }
            
            // Add delay between extractions to avoid rate limiting
            if (i < limitedJobIds.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
          } catch (error) {
            log(`❌ Error extracting job ${jobId}: ${error.message}`, 'error');
            continue;
          }
        }
      }

      log(`=== Stage 3: Data Submission ===`);
      log(`Submitting ${jobDetails.length} job details to backend`);

      // Submit job details via background script (to bypass CSP)
      if (jobDetails.length > 0) {
        try {
          log('Sending job data to background script for API submission...');
          const response = await chrome.runtime.sendMessage({
            action: 'submitJobs',
            jobs: jobDetails
          });
          
          if (response && response.success) {
            log(`✅ Successfully submitted ${response.saved_count || jobDetails.length} jobs to backend`);
          } else {
            log(`⚠️  API submission failed: ${response?.error || 'Unknown error'}`, 'warn');
          }
        } catch (apiError) {
          log(`⚠️  API submission failed: ${apiError.message}`, 'warn');
          // Continue anyway - we still found jobs
        }
      }

      return {
        success: true,
        count: jobDetails.length,
        totalDiscovered: jobMetadata.length,
        message: `Successfully processed ${jobDetails.length} jobs (${jobMetadata.length} discovered)`
      };

    } catch (error) {
      log(`Search failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Add a minimal message listener to handle messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    log(`Received message: ${JSON.stringify(message)}`, 'info');
    
    // Acknowledge receipt of the message
    sendResponse({ 
      success: true, 
      message: 'Message received by content script', 
      receivedAction: message.action 
    });
    
    // If this is a startSearch action, perform real job scraping
    if (message.action === 'startSearch') {
      log('Starting real LinkedIn job search...', 'info');
      
      // Perform the search asynchronously
      performLinkedInSearch()
        .then(result => {
          log(`Job search complete. Found ${result.count} jobs`, 'info');
          
          // Send the searchComplete message to the background script
          chrome.runtime.sendMessage({
            action: 'searchComplete',
            result: result
          });
        })
        .catch(error => {
          log(`Job search failed: ${error.message}`, 'error');
          
          // Send error result
          chrome.runtime.sendMessage({
            action: 'searchComplete',
            result: {
              success: false,
              error: error.message,
              count: 0
            }
          });
        });
    }
    
    // Return true to indicate we'll respond asynchronously 
    return true;
  });

  log('linkedin.js loaded and listening for messages');
})();