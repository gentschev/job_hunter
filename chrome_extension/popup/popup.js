// Popup script for the JobHunter extension

// Use modern JavaScript with proper DOM content loading approach
document.addEventListener('DOMContentLoaded', initializePopup);

// Main initialization function
async function initializePopup() {
  // DOM elements using more efficient selectors
  const elements = {
    loginSection: document.getElementById('login-section'),
    mainSection: document.getElementById('main-section'),
    loadingSection: document.getElementById('loading-section'),
    
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    loginButton: document.getElementById('login-button'),
    loginMessage: document.getElementById('login-message'),
    
    userEmail: document.getElementById('user-email'),
    logoutButton: document.getElementById('logout-button'),
    startSearchButton: document.getElementById('start-search-button'),
    viewDashboardButton: document.getElementById('view-dashboard-button'),
    editPreferencesButton: document.getElementById('edit-preferences-button'),
    searchMessage: document.getElementById('search-message'),
    
    loadingMessage: document.getElementById('loading-message')
  };

  // Event listeners using modern approach
  elements.loginButton.addEventListener('click', () => handleLogin(elements));
  elements.logoutButton.addEventListener('click', () => handleLogout(elements));
  elements.startSearchButton.addEventListener('click', () => handleStartSearch(elements));
  elements.viewDashboardButton.addEventListener('click', handleViewDashboard);
  elements.editPreferencesButton.addEventListener('click', handleEditPreferences);
  
  // Also listen for Enter key in password field
  elements.passwordInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      handleLogin(elements);
    }
  });
  
  // Listen for search completion notifications
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'searchComplete') {
      handleSearchComplete(message.result, elements);
    } else if (message.action === 'searchError') {
      showSearchError(message.error, elements);
    }
  });
  
  // Initial UI setup
  await checkLoginStatus(elements);
}
  
// Check if user is already logged in
async function checkLoginStatus(elements) {
  try {
    showLoading('Checking login status...', elements);
    
    const response = await sendMessage({ action: 'checkLoginStatus' });
    
    if (response.loggedIn) {
      showMainSection(response.email, elements);
    } else {
      showLoginSection(elements);
    }
  } catch (error) {
    console.error('Error checking login status:', error);
    showLoginSection(elements);
    showLoginError('Error connecting to extension. Please reload.', elements);
  } finally {
    hideLoading(elements);
  }
}

// Handle login button click
async function handleLogin(elements) {
  try {
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    
    if (!email || !password) {
      showLoginError('Please enter both email and password.', elements);
      return;
    }
    
    showLoading('Logging in...', elements);
    
    const response = await sendMessage({
      action: 'login',
      email,
      password
    });
    
    if (response.success) {
      showMainSection(email, elements);
    } else {
      showLoginError(response.error || 'Login failed. Please check your credentials.', elements);
    }
  } catch (error) {
    console.error('Login error:', error);
    showLoginError('Connection error. Please try again.', elements);
  } finally {
    hideLoading(elements);
  }
}

// Handle logout button click
async function handleLogout(elements) {
  try {
    showLoading('Logging out...', elements);
    
    const response = await sendMessage({ action: 'logout' });
    
    if (response.success) {
      showLoginSection(elements);
    } else {
      showSearchError(response.error || 'Logout failed.', elements);
    }
  } catch (error) {
    console.error('Logout error:', error);
    showSearchError('Connection error during logout.', elements);
  } finally {
    hideLoading(elements);
  }
}

// Handle start search button click
async function handleStartSearch(elements) {
  try {
    showLoading('Starting job search...', elements);
    
    const response = await sendMessage({ action: 'startSearch' });
    
    if (response.success) {
      if (response.navigating) {
        // The search will continue after navigation, close the popup
        window.close();
      } else {
        // If not navigating, we'll receive the final result via a separate message
        // Keep the loading state until we get the result message
      }
    } else {
      hideLoading(elements);
      showSearchError(response.error || 'Search failed.', elements);
    }
  } catch (error) {
    console.error('Search error:', error);
    hideLoading(elements);
    showSearchError('Connection error starting search.', elements);
  }
}

// Handle search completion
function handleSearchComplete(result, elements) {
  hideLoading(elements);
  
  if (result.success) {
    showSearchSuccess(`Found ${result.count} matching job listings!`, elements);
  } else {
    showSearchError(result.error || 'Search failed.', elements);
  }
}

// Handle view dashboard button click
function handleViewDashboard() {
  chrome.tabs.create({ url: 'http://localhost:3000/dashboards/index' });
}

// Handle edit preferences button click
function handleEditPreferences() {
  chrome.tabs.create({ url: 'http://localhost:3000/search_preference/edit' });
}

// Helper to send messages to the background script
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// UI helper functions
function showLoginSection(elements) {
  elements.loginSection.classList.remove('hidden');
  elements.mainSection.classList.add('hidden');
  elements.loadingSection.classList.add('hidden');
  
  // Clear the form
  elements.emailInput.value = '';
  elements.passwordInput.value = '';
  elements.loginMessage.classList.add('hidden');
  
  // Set focus to email input
  setTimeout(() => elements.emailInput.focus(), 100);
}

function showMainSection(email, elements) {
  elements.loginSection.classList.add('hidden');
  elements.mainSection.classList.remove('hidden');
  elements.loadingSection.classList.add('hidden');
  
  // Display user email
  elements.userEmail.textContent = email;
  elements.searchMessage.classList.add('hidden');
}

function showLoading(message, elements) {
  elements.loginSection.classList.add('hidden');
  elements.mainSection.classList.add('hidden');
  elements.loadingSection.classList.remove('hidden');
  
  elements.loadingMessage.textContent = message || 'Loading...';
}

function hideLoading(elements) {
  elements.loadingSection.classList.add('hidden');
}

function showLoginError(errorMessage, elements) {
  elements.loginMessage.textContent = errorMessage;
  elements.loginMessage.classList.remove('hidden', 'success');
  elements.loginMessage.classList.add('error');
}

function showSearchError(errorMessage, elements) {
  elements.searchMessage.textContent = errorMessage;
  elements.searchMessage.classList.remove('hidden', 'success');
  elements.searchMessage.classList.add('error');
}

function showSearchSuccess(successMessage, elements) {
  elements.searchMessage.textContent = successMessage;
  elements.searchMessage.classList.remove('hidden', 'error');
  elements.searchMessage.classList.add('success');
}