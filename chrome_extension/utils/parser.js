// Parser utility functions for LinkedIn job listings

/**
 * Parse basic information from a LinkedIn job card
 * @param {HTMLElement} jobCard - The job card element
 * @returns {Object|null} Basic job information or null if parsing failed
 */
export function parseJobCard(jobCard) {
  try {
    // Get the job ID from the data-job-id attribute
    const jobId = jobCard.getAttribute('data-job-id');
    if (!jobId) return null;
    
    // Get the job title
    const titleElement = jobCard.querySelector('.job-card-list__title');
    const title = titleElement ? titleElement.textContent.trim() : '';
    
    // Get the company name
    const companyElement = jobCard.querySelector('.job-card-container__company-name');
    const company = companyElement ? companyElement.textContent.trim() : '';
    
    // Get the location
    const locationElement = jobCard.querySelector('.job-card-container__metadata-item');
    const location = locationElement ? locationElement.textContent.trim() : '';
    
    // Get the date posted (may be relative like "2 days ago")
    const dateElement = jobCard.querySelector('.job-card-container__listed-time');
    const listedDate = dateElement ? dateElement.textContent.trim() : '';
    
    // Build the job URL
    const jobUrl = `https://www.linkedin.com/jobs/view/${jobId}/`;
    
    return {
      external_id: jobId,
      title,
      company,
      location,
      url: jobUrl,
      posted_date: parseLinkedInDate(listedDate),
      scraped_date: new Date().toISOString(),
      status: 'new'
    };
  } catch (error) {
    console.error('Error parsing job card:', error);
    return null;
  }
}

/**
 * Parse detailed information from a LinkedIn job details panel
 * @param {HTMLElement} detailsPanel - The job details panel element
 * @returns {Object} Detailed job information
 */
export function parseJobDetails(detailsPanel) {
  try {
    // Get the job description
    const descriptionElement = detailsPanel.querySelector('.show-more-less-html__markup');
    const description = descriptionElement 
      ? descriptionElement.innerHTML.trim() 
      : '';
    
    // Get salary information if available
    const salaryElement = detailsPanel.querySelector('.compensation__salary');
    const salaryText = salaryElement 
      ? salaryElement.textContent.trim() 
      : '';
    
    // Try to extract industry information
    const industryElement = detailsPanel.querySelector('[data-test-job-company-industry]');
    const industry = industryElement 
      ? industryElement.textContent.trim() 
      : '';
    
    // Try to extract experience requirements
    let experienceRequired = '';
    const criteria = detailsPanel.querySelectorAll('.description__job-criteria-item');
    for (const criterion of criteria) {
      const labelElement = criterion.querySelector('.description__job-criteria-subheader');
      if (labelElement && labelElement.textContent.includes('Experience')) {
        const valueElement = criterion.querySelector('.description__job-criteria-text');
        if (valueElement) {
          experienceRequired = valueElement.textContent.trim();
        }
        break;
      }
    }
    
    // Try to extract skills requirements
    let requiredSkills = '';
    const skillsSection = detailsPanel.querySelector('.work-requirements__list');
    if (skillsSection) {
      const skillItems = skillsSection.querySelectorAll('li');
      requiredSkills = Array.from(skillItems)
        .map(item => item.textContent.trim())
        .join('\\n');
    }
    
    return {
      description,
      salary_information: salaryText,
      industry,
      experience_required: experienceRequired,
      required_skills: requiredSkills
    };
  } catch (error) {
    console.error('Error parsing job details:', error);
    return {};
  }
}

/**
 * Convert LinkedIn's relative date string to an ISO date string
 * @param {string} dateString - LinkedIn relative date string (e.g., "2 days ago")
 * @returns {string} ISO date string or empty string if parsing failed
 */
function parseLinkedInDate(dateString) {
  try {
    const now = new Date();
    
    // Check if it contains "minutes" or "hours"
    if (dateString.includes('minute') || dateString.includes('hour')) {
      return now.toISOString();
    }
    
    // Check if it contains "days ago"
    if (dateString.includes('day')) {
      const daysAgo = parseInt(dateString.match(/\d+/)[0], 10);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    }
    
    // Check if it contains "weeks ago"
    if (dateString.includes('week')) {
      const weeksAgo = parseInt(dateString.match(/\d+/)[0], 10);
      const date = new Date();
      date.setDate(date.getDate() - (weeksAgo * 7));
      return date.toISOString();
    }
    
    // Check if it contains "months ago"
    if (dateString.includes('month')) {
      const monthsAgo = parseInt(dateString.match(/\d+/)[0], 10);
      const date = new Date();
      date.setMonth(date.getMonth() - monthsAgo);
      return date.toISOString();
    }
    
    // If we can't parse it, return the current date
    return now.toISOString();
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date().toISOString();
  }
}