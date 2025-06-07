# JobHunter Application Overview

## Application Structure

JobHunter is a comprehensive job hunting tool consisting of two main components:

1. **Rails Backend Application**: A Ruby on Rails application that serves as the main dashboard and data storage system
2. **Chrome Extension**: A browser extension that integrates with LinkedIn to scrape job listings

## Rails Backend

The Rails application provides:

- User authentication (via Devise)
- Search preferences management
- Job listings storage and viewing
- A dashboard to track job application status

### Key Models

- `User`: Authentication and user data
- `SearchPreference`: User's job search criteria
- `JobTitlePreference`: Specific job titles the user is interested in
- `LocationPreference`: Locations where the user wants to work
- `IndustryPreference`: Industries the user is targeting
- `JobListing`: Job listings scraped from LinkedIn

### API

The application includes an API (v1) with endpoints for:

- Authentication
- Managing search preferences
- Retrieving and storing job listings

## Chrome Extension

The Chrome extension automates LinkedIn job searching by:

1. Integrating with LinkedIn jobs pages
2. Scraping job listings that match user preferences
3. Sending data back to the Rails backend

### Extension Components

- **Background Script**: Manages extension state and coordinates between popup and content scripts
- **Content Scripts**: Run on LinkedIn pages to interact with job listings
- **Popup**: User interface for initiating searches and viewing basic information
- **Utility Modules**:
  - `api.js`: Handles communication with Rails backend
  - `storage.js`: Manages local storage of data
  - `parser.js`: Parses LinkedIn job data
  - `common.js`: Shared utilities

## Current State of Development

### Rails Backend
- Basic structure and models are in place
- API endpoints are defined
- Authentication system is operational

### Chrome Extension
- Basic structure is set up
- Messaging between components is functional
- Currently using a simplified version without login requirements
- Has stubbed job search functionality that returns mock data

### Current Implementation Status

#### Stage 1: Job Discovery ✅ COMPLETED
- **JSON Parser**: Successfully extracts job IDs from LinkedIn search results
- **Real Data Validation**: Tested with actual LinkedIn HTML samples
- **Performance**: Extracts 25+ unique job IDs from search result pages
- **HTML Entity Handling**: Robust processing of LinkedIn's encoded JSON

#### Stage 2: Job Detail Extraction ✅ COMPLETED  
- **Detail Extractor**: Comprehensive job data extraction from individual job pages
- **Multi-Strategy Approach**: JSON → DOM → Panel fallback extraction methods
- **Rate Limiting**: Configurable delays (2-3 seconds) for anti-detection
- **Validation**: Complete job data extracted for real LinkedIn posting (4226352667)

#### Extension Integration 🔄 IN PROGRESS
- **Core Utilities**: JSON parser and detail extractor modules ready
- **Messaging System**: Background script ↔ content script communication working
- **Basic UI**: Extension popup functional with "Start Job Search" workflow
- **API Integration**: Rails backend endpoints ready for data submission

### Technical Architecture
```
LinkedIn Search → Stage 1 (Job Discovery) → Stage 2 (Detail Extraction) → Rails API
                      ↓                           ↓                        ↓
                  JSON Parser               Detail Extractor         Batch Upload
                 (25 job IDs)              (Complete job data)      (Structured data)
```

### Key Files Implemented
- `chrome_extension/utils/json_parser.js` - Stage 1 job discovery engine
- `chrome_extension/utils/job_detail_extractor.js` - Stage 2 detail extraction
- `test_data_extraction_logic.js` - Validation with real LinkedIn data

### Resolved Issues
- ✅ **JSON Structure**: LinkedIn's embedded JSON parsing working reliably
- ✅ **HTML Entity Encoding**: Proper decoding implemented and tested
- ✅ **URN Processing**: Multiple LinkedIn URN formats supported
- ✅ **Data Extraction**: Core job fields (title, location, description) extracting successfully
- ✅ **Rate Limiting**: Anti-detection measures implemented

### Remaining Work
- Integration of JSON parser into LinkedIn content script
- End-to-end workflow testing with real LinkedIn pages
- Error handling and user feedback implementation

## Technical Details

### Background Script
The background script (`background.js`) manages the extension's core functionality:
- Handles messages between popup and content scripts
- Manages navigation to LinkedIn
- Forwards search results to popup

### Content Script
The LinkedIn content script (`linkedin.js`) has:
- Basic message handling to receive search requests
- Mock job search functionality
- Integration with shared utilities

### Popup
The popup provides a simple interface with:
- "Start Job Search" button
- Links to dashboard and preferences
- Status messages for search results

The messaging flow is fully functional between all components, providing a foundation for implementing the actual scraping functionality.

## Development Approach

### Testing Strategy
We use a hybrid testing approach that balances development speed with code quality:

**Rails Backend - TDD Approach:**
- Use Test-Driven Development for all Rails components (models, controllers, API endpoints)
- Leverage existing MiniTest setup with fixtures and parallel testing
- Write tests first for business logic, validations, and API contracts
- Run `rails test` to execute the test suite

**Chrome Extension - Manual Testing with Error Handling:**
- Skip TDD for extension scraping logic due to complexity and brittleness
- Focus on robust error handling and comprehensive logging
- Extract core parsing logic into pure, testable functions where possible
- Use manual testing with real LinkedIn pages for validation
- Implement defensive programming patterns to handle LinkedIn changes gracefully

This approach minimizes development overhead while maintaining confidence in the Rails backend where business logic resides, and acknowledges the dynamic nature of web scraping where traditional unit tests provide limited value.