/**
 *  JobHunter - LinkedIn parsing helpers
 *  Attached to window.JobHunterParser
 */
(() => {
  const { log = console.log } = window.JobHunter || {};
  
  function parseLinkedInDate(relative) {
    try {
      const now = new Date();
      if (/minute|hour/.test(relative)) return now.toISOString();
      if (/day/.test(relative))     { now.setDate(now.getDate() - +relative.match(/\d+/)[0]); return now.toISOString(); }
      if (/week/.test(relative))    { now.setDate(now.getDate() - 7 * +relative.match(/\d+/)[0]); return now.toISOString(); }
      if (/month/.test(relative))   { now.setMonth(now.getMonth() - +relative.match(/\d+/)[0]); return now.toISOString(); }
      return now.toISOString();
    } catch(e) {
      console.error('[JobHunter] date parse error', e);
      return new Date().toISOString();
    }
  }

  function parseJobCard(card) {
    try {
      const id   = card.getAttribute('data-job-id');
      if (!id) return null;

      return {
        external_id : id,
        title       : card.querySelector('.job-card-list__title')?.innerText.trim()      ?? '',
        company     : card.querySelector('.job-card-container__company-name')?.innerText ?? '',
        location    : card.querySelector('.job-card-container__metadata-item')?.innerText ?? '',
        url         : `https://www.linkedin.com/jobs/view/${id}/`,
        posted_date : parseLinkedInDate(card.querySelector('.job-card-container__listed-time')?.innerText ?? ''),
        scraped_date: new Date().toISOString(),
        status      : 'new'
      };
    } catch (e) {
      console.error('[JobHunter] parseJobCard error', e); return null;
    }
  }

  /* stub – fill in later */
  async function parseJobDetails(/* detailsPaneEl */) { return {}; }

  window.JobHunterParser = { parseJobCard, parseJobDetails };

  JobHunter.log('parser ready')
})();
