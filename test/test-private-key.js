#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { JWT } from 'google-auth-library';

/**
 * Test script to check private key formatting and identify OpenSSL issues
 */

function formatPrivateKey(key) {
  if (!key) return key;
  
  // Remove any existing formatting
  let formattedKey = key
    .replace(/\\n/g, '\n')  // Handle escaped newlines
    .replace(/\\r/g, '\r')  // Handle escaped carriage returns
    .replace(/\\t/g, '\t')  // Handle escaped tabs
    .trim(); // Remove leading/trailing whitespace
  
  // Check if it's already in PEM format
  if (formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('✅ Private key already has BEGIN marker');
  } else if (formattedKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    console.log('✅ Private key has RSA BEGIN marker (this is fine)');
  } else {
    console.log('⚠️  Private key does not contain BEGIN marker, adding it');
    formattedKey = '-----BEGIN PRIVATE KEY-----\n' + formattedKey;
  }
  
  if (formattedKey.includes('-----END PRIVATE KEY-----')) {
    console.log('✅ Private key already has END marker');
  } else if (formattedKey.includes('-----END RSA PRIVATE KEY-----')) {
    console.log('✅ Private key has RSA END marker (this is fine)');
  } else {
    console.log('⚠️  Private key does not contain END marker, adding it');
    formattedKey = formattedKey + '\n-----END PRIVATE KEY-----';
  }
  
  // Ensure proper line breaks
  formattedKey = formattedKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n')
    .replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----')
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '-----BEGIN RSA PRIVATE KEY-----\n')
    .replace(/-----END RSA PRIVATE KEY-----/, '\n-----END RSA PRIVATE KEY-----');
  
  return formattedKey;
}

async function testPrivateKeyFormatting(credentialsFilePath) {
  try {
    console.log('🔐 Private Key Formatting Test');
    console.log('==============================\n');
    
    // Load credentials
    console.log('📁 Loading credentials...');
    const resolvedPath = resolve(credentialsFilePath);
    const credentialsData = await readFile(resolvedPath, 'utf8');
    const credentials = JSON.parse(credentialsData);
    
    const serviceAccountEmail = credentials.client_email;
    const originalPrivateKey = credentials.private_key;
    const projectId = credentials.project_id;
    
    console.log('📧 Service Account: [REDACTED]');
    console.log(`🏗️  Project ID: ${projectId}`);
    console.log('');
    
    // Analyze original private key
    console.log('🔍 Original Private Key Analysis:');
    console.log(`   Length: ${originalPrivateKey.length} characters`);
    console.log(`   Contains \\n: ${originalPrivateKey.includes('\\n')}`);
    console.log(`   Contains actual newlines: ${originalPrivateKey.includes('\n')}`);
    console.log(`   Contains BEGIN marker: ${originalPrivateKey.includes('-----BEGIN PRIVATE KEY-----')}`);
    console.log(`   Contains END marker: ${originalPrivateKey.includes('-----END PRIVATE KEY-----')}`);
    console.log('   First 50 chars: [REDACTED]');
    console.log('   Last 50 chars: [REDACTED]');
    console.log('');
    
    // Format the private key
    console.log('🔧 Formatting Private Key...');
    const formattedPrivateKey = formatPrivateKey(originalPrivateKey);
    
    console.log('✅ Formatted Private Key Analysis:');
    console.log(`   Length: ${formattedPrivateKey.length} characters`);
    console.log(`   Contains BEGIN marker: ${formattedPrivateKey.includes('-----BEGIN PRIVATE KEY-----')}`);
    console.log(`   Contains END marker: ${formattedPrivateKey.includes('-----END PRIVATE KEY-----')}`);
    console.log('   First 50 chars: [REDACTED]');
    console.log('   Last 50 chars: [REDACTED]');
    console.log('');
    
    // Test JWT creation
    console.log('🔐 Testing JWT Creation...');
    try {
      const SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ];

      const jwt = new JWT({
        email: serviceAccountEmail,
        key: formattedPrivateKey,
        scopes: SCOPES,
      });
      
      console.log('✅ JWT created successfully!');
      console.log(`   Email: ${jwt.email}`);
      console.log(`   Scopes: ${jwt.scopes.join(', ')}`);
      
      // Test getting access token
      console.log('🔄 Testing access token generation...');
      const accessToken = await jwt.getAccessToken();
      console.log('✅ Access token generated successfully!');
      console.log(`   Token type: ${accessToken.token_type}`);
      console.log(`   Expires in: ${accessToken.expires_in} seconds`);
      
    } catch (jwtError) {
      console.error('❌ JWT creation failed:', jwtError.message);
      
      if (jwtError.message.includes('NO_START_LINE')) {
        console.log('');
        console.log('🔍 OpenSSL "NO_START_LINE" Error Analysis:');
        console.log('This error occurs when OpenSSL cannot find the BEGIN marker.');
        console.log('Possible causes:');
        console.log('1. Private key is missing the "-----BEGIN PRIVATE KEY-----" line');
        console.log('2. Private key has incorrect line endings');
        console.log('3. Private key contains extra characters or formatting');
        console.log('4. Private key is base64 encoded without proper PEM formatting');
        console.log('');
        console.log('💡 Try manually checking your private key format in the JSON file.');
      }
      
      return {
        success: false,
        error: jwtError.message
      };
    }
    
    console.log('');
    console.log('🎉 Private key formatting test completed successfully!');
    console.log('   Your private key is properly formatted and ready to use.');
    
    return {
      success: true,
      originalLength: originalPrivateKey.length,
      formattedLength: formattedPrivateKey.length
    };
    
  } catch (error) {
    console.error('❌ Private key test failed:', error.message);
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
    console.log('Usage: node test-private-key.js <path-to-credentials.json>');
    console.log('');
    console.log('Example:');
    console.log('  node test-private-key.js ./credentials.json');
    console.log('  node test-private-key.js /path/to/service-account-key.json');
    process.exit(1);
  }
  
  const credentialsPath = args[0];
  const result = await testPrivateKeyFormatting(credentialsPath);
  
  if (result.success) {
    console.log('\n✅ Private key test passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Private key test failed. Please check the error details above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 