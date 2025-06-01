// chrome_extension/utils/parser.js
(() => {
  const globalScope = typeof window !== 'undefined' ? window : self;

  globalScope.JobHunter = globalScope.JobHunter || {};
  const log = (globalScope.JobHunter && typeof globalScope.JobHunter.log === 'function')
    ? globalScope.JobHunter.log
    : (message, level = 'log') => {
        const prefix = '%cJobHunter (Parser)%c';
        const styles = [
          'color:#fff;background:#0073b1;padding:2px 4px;border-radius:3px;font-weight:bold;',
          'color:#222;'
        ];
        console[level](prefix, ...styles, message);
      };

  function parseLinkedInDate(relative) {
    try {
      const now = new Date();
      if (!relative || typeof relative !== 'string') return now.toISOString();

      const numMatch = relative.match(/\d+/);
      const num = numMatch ? parseInt(numMatch[0], 10) : 0;

      if (relative.includes('minute') || relative.includes('hour')) return now.toISOString();
      if (relative.includes('day'))   { now.setDate(now.getDate() - num); return now.toISOString(); }
      if (relative.includes('week'))  { now.setDate(now.getDate() - 7 * num); return now.toISOString(); }
      if (relative.includes('month')) { now.setMonth(now.getMonth() - num); return now.toISOString(); }
      return now.toISOString(); // Fallback for unparsed or "Just now" etc.
    } catch(e) {
      log(`Date parse error for string "${relative}": ${e.message}`, 'error');
      return new Date().toISOString();
    }
  }

  function parseJobCard(card) {
    try {
      if (!card || typeof card.getAttribute !== 'function') return null;
      const jobId = card.getAttribute('data-job-id') || card.querySelector('[data-entity-urn]')?.getAttribute('data-entity-urn')?.split(':').pop();
      if (!jobId) {
        log('Could not find job ID in card', 'warn');
        return null;
      }

      return {
        external_id : jobId,
        title       : card.querySelector('.job-card-list__title, .job-card-container__title, .job-srp-job-title, [class*="job-card-list__title"], [class*="job-card-container__title"]') ?.innerText.trim() ?? '',
        company     : card.querySelector('.job-card-container__company-name, [class*="job-card-container__primary-description"]') ?.innerText.trim() ?? '',
        location    : card.querySelector('.job-card-container__metadata-item, [class*="job-card-container__metadata-item"]') ?.innerText.trim() ?? '',
        url         : `https://www.linkedin.com/jobs/view/${jobId}/`,
        posted_date : parseLinkedInDate(card.querySelector('.job-card-container__listed-time, [class*="job-card-list__listed-date"]') ?.innerText.trim() ?? ''),
        scraped_date: new Date().toISOString(),
        status      : 'new_listing' // Matching your JobListing model enum
      };
    } catch (e) {
      log(`parseJobCard error: ${e.message}`, 'error');
      return null;
    }
  }

  function parseJobDetails(detailsPanel) {
    try {
      if (!detailsPanel) return {};
      const descriptionElement = detailsPanel.querySelector('.jobs-description__content .jobs-box__html-content, .show-more-less-html__markup, [class*="description__text"]');
      const description = descriptionElement ? descriptionElement.innerHTML.trim() : '';

      const salaryElement = detailsPanel.querySelector('.compensation__salary, .jobs-details-items__salary');
      const salaryText = salaryElement ? salaryElement.textContent.trim() : '';

      let industry = '';
      const industryElements = detailsPanel.querySelectorAll('ul.jobs-details__list--unordered li, ul.job-criteria__list li');
      industryElements.forEach(li => {
        if (li.textContent.toLowerCase().includes('industries')) {
          const sibling = li.querySelector('span:last-child, strong + span'); // Common patterns
          if(sibling) industry = sibling.textContent.trim();
        }
      });
      if (!industry) { // Fallback selector
          const industryContainer = Array.from(detailsPanel.querySelectorAll('h3, dt'))
                                      .find(el => el.textContent.trim().toLowerCase() === 'industries');
          if (industryContainer) {
              industry = industryContainer.nextElementSibling?.textContent.trim() || '';
          }
      }


      let experienceRequired = '';
      const criteria = detailsPanel.querySelectorAll('.description__job-criteria-item, .job-criteria__item');
      for (const criterion of criteria) {
        const labelElement = criterion.querySelector('.description__job-criteria-subheader, .job-criteria__subheader');
        if (labelElement && (labelElement.textContent.includes('Experience level') || labelElement.textContent.includes('Seniority level'))) {
          const valueElement = criterion.querySelector('.description__job-criteria-text, .job-criteria__text');
          if (valueElement) {
            experienceRequired = valueElement.textContent.trim();
          }
          break;
        }
      }

      let requiredSkills = '';
      const skillsSection = detailsPanel.querySelector('.skills-section, .jobs-description__content ul:has(strong:contains("Skills"))'); // Example selectors
      if (skillsSection) {
          const skillItems = skillsSection.querySelectorAll('li');
          requiredSkills = Array.from(skillItems)
            .map(item => item.textContent.trim())
            .join('; '); // Using semicolon for easier parsing later perhaps
      }


      return {
        description,
        salary_information: salaryText,
        industry,
        experience_required: experienceRequired,
        required_skills: requiredSkills
      };
    } catch (error) {
      log(`Error parsing job details: ${error.message}`, 'error');
      return {};
    }
  }

  globalScope.JobHunter.JobHunterParser = Object.assign(globalScope.JobHunter.JobHunterParser || {}, {
    parseJobCard,
    parseJobDetails,
    parseLinkedInDate // Exposing this if needed directly
  });

  log('JobHunterParser helpers ready');
})();