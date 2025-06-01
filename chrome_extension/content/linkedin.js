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

  log('Attempting to source JobHunterStorage...');
  const JobHunterStorage = (window.JobHunter && window.JobHunter.JobHunterStorage) || {};
  log('4. window.JobHunter.JobHunterStorage:', JSON.stringify(JobHunterStorage ? Object.keys(JobHunterStorage) : undefined));
  // const Storage = JobHunterStorage; // No need to rename if you use JobHunterStorage directly

  log('Attempting to source JobHunterAPI...');
  const JobHunterAPI = (window.JobHunter && window.JobHunter.JobHunterAPI) || {};
  log('5. window.JobHunter.JobHunterAPI:', JSON.stringify(JobHunterAPI ? Object.keys(JobHunterAPI) : undefined));
  // const API = JobHunterAPI; // No need to rename

  log('Check 1 (parseJobCard exists):', typeof parseJobCard === 'function');
  log('Check 2 (JobHunterAPI.sendJobListings exists):', typeof JobHunterAPI.sendJobListings === 'function');

  if (typeof parseJobCard !== 'function' || typeof JobHunterAPI.sendJobListings !== 'function') {
    log('Required helpers (parseJobCard or JobHunterAPI.sendJobListings) are not available or not functions.', 'error');
    // Log more details about what *is* available
    log('Detailed window.JobHunter content:', window.JobHunter);
    log('Detailed JobHunterParser content:', JobHunterParser);
    log('Detailed JobHunterAPI content:', JobHunterAPI);
    return;
  }

  log('All required helpers appear to be available. Proceeding...');

  /* ---------- scrape & post (rest of your linkedin.js code) ---------- */
  // ...
  // Remember to use 'JobHunterAPI.sendJobListings' and 'JobHunterStorage.storeJobListings'
  // and 'parseJobCard' directly.
  // ...

  // Example usage:
  // await JobHunterAPI.sendJobListings(listings);
  // JobHunterStorage.storeJobListings(listings);

  // ...

  // Your init actions:
  // insertJobHunterButton(); // Make sure this is defined on commonUtils or JobHunter
  if (commonUtils && typeof commonUtils.insertJobHunterButton === 'function') {
      commonUtils.insertJobHunterButton();
  } else if (typeof insertJobHunterButton === 'function') {
      insertJobHunterButton(); // If destructured successfully
  } else {
      log('insertJobHunterButton is not available.', 'warn');
  }

  log('linkedin.js loaded and listening for messages');
})();