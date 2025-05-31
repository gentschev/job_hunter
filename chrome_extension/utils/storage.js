/**
 *  JobHunter - local-storage helpers
 *  Attached to window.JobHunterStorage
 */
(() => {
  const { log = console.log } = window.JobHunter || {};
  /* credentials --------------------------------------- */
  async function storeCredentials(email, token) {
    await chrome.storage.local.set({ credentials: { email, token, ts: Date.now() } });
  }
  async function getCredentials() {
    const { credentials } = await chrome.storage.local.get('credentials');
    return credentials || null;
  }
  async function clearCredentials() { await chrome.storage.local.remove('credentials'); }

  /* job listings -------------------------------------- */
  async function storeJobListings(listings) {
    const existing = await getJobListings();
    const ids      = new Set(existing.map(j => j.external_id));
    const merged   = [...existing, ...listings.filter(j => !ids.has(j.external_id))];
    await chrome.storage.local.set({ jobListings: merged });
  }
  async function getJobListings() {
    const { jobListings = [] } = await chrome.storage.local.get('jobListings');
    return jobListings;
  }

  window.JobHunterStorage = {
    storeCredentials, getCredentials, clearCredentials,
    storeJobListings, getJobListings
  };

  JobHunter.log('storage helpers ready')
})();
