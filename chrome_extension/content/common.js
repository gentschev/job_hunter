/**
 * Common helpers for all JobHunter content scripts.
 * -------------------------------------------------
 * Content scripts are injected as *classic* scripts, so we attach
 * our utilities to a single global object (`window.JobHunter`)
 * instead of using ES-module exports.
 */
(() => {
  /* ---------- private helpers ---------- */

  const prefixStyle = 'color:#fff;background:#4B8BFF;padding:2px 4px;border-radius:3px;font-weight:bold;';
  const msgStyle    = 'color:#222;';

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  /* ---------- public helpers ---------- */

  /**
   * Lightweight console logger with coloured prefix.
   * @param {string} message
   * @param {'log'|'warn'|'error'|'info'} level
   */
  function log(message, level = 'log') {
    // eslint-disable-next-line no-console
    console[level](`%cJobHunter%c ${message}`, prefixStyle, msgStyle);
  }

  /**
   * Wait until an element matching `selector` appears in the DOM.
   * @param {string} selector
   * @param {number} timeout  – milliseconds
   * @return {Promise<Element|null>}
   */
  async function waitForElement(selector, timeout = 10_000) {
    const start = performance.now();
    while (performance.now() - start < timeout) {
      const el = document.querySelector(selector);
      if (el) return el;
      await sleep(100);
    }
    return null;
  }

  /**
   * Smooth-scroll the page so `el` is roughly centred.
   * @param {Element} el
   */
  function scrollToElement(el) {
    if (el) el.scrollIntoView({ behaviour: 'smooth', block: 'center' });
  }

  /**
   * Inject raw CSS text into the current document.
   * @param {string} css
   */
  function injectStyles(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Adds a tiny “JobHunter” button to LinkedIn’s top nav bar
   * (handy when you want to trigger a scrape manually).
   */
  function insertJobHunterButton() {
    const nav = document.querySelector('header nav');
    if (!nav || nav.querySelector('#jobhunter-btn')) return; // already added

    const btn = document.createElement('button');
    btn.id = 'jobhunter-btn';
    btn.textContent = 'JobHunter';
    btn.style.cssText = [
      'margin-left:12px',
      'padding:4px 8px',
      'border:none',
      'border-radius:4px',
      'background:#4B8BFF',
      'color:#fff',
      'font-size:12px',
      'cursor:pointer',
    ].join(';');

    btn.addEventListener('click', () => log('JobHunter nav button clicked'));
    nav.appendChild(btn);
  }

  /* ---------- expose everything ---------- */

  window.JobHunter = Object.assign(window.JobHunter || {}, {
    log,
    waitForElement,
    scrollToElement,
    injectStyles,
    insertJobHunterButton,
  });

  log('common.js loaded');
})();
