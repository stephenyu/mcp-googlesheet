#!/usr/bin/env node

/**
 * Test script to debug environment variable issues in Claude Desktop DXT extensions
 * This helps identify if environment variable interpolation is working correctly
 */

console.log('🔍 Environment Variable Debug Test');
console.log('=====================================\n');

// Check the required environment variable for JSON file credentials
const envVars = [
  'GOOGLE_CREDENTIALS_JSON_FILE'
];

console.log('Environment Variables Status:');
console.log('-------------------------------');

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Check if it contains unresolved placeholders
    if (value.includes('${user_config.')) {
      console.log(`❌ ${varName}: CONTAINS UNRESOLVED PLACEHOLDER`);
      console.log(`   Value: "${value}"`);
      console.log(`   This indicates environment variable interpolation failed.`);
    } else {
      console.log(`✅ ${varName}: SET`);
      if (varName === 'GOOGLE_CREDENTIALS_JSON_FILE') {
        console.log('   Value: [REDACTED - file path]');
        console.log('   (This should be an absolute path to your JSON credentials file)');
      } else {
        console.log(`   Value: "${value}"`);
      }
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
  console.log('');
});

// Test file access if credentials file is set
const credentialsFile = process.env.GOOGLE_CREDENTIALS_JSON_FILE;
if (credentialsFile && !credentialsFile.includes('${user_config.')) {
  console.log('Testing File Access:');
  console.log('-------------------');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const resolvedPath = path.resolve(credentialsFile);
    console.log('📁 Resolved path: [REDACTED]');
    
    if (fs.existsSync(resolvedPath)) {
      console.log('✅ File exists and is accessible');
      
      const stats = fs.statSync(resolvedPath);
      console.log(`📊 File size: ${stats.size} bytes`);
      console.log(`🔐 File permissions: ${stats.mode.toString(8)}`);
      
      // Try to read the file
      const content = fs.readFileSync(resolvedPath, 'utf8');
      console.log('✅ File can be read successfully');
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(content);
        console.log('✅ File contains valid JSON');
        
        // Check required fields
        const requiredFields = ['client_email', 'private_key', 'project_id'];
        const missingFields = requiredFields.filter(field => !json[field]);
        
        if (missingFields.length === 0) {
          console.log('✅ All required fields present in JSON');
        } else {
          console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
        }
      } catch (jsonError) {
        console.log(`❌ File is not valid JSON: ${jsonError.message}`);
      }
    } else {
      console.log('❌ File does not exist');
    }
  } catch (error) {
    console.log(`❌ Error accessing file: ${error.message}`);
  }
} else if (credentialsFile && credentialsFile.includes('${user_config.')) {
  console.log('⚠️  Credentials file path contains unresolved placeholders');
  console.log('   This indicates a configuration issue in Claude Desktop');
}

console.log('\n🔧 Troubleshooting Tips:');
console.log('========================');
console.log('1. If you see unresolved placeholders, check your Claude Desktop extension settings');
console.log('2. Make sure you have configured the JSON credentials file path in extension settings');
console.log('3. Use absolute paths for the JSON file (e.g., /Users/username/path/to/service-account-key.json)');
console.log('4. Ensure the JSON file contains client_email, private_key, and project_id fields');
console.log('5. The JSON file should be the complete service account key downloaded from Google Cloud Console'); 