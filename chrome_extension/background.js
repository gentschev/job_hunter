/* --------------------------------------------------------------
 * JobHunter – background service-worker (classic script, MV3)
 * -------------------------------------------------------------- */

// ❶  Bring in our helper bundles (they populate self.JobHunterAPI / Storage)
importScripts('utils/api.js', 'utils/storage.js');

const API     = self.JobHunterAPI     || {};
const Storage = self.JobHunterStorage || {};

function log(msg, level = 'log') {
  // eslint-disable-next-line no-console
  console[level]('%cJobHunter%c ' + msg,
                 'color:#fff;background:#4B8BFF;padding:2px 4px;border-radius:3px;font-weight:bold;',
                 'color:#222;');
}

/* ------------------------------------------------------------------
 * message bridge – handles requests from popup & content scripts
 * ------------------------------------------------------------------ */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'login':
          return sendResponse(await login(message.email, message.password));

        case 'logout':
          return sendResponse(await logout());

        case 'getSearchPreferences':
          return sendResponse(await getSearchPreferences());

        case 'startSearch':
          return sendResponse(await startSearch());

        case 'checkLoginStatus':
          return sendResponse(await checkLoginStatus());

        default:
          return sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (err) {
      console.error('Background handler error:', err);
      sendResponse({ success: false, error: String(err) });
    }
  })();

  // keep the port open for the async work above
  return true;
});

/* ------------------------------------------------------------------
 *  handler helpers
 * ------------------------------------------------------------------ */
async function login(email, password) {
  try {
    const token = await API.getAuthToken(email, password);
    await Storage.storeCredentials(email, token);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function logout() {
  try {
    await Storage.clearCredentials();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function getSearchPreferences() {
  try {
    const creds = await Storage.getStoredCredentials();
    if (!creds?.token) {
      return { success: false, error: 'Not logged in' };
    }
    const prefs = await API.getSearchPreferences(creds.token);
    return { success: true, preferences: prefs };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function startSearch() {
  try {
    // active tab of *last focused* window (popup counts as a window!)
    let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

    // if everything is minimised, create a fresh tab
    if (!tab) {
      tab = await chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/' });
      await chrome.storage.local.set({ pendingSearch: true });
      return { success: true, navigating: true };
    }

    if (tab.url && tab.url.includes('linkedin.com')) {
      await chrome.tabs.sendMessage(tab.id, { type: 'JOBHUNTER_START_SEARCH' });
      return { success: true };
    }

    // otherwise navigate the existing tab and mark that we need to continue
    await chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/jobs/' });
    await chrome.storage.local.set({ pendingSearch: true });
    return { success: true, navigating: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function checkLoginStatus() {
  try {
    const creds = await Storage.getStoredCredentials();
    return {
      loggedIn: Boolean(creds?.token),
      email:    creds?.email || null,
    };
  } catch (err) {
    return { loggedIn: false, error: err.message };
  }
}

/* ------------------------------------------------------------------
 *  resume a “pending search” once LinkedIn finishes loading
 * ------------------------------------------------------------------ */
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status !== 'complete') return;
  if (!tab.url || !tab.url.includes('linkedin.com/jobs')) return;

  const { pendingSearch } = await chrome.storage.local.get('pendingSearch');
  if (!pendingSearch) return;

  await chrome.storage.local.remove('pendingSearch');
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'JOBHUNTER_START_SEARCH' });
    log('Resumed search after navigation');
  } catch (err) {
    console.error('Failed to resume search:', err);
  }
});
