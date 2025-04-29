// Common content script functionality for all pages

/**
 * Log message to console with JobHunter prefix for easy identification
 * @param {string} message - Message to log
 * @param {string} level - Log level (log, warn, error, info)
 */
export function jobHunterLog(message, level = 'log') {
  const prefix = '%c[JobHunter]%c';
  const styles = [
    'background: #0073b1; color: white; padding: 2px 4px; border-radius: 2px;',
    'color: inherit;'
  ];
  
  switch (level) {
    case 'warn':
      console.warn(prefix, ...styles, message);
      break;
    case 'error':
      console.error(prefix, ...styles, message);
      break;
    case 'info':
      console.info(prefix, ...styles, message);
      break;
    default:
      console.log(prefix, ...styles, message);
  }
}

/**
 * Insert the JobHunter UI button into LinkedIn's navigation
 */
export function insertJobHunterButton() {
  // Only run on LinkedIn
  if (!window.location.href.includes('linkedin.com')) return;
  
  // Check if button already exists
  if (document.getElementById('jobhunter-button')) return;
  
  // Look for the navigation area on LinkedIn
  const navBar = document.querySelector('nav.global-nav');
  if (!navBar) return;
  
  // Create the button
  const button = document.createElement('button');
  button.id = 'jobhunter-button';
  button.className = 'global-nav__primary-item';
  button.innerHTML = `
    <div class="global-nav__primary-link">
      <div class="global-nav__icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 2L4 7v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-8-5zm4 15h-3v-3h-2v3H8v-6l4-2 4 2v6z" />
        </svg>
      </div>
      <span class="global-nav__primary-link-text">JobHunter</span>
    </div>
  `;
  
  // Add click event to open the popup
  button.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #jobhunter-button {
      cursor: pointer;
      background: transparent;
      border: none;
      color: rgba(0, 0, 0, 0.6);
      transition: color 0.3s;
    }
    #jobhunter-button:hover {
      color: rgba(0, 0, 0, 0.9);
    }
    #jobhunter-button .global-nav__primary-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      padding: 0 8px;
    }
    #jobhunter-button .global-nav__icon {
      margin-bottom: 4px;
    }
    #jobhunter-button .global-nav__primary-link-text {
      font-size: 12px;
    }
  `;
  
  // Insert the button into the navigation
  const navList = navBar.querySelector('ul');
  if (navList) {
    const listItem = document.createElement('li');
    listItem.appendChild(button);
    navList.appendChild(listItem);
    document.head.appendChild(style);
    
    jobHunterLog('JobHunter button added to LinkedIn navigation');
  }
}

/**
 * Utility function to create and append a style element
 * @param {string} css - CSS styles to inject
 */
export function injectStyles(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Utility function to wait for an element to appear
 * @param {string} selector - CSS selector for element to wait for
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<Element>} - Promise that resolves with the element
 */
export function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for element: ${selector}`));
        return;
      }
      
      setTimeout(checkElement, 100);
    };
    
    checkElement();
  });
}

/**
 * Utility function to scroll to an element
 * @param {Element} element - Element to scroll to
 */
export function scrollToElement(element) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Inject JobHunter styles
injectStyles(`
  .jobhunter-highlight {
    border: 2px solid #0073b1 !important;
    box-shadow: 0 0 10px rgba(0, 115, 177, 0.3) !important;
    transition: all 0.3s ease-in-out !important;
  }
  
  .jobhunter-button {
    background-color: #0073b1;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: bold;
    cursor: pointer;
    margin: 8px 0;
    transition: background-color 0.2s ease-in-out;
  }
  
  .jobhunter-button:hover {
    background-color: #006097;
  }
`);

// Run when the page loads
document.addEventListener('DOMContentLoaded', () => {
  jobHunterLog('JobHunter content script loaded');
  
  // Try to insert the button immediately
  insertJobHunterButton();
  
  // Also try again after a short delay to handle dynamically loaded navigation
  setTimeout(insertJobHunterButton, 2000);
});

// Handle dynamically loaded content (LinkedIn is a SPA)
const observer = new MutationObserver((mutations) => {
  // Check if navigation has been added/changed
  for (const mutation of mutations) {
    if (mutation.type === 'childList' && 
        (mutation.target.tagName === 'NAV' || 
         mutation.target.querySelector('nav'))) {
      insertJobHunterButton();
      break;
    }
  }
});

// Start observing the document body for changes
observer.observe(document.body, { 
  childList: true, 
  subtree: true 
});