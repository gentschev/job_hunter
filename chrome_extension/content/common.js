// chrome_extension/content/common.js
(() => {
  /**
   * Determine the correct global scope.
   * In service workers, it's 'self'. In content scripts and popups, it's 'window'.
   */
  const globalScope = typeof window !== 'undefined' ? window : self;

  /**
   * Ensure the base JobHunter namespace exists on the global scope.
   * This object will hold shared utilities and modules.
   */
  globalScope.JobHunter = globalScope.JobHunter || {};

  // Store original console methods to avoid issues if they are ever modified.
  const { log: consoleLog, warn: consoleWarn, error: consoleError, info: consoleInfo } = console;

  /**
   * Standardized logger for the JobHunter extension.
   * Prepends messages with a styled [JobHunter (Component)] prefix.
   * @param {string} message - The message to log.
   * @param {'log'|'warn'|'error'|'info'} [level='log'] - The logging level.
   * @param {string} [component='COMMON'] - Name of the component logging the message.
   */
  function jobHunterLog(message, level = 'log', component = 'COMMON') {
    const prefix = `%cJobHunter (${component})%c`;
    const styles = [
      'background: #0073b1; color: white; padding: 2px 4px; border-radius: 2px; font-weight: bold;',
      'color: inherit;' // Resets style for the message itself
    ];

    switch (level) {
      case 'warn':
        consoleWarn(prefix, ...styles, message);
        break;
      case 'error':
        consoleError(prefix, ...styles, message);
        break;
      case 'info':
        consoleInfo(prefix, ...styles, message);
        break;
      default:
        consoleLog(prefix, ...styles, message);
    }
  }

  // Make the logger available immediately on the JobHunter namespace
  // so other utility scripts imported later can use it.
  globalScope.JobHunter.log = jobHunterLog;

  /**
   * Pauses execution for a specified number of milliseconds.
   * @param {number} ms - Milliseconds to sleep.
   * @returns {Promise<void>}
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Waits for a DOM element matching the selector to appear.
   * @param {string} selector - The CSS selector for the element.
   * @param {number} [timeout=10000] - Maximum time to wait in milliseconds.
   * @param {Node} [parentNode=document] - The parent node to search within.
   * @returns {Promise<Element|null>} The found element or null if timed out.
   */
  async function waitForElement(selector, timeout = 10000, parentNode = document) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = parentNode.querySelector(selector);
      if (element) return element;
      await sleep(100); // Check every 100ms
    }
    jobHunterLog(`Timeout waiting for element: ${selector}`, 'warn', 'DOMUtil');
    return null;
  }

  /**
   * Scrolls the page smoothly to bring the specified element into the center of the viewport.
   * @param {Element} element - The DOM element to scroll to.
   */
  function scrollToElement(element) {
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      jobHunterLog('scrollToElement: Element is null or does not support scrollIntoView', 'warn', 'DOMUtil');
    }
  }

  /**
   * Injects a string of CSS into the document's <head>.
   * This is primarily for content scripts modifying page styles.
   * @param {string} css - The CSS string to inject.
   */
  function injectStyles(css) {
    // This function is only relevant in a document context (content script, popup)
    if (typeof document !== 'undefined' && document.head) {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    } else {
      jobHunterLog('injectStyles: document or document.head not available. Skipping style injection.', 'warn', 'DOMUtil');
    }
  }

  // Expose public utilities on the JobHunter namespace
  Object.assign(globalScope.JobHunter, {
    // log is already assigned
    sleep,
    waitForElement,
    scrollToElement,
    injectStyles
    // Add other common utilities here if needed
  });

  jobHunterLog('JobHunter common.js utilities initialized.', 'info');

  // Inject common styles immediately if in a document context
  if (typeof document !== 'undefined') {
    injectStyles(`
      .jobhunter-highlight {
        border: 2px solid #0073b1 !important;
        box-shadow: 0 0 10px rgba(0, 115, 177, 0.3) !important;
        transition: all 0.3s ease-in-out !important;
      }
      .jobhunter-button { /* General button style if needed by content scripts */
        background-color: #0073b1; color: white; border: none;
        border-radius: 4px; padding: 8px 16px; font-weight: bold;
        cursor: pointer; margin: 8px 0; transition: background-color 0.2s ease-in-out;
      }
      .jobhunter-button:hover { background-color: #006097; }
    `);
    jobHunterLog('Common styles injected into document.', 'info');
  }
})();