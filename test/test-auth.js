#!/usr/bin/env node

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * Test script to verify Google API authentication
 * This simulates the exact same authentication process used in the extension
 */

async function testGoogleAuth(credentialsFilePath) {
  try {
    console.log('🔐 Testing Google API Authentication');
    console.log('=====================================\n');
    
    // Load credentials (same as extension)
    console.log('📁 Loading credentials...');
    const resolvedPath = resolve(credentialsFilePath);
    const credentialsData = await readFile(resolvedPath, 'utf8');
    const credentials = JSON.parse(credentialsData);
    
    const serviceAccountEmail = credentials.client_email;
    const privateKey = credentials.private_key;
    const projectId = credentials.project_id;
    
    console.log('📧 Service Account: [REDACTED]');
    console.log(`🏗️  Project ID: ${projectId}`);
    console.log('🔑 Private Key: [REDACTED]');
    console.log('');
    
    // Define required scopes for Google Sheets and Drive access
    const SCOPES = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ];

    // Create JWT authentication with proper scopes (same as extension)
    const auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: SCOPES,
    });
    
    console.log('🔐 Testing authentication with Google Sheets API...');
    
    // Test with a public Google Sheet (Google's example sheet)
    const testSheetId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    console.log(`📊 Testing with public sheet: ${testSheetId}`);
    
    const doc = new GoogleSpreadsheet(testSheetId, auth);
    
    // Try to load document info (this will test authentication)
    console.log('🔄 Attempting to load document info...');
    await doc.loadInfo();
    
    console.log('✅ Authentication successful!');
    console.log(`📋 Sheet title: ${doc.title}`);
    console.log(`📄 Number of sheets: ${doc.sheetCount}`);
          console.log('🔗 Sheet URL: [REDACTED]');
    console.log('');
    
    // Test downloading as XLSX
    console.log('📥 Testing XLSX download...');
    const xlsxBuffer = await doc.downloadAsXLSX();
    console.log(`✅ XLSX download successful! Size: ${xlsxBuffer.length} bytes`);
    console.log('');
    
    console.log('🎉 All authentication tests passed!');
    console.log('');
    console.log('🔧 If you\'re still getting "Invalid auth" errors in the extension:');
    console.log('1. Make sure the Google Sheets you\'re trying to access are shared with your service account');
    console.log('2. Check that Google Sheets API and Drive API are enabled in your Google Cloud project');
    console.log('3. Verify the service account has the necessary permissions');
    console.log('4. Try accessing a public Google Sheet first to test the connection');
    
    return {
      success: true,
      sheetTitle: doc.title,
      xlsxSize: xlsxBuffer.length
    };
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    console.log('');
    
    if (error.message.includes('Invalid auth')) {
      console.log('🔍 "Invalid auth" error troubleshooting:');
      console.log('1. Check if the service account email is correct');
      console.log('2. Verify the private key is complete and properly formatted');
      console.log('3. Ensure Google Sheets API is enabled in your Google Cloud project');
      console.log('4. Check if the service account has the necessary scopes');
      console.log('5. Try regenerating the service account key');
    } else if (error.message.includes('Not Found')) {
      console.log('🔍 "Not Found" error troubleshooting:');
      console.log('1. The sheet ID might be incorrect');
      console.log('2. The sheet might not be accessible to your service account');
      console.log('3. Try with a different sheet ID');
    } else if (error.message.includes('Forbidden')) {
      console.log('🔍 "Forbidden" error troubleshooting:');
      console.log('1. The sheet is not shared with your service account');
      console.log('2. The service account lacks necessary permissions');
      console.log('3. Share the sheet with your service account email');
    }
    
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
    console.log('Usage: node test-auth.js <path-to-credentials.json>');
    console.log('');
    console.log('Example:');
    console.log('  node test-auth.js ./credentials.json');
    console.log('  node test-auth.js /path/to/service-account-key.json');
    process.exit(1);
  }
  
  const credentialsPath = args[0];
  const result = await testGoogleAuth(credentialsPath);
  
  if (result.success) {
    console.log('\n✅ Authentication test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Authentication test failed. Please check the error details above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 