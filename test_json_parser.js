// Test script for JSON parser using Node.js
// Run with: node test_json_parser.js

const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = undefined;
global.self = {};
global.console = console;

// Load our JSON parser
const jsonParserCode = fs.readFileSync(
  path.join(__dirname, 'chrome_extension/utils/json_parser.js'), 
  'utf8'
);

// Execute the parser code
eval(jsonParserCode);

// Load sample HTML data
const sampleFiles = [
  'sample_data/Search results.html',
  'sample_data/Search results with job expanded.html'
];

console.log('🧪 Testing JSON Parser with Sample Data\n');

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
    
    // Create a mock DOM
    const mockContainers = [];
    
    // Extract content from <code> elements using regex
    const codeRegex = /<code[^>]*>(.*?)<\/code>/gs;
    let match;
    
    while ((match = codeRegex.exec(htmlContent)) !== null) {
      mockContainers.push({
        textContent: match[1]
      });
    }

    console.log(`Found ${mockContainers.length} code elements`);

    // Test JSON parsing on each container
    let totalJobs = 0;
    const allJobIds = new Set();

    mockContainers.forEach((container, index) => {
      const jsonData = self.JobHunter.JSONParser.parseJobJSON(container.textContent);
      
      if (jsonData) {
        const jobCards = self.JobHunter.JSONParser.extractJobCards(jsonData);
        
        if (jobCards.length > 0) {
          console.log(`  📦 Container ${index + 1}: Found ${jobCards.length} job cards`);
          
          jobCards.forEach(jobCard => {
            const metadata = self.JobHunter.JSONParser.extractJobMetadata(jobCard);
            if (metadata && metadata.external_id) {
              allJobIds.add(metadata.external_id);
              totalJobs++;
              console.log(`    🎯 Job ID: ${metadata.external_id}`);
              if (metadata.url) {
                console.log(`    🔗 URL: ${metadata.url.substring(0, 80)}...`);
              }
            }
          });
        }
      }
    });

    console.log(`\n✅ Summary for ${filePath}:`);
    console.log(`   Total job cards found: ${totalJobs}`);
    console.log(`   Unique job IDs: ${allJobIds.size}`);
    console.log(`   Job IDs: [${Array.from(allJobIds).join(', ')}]`);

  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
  }

  console.log('\n');
});

// Test individual functions
console.log('🔧 Testing Individual Functions\n');

// Test URN extraction
const testUrns = [
  'urn:li:fsd_jobPostingCard:(4226352667,SEMANTIC_SEARCH)',
  'urn:li:fsd_jobPostingCard:(4197394092,SEMANTIC_SEARCH)',
  'invalid_urn',
  null
];

testUrns.forEach(urn => {
  const jobId = self.JobHunter.JSONParser.extractJobIdFromURN(urn);
  console.log(`URN: ${urn} → Job ID: ${jobId}`);
});

console.log('\n✅ JSON Parser testing complete!');