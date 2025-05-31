/* utils/api.js  – classic script */
(() => {
  const BASE = 'http://localhost:3000/api/v1';
  const { log = console.log } = window.JobHunter || {};

  async function api(path, opts = {}) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...opts,
    });
    if (!res.ok) throw new Error((await res.json()).message || res.statusText);
    return res.json();
  }

  async function getAuthToken(email, password) {
    const { token } = await api('/users/sign_in', {
      method: 'POST',
      body: JSON.stringify({ user: { email, password } }),
    });
    return token;
  }

  const getSearchPreferences = token =>
    api('/search_preferences', { headers: { Authorization: `Token ${token}` } });

  const saveJobListing  = (t, job)  =>
    api('/job_listings', {
      method: 'POST',
      headers: { Authorization: `Token ${t}` },
      body: JSON.stringify({ job_listing: job }),
    });

  const sendJobListings = (t, jobs) =>
    api('/job_listings/batch', {
      method: 'POST',
      headers: { Authorization: `Token ${t}` },
      body: JSON.stringify({ job_listings: jobs }),
    });

  const updateJobStatus = (t, id, status) =>
    api(`/job_listings/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Token ${t}` },
      body: JSON.stringify({ job_listing: { status } }),
    });

  /* -- expose helpers -- */
  window.JobHunterAPI = Object.assign(window.JobHunter || {}, {
    getAuthToken,
    getSearchPreferences,
    saveJobListing,
    sendJobListings,
    updateJobStatus,
  });

  log('api helpers ready');
})();
