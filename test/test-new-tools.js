#!/usr/bin/env node

/**
 * Test script to verify the new tools: get_spreadsheet_summary and get_spreadsheet_sheet_data
 * This tests the improved functionality for handling large spreadsheets
 */

import { GoogleSheetsService } from '../server/sheets.js';
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenvConfig({ path: join(__dirname, '../.env') });

// Test Google Sheets URL (public Google Sheets template)
const TEST_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';

async function testNewTools() {
  console.log('🧪 Testing new tools: summary and sheet data...\n');

  try {
    // Load credentials from JSON file
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_JSON_FILE;
    if (!credentialsPath) {
      throw new Error('Missing GOOGLE_CREDENTIALS_JSON_FILE environment variable. Please set it to the path of your service account JSON file.');
    }

    console.log('📄 Loading credentials from JSON file...');
    const credentialsContent = readFileSync(credentialsPath, 'utf8');
    const credentials = JSON.parse(credentialsContent);
    
    const serviceAccountEmail = credentials.client_email;
    const privateKey = credentials.private_key;
    const projectId = credentials.project_id;

    if (!serviceAccountEmail || !privateKey || !projectId) {
      throw new Error('Invalid credentials JSON file. Missing required fields: client_email, private_key, or project_id.');
    }

    // Initialize service
    const sheetsService = new GoogleSheetsService({
      serviceAccountEmail,
      privateKey,
      projectId,
    });

    await sheetsService.initialize();
    console.log('✅ Google Sheets service initialized');

    // Test 1: Get spreadsheet summary
    console.log('\n📊 Testing getSpreadsheetSummary...');
    const summary = await sheetsService.getSpreadsheetSummary(TEST_SHEET_URL);
    
    console.log('✅ Successfully retrieved spreadsheet summary');
    console.log(`📋 Title: ${summary.title}`);
    console.log(`🔢 Number of sheets: ${summary.sheetCount}`);
    console.log(`📅 Created: ${summary.metadata.createdTime}`);
    console.log(`📝 Last modified: ${summary.metadata.modifiedTime}`);
    
    console.log('\n📄 Available sheets:');
    summary.sheetNames.forEach((sheet, index) => {
      console.log(`   ${index + 1}. ${sheet.name} (${sheet.rowCount} rows × ${sheet.columnCount} columns)`);
    });

    // Test 2: Get data from first sheet
    if (summary.sheetNames.length > 0) {
      const firstSheetName = summary.sheetNames[0].name;
      console.log(`\n📊 Testing getSheetData for sheet: "${firstSheetName}"...`);
      
      const sheetData = await sheetsService.getSheetData(TEST_SHEET_URL, firstSheetName);
      
      console.log('✅ Successfully retrieved sheet data');
      console.log(`📋 Spreadsheet: ${sheetData.spreadsheetTitle}`);
      console.log(`📄 Sheet: ${sheetData.sheet.title}`);
      console.log(`📏 Size: ${sheetData.sheet.rowCount} rows × ${sheetData.sheet.columnCount} columns`);
      
      // Show sample of cell data
      if (sheetData.sheet.cells && Object.keys(sheetData.sheet.cells).length > 0) {
        console.log('\n📊 Sample cell data:');
        const cellKeys = Object.keys(sheetData.sheet.cells).slice(0, 5);
        cellKeys.forEach(key => {
          const cell = sheetData.sheet.cells[key];
          console.log(`      ${key}: "${cell.formattedValue || cell.value || '(empty)'}"`);
        });
      }
    }

    // Test 3: Error handling - try to get non-existent sheet
    console.log('\n❌ Testing error handling with non-existent sheet...');
    try {
      await sheetsService.getSheetData(TEST_SHEET_URL, 'NonExistentSheet');
      console.log('❌ Error test failed - should have thrown an error');
    } catch (error) {
      console.log('✅ Error handling works correctly:', error.message);
    }

    console.log('\n🎉 New tools test completed successfully!');
    console.log('\n💡 Benefits:');
    console.log('   - Can efficiently browse large spreadsheets');
    console.log('   - Only loads data for sheets you need');
    console.log('   - Avoids overwhelming output from massive spreadsheets');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testNewTools();
} 