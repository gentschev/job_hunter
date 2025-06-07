// Test script for Job Detail Extractor using Node.js
// Run with: node test_job_detail_extractor.js

const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {
  location: { href: 'https://www.linkedin.com/jobs/view/4226352667/' }
};
global.self = {};
global.console = console;
global.document = {
  querySelector: () => null,
  querySelectorAll: () => []
};

// Load our job detail extractor
const detailExtractorCode = fs.readFileSync(
  path.join(__dirname, 'chrome_extension/utils/job_detail_extractor.js'), 
  'utf8'
);

// Execute the detail extractor code
eval(detailExtractorCode);

// Load sample HTML data for testing
const sampleFiles = [
  'sample_data/Job page.html',
  'sample_data/Search results with job expanded.html'
];

console.log('🧪 Testing Job Detail Extractor with Sample Data\n');

sampleFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  console.log(`📄 Testing file: ${filePath}`);
  console.log('=' .repeat(50));

  try {
    const htmlContent = fs.readFileSync(fullPath, 'utf8');
    
    // Mock document with HTML content
    global.document = createMockDocument(htmlContent);

    // Test job IDs from our previous extraction
    const testJobIds = ['4226352667', '4212867536', '4215950490'];

    testJobIds.forEach(jobId => {
      console.log(`\n🔍 Testing extraction for job ID: ${jobId}`);
      
      // Test JSON extraction
      console.log('  📊 Testing JSON extraction...');
      const jsonResult = global.self.JobHunter?.JobDetailExtractor?.extractFromJSON?.(jobId);
      if (jsonResult) {
        console.log(`    ✅ JSON extraction successful:`);
        console.log(`    📝 Title: ${jsonResult.title || 'Not found'}`);
        console.log(`    🏢 Company: ${jsonResult.company || 'Not found'}`);
        console.log(`    📍 Location: ${jsonResult.location || 'Not found'}`);
        console.log(`    📋 Description: ${jsonResult.description ? jsonResult.description.substring(0, 100) + '...' : 'Not found'}`);
      } else {
        console.log(`    ⚠️  JSON extraction failed for job ${jobId}`);
      }

      // Test full extraction
      console.log('  🔧 Testing full extraction...');
      const fullResult = global.self.JobHunter?.JobDetailExtractor?.extractJobDetails?.(jobId);
      if (fullResult) {
        console.log(`    ✅ Full extraction successful (method: ${fullResult.extraction_method})`);
        console.log(`    📝 Title: ${fullResult.title || 'Not found'}`);
        console.log(`    🏢 Company: ${fullResult.company || 'Not found'}`);
        console.log(`    📍 Location: ${fullResult.location || 'Not found'}`);
        console.log(`    📅 Posted: ${fullResult.posted_date || 'Not found'}`);
        console.log(`    💼 Type: ${fullResult.employment_type || 'Not found'}`);
        console.log(`    🔗 URL: ${fullResult.url}`);
      } else {
        console.log(`    ❌ Full extraction failed for job ${jobId}`);
      }
    });

    console.log(`\n✅ Summary for ${filePath}:`);
    console.log(`   Tested ${testJobIds.length} job IDs`);

  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
  }

  console.log('\n');
});

// Test individual functions
console.log('🔧 Testing Individual Functions\n');

// Test job ID extraction from different URN formats
const testUrns = [
  'urn:li:fsd_jobPostingCard:(4226352667,SEMANTIC_SEARCH)',
  'urn:li:jobPosting:4197394092',
  'invalid_urn'
];

console.log('Testing job ID extraction from various data structures:');
testUrns.forEach(urn => {
  const mockJobData = { urn: urn, entityUrn: urn };
  const extractedId = extractJobIdFromData(mockJobData);
  console.log(`URN: ${urn} → Job ID: ${extractedId}`);
});

console.log('\n✅ Job Detail Extractor testing complete!');

// Helper function to create mock document
function createMockDocument(htmlContent) {
  return {
    querySelector: (selector) => {
      // Simple mock implementation
      // In real testing, you'd use jsdom or similar
      return null;
    },
    querySelectorAll: (selector) => {
      if (selector.includes('code')) {
        // Extract code elements from HTML
        const codeRegex = /<code[^>]*>(.*?)<\/code>/gs;
        const matches = [];
        let match;
        
        while ((match = codeRegex.exec(htmlContent)) !== null) {
          matches.push({
            textContent: match[1]
          });
        }
        
        return matches;
      }
      return [];
    }
  };
}

// Helper function to extract job ID from job data (simplified version for testing)
function extractJobIdFromData(jobData) {
  if (!jobData) return null;

  // Check direct ID fields
  if (jobData.jobId) return jobData.jobId.toString();
  if (jobData.id) return jobData.id.toString();
  
  // Check URN fields
  if (jobData.urn && jobData.urn.includes('jobPosting')) {
    const match = jobData.urn.match(/\((\d+),/) || jobData.urn.match(/:(\d+)$/);
    if (match) return match[1];
  }

  if (jobData.entityUrn) {
    const match = jobData.entityUrn.match(/\d+/);
    if (match) return match[0];
  }

  return null;
}