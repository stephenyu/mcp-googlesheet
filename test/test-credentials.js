#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * Test script to verify credentials JSON file loading
 * This simulates the same logic used in server/index.js
 */

async function testCredentialsLoading(credentialsFilePath) {
  try {
    console.log('Testing credentials loading...');
    
    // Resolve the file path (handle relative paths)
    const resolvedPath = resolve(credentialsFilePath);
    console.log(`Resolved path: ${resolvedPath}`);
    
    // Read and parse the credentials file
    const credentialsData = await readFile(resolvedPath, 'utf8');
    const credentials = JSON.parse(credentialsData);
    
    // Extract required fields
    const serviceAccountEmail = credentials.client_email;
    const privateKey = credentials.private_key;
    const projectId = credentials.project_id;
    
    // Validate required fields
    if (!serviceAccountEmail || !privateKey || !projectId) {
      throw new Error('Invalid credentials JSON file. Missing required fields: client_email, private_key, or project_id');
    }
    
    console.log('✅ Credentials loaded successfully!');
    console.log('📧 Service Account Email: [REDACTED]');
    console.log('🔑 Private Key: [REDACTED]');
    console.log(`🏗️  Project ID: ${projectId}`);
    
    // Test private key format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.warn('⚠️  Warning: Private key may not be in the correct format');
    } else {
      console.log('✅ Private key format looks correct');
    }
    
    return {
      success: true,
      serviceAccountEmail,
      privateKey,
      projectId
    };
    
  } catch (error) {
    console.error('❌ Error loading credentials:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node test-credentials.js <path-to-credentials.json>');
    console.log('');
    console.log('Example:');
    console.log('  node test-credentials.js ./credentials.json');
    console.log('  node test-credentials.js /path/to/service-account-key.json');
    process.exit(1);
  }
  
  const credentialsPath = args[0];
  const result = await testCredentialsLoading(credentialsPath);
  
  if (result.success) {
    console.log('\n🎉 Credentials test passed! Your JSON file is ready to use.');
    process.exit(0);
  } else {
    console.log('\n💥 Credentials test failed. Please check your JSON file.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 