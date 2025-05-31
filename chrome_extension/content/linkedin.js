/**
 * Content script injected into LinkedIn’s pages.
 * ----------------------------------------------
 * Listens for the “start search” message from background.js,
 * scrapes job cards, and posts them to your Rails API.
 * All dependencies are read from the global namespaces that
 * other utils expose (JobHunterParser, JobHunterStorage, JobHunterAPI).
 */
(() => {
  /* ----- pull helpers exposed by common.js ----- */

  const {
    log,
    waitForElement,
    scrollToElement,
    insertJobHunterButton,
  } = window.JobHunter;

  /* ----- pull helpers exposed by other util files ----- */

  const { parseJobCard, parseJobDetails } = window.JobHunterParser ?? {};
  const Storage = window.JobHunterStorage ?? {};
  const API     = window.JobHunterAPI     ?? {};

  if (!parseJobCard || !API.sendJobListings) {
    log('Required helpers not found – make sure utils/*.js files are loaded first.', 'error');
    return;
  }

  /* ---------- scrape & post ---------- */

  /** Scrape the visible search results list. */
  function scrapeVisibleCards() {
    const cards = document.querySelectorAll('.jobs-search-results__list-item');
    return Array.from(cards)
      .map(card => {
        try { return parseJobCard(card); }
        catch (e) { log(`parseJobCard failed: ${e}`, 'warn'); return null; }
      })
      .filter(Boolean);
  }

  /** Scroll through the list and gather unique job IDs. */
  async function gatherAllCards(maxScrolls = 25) {
    const listings = [];
    const seen = new Set();

    const listEl = await waitForElement('.scaffold-layout__list-container');
    if (!listEl) { log('Job results list not found', 'error'); return listings; }

    for (let i = 0; i < maxScrolls; i++) {
      listings.push(...scrapeVisibleCards().filter(j => !seen.has(j.id)));
      listings.forEach(j => seen.add(j.id));
      listEl.scrollBy(0, listEl.clientHeight);          // paginate
      await new Promise(r => setTimeout(r, 800));       // allow new cards to load
    }
    return listings;
  }

  async function runSearch() {
    log('Starting LinkedIn scrape…');
    const listings = await gatherAllCards();

    log(`Found ${listings.length} job cards - fetching details…`);
    for (const listing of listings) {
      const details = await parseJobDetails(listing.id).catch(() => null);
      Object.assign(listing, details);
    }

    log('Posting listings to API…');
    await API.sendJobListings(listings);
    Storage.storeJobListings(listings);
    log('✅ Job search complete');
  }

  /* ---------- message bridge ---------- */

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'JOBHUNTER_START_SEARCH') {
      runSearch()
        .then(() => sendResponse({ ok: true }))
        .catch(err => sendResponse({ ok: false, error: String(err) }));
      return true; // keep the message port open for async response
    }
  });

  /* ---------- init actions ---------- */

  insertJobHunterButton();
  log('linkedin.js loaded and listening for messages');
})();
