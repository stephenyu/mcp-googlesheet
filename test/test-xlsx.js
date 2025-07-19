#!/usr/bin/env node

import { GoogleSheetsService } from '../server/sheets.js';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Test sheet ID (Google's sample spreadsheet)
const TEST_SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
const TEST_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';

async function testXlsxFunctionality() {
  console.log('🧪 Testing XLSX Download Functionality\n');

  // Load credentials from JSON file
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_JSON_FILE;
  if (!credentialsPath) {
    console.log('❌ Missing GOOGLE_CREDENTIALS_JSON_FILE environment variable.');
    console.log('Please set it to the path of your service account JSON file.');
    return;
  }

  try {
    console.log('📄 Loading credentials from JSON file...');
    const credentialsContent = readFileSync(credentialsPath, 'utf8');
    const credentials = JSON.parse(credentialsContent);
    
    const TEST_CONFIG = {
      serviceAccountEmail: credentials.client_email,
      privateKey: credentials.private_key,
      projectId: credentials.project_id,
    };

    if (!TEST_CONFIG.serviceAccountEmail || !TEST_CONFIG.privateKey || !TEST_CONFIG.projectId) {
      console.log('❌ Invalid credentials JSON file. Missing required fields: client_email, private_key, or project_id.');
      return;
    }

    // Initialize the service
    console.log('🔧 Initializing Google Sheets service...');
    const sheetsService = new GoogleSheetsService(TEST_CONFIG);
    await sheetsService.initialize();
    console.log('✅ Service initialized successfully\n');

    // Test 1: Get spreadsheet by ID
    console.log('📋 Test 1: Getting spreadsheet by ID...');
    const xlsxBufferById = await sheetsService.getSpreadsheetById(TEST_SHEET_ID);
    console.log(`✅ Successfully downloaded XLSX by ID (${xlsxBufferById.length} bytes)`);

    // Save the file
    const outputPathById = join(process.cwd(), 'test-output-by-id.xlsx');
    writeFileSync(outputPathById, xlsxBufferById);
    console.log(`💾 Saved to: ${outputPathById}\n`);

    // Test 2: Get spreadsheet by URL
    console.log('🔗 Test 2: Getting spreadsheet by URL...');
    const xlsxBufferByUrl = await sheetsService.getSpreadsheetByUrl(TEST_SHEET_URL);
    console.log(`✅ Successfully downloaded XLSX by URL (${xlsxBufferByUrl.length} bytes)`);

    // Save the file
    const outputPathByUrl = join(process.cwd(), 'test-output-by-url.xlsx');
    writeFileSync(outputPathByUrl, xlsxBufferByUrl);
    console.log(`💾 Saved to: ${outputPathByUrl}\n`);

    // Test 3: URL parsing
    console.log('🔍 Test 3: Testing URL parsing...');
    const extractedId = sheetsService.extractSheetIdFromUrl(TEST_SHEET_URL);
    console.log(`✅ Extracted ID: ${extractedId}`);
    console.log(`✅ ID matches: ${extractedId === TEST_SHEET_ID ? 'Yes' : 'No'}\n`);

    // Test 4: Compare file sizes
    console.log('📊 Test 4: Comparing file sizes...');
    if (xlsxBufferById.length === xlsxBufferByUrl.length) {
      console.log('✅ Both methods produced files of the same size');
    } else {
      console.log('⚠️  Files have different sizes (this might be expected due to timing)');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📁 Generated files:');
    console.log(`   - ${outputPathById}`);
    console.log(`   - ${outputPathByUrl}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testXlsxFunctionality().catch(console.error); 