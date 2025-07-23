#!/usr/bin/env node

/**
 * Test script to verify the new 2D array structure
 * This tests the updated format with metadata and cells array
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

async function test2DStructure() {
  console.log('🧪 Testing new 2D array structure...\n');

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

    // Get spreadsheet summary first
    console.log('\n📊 Getting spreadsheet summary...');
    const summary = await sheetsService.getSpreadsheetSummary(TEST_SHEET_URL);
    
    const firstSheetName = summary.sheetNames[0].name;
    console.log(`📄 Testing with sheet: "${firstSheetName}"`);

    // Get data in new 2D format
    console.log('\n📊 Getting sheet data in new 2D format...');
    const sheetData = await sheetsService.getSheetData(TEST_SHEET_URL, firstSheetName);
    
    console.log('✅ Successfully retrieved data in new format!');
    
    // Verify structure
    console.log('\n🔍 Verifying structure...');
    console.log(`📋 Spreadsheet: ${sheetData.spreadsheetTitle}`);
    console.log(`📄 Sheet: ${sheetData.metadata.title}`);
    console.log(`📏 Dimensions: ${sheetData.metadata.dimensions.rows} rows × ${sheetData.metadata.dimensions.columns} columns`);
    console.log(`📊 Cells with data: ${sheetData.cells.length}`);
    
    // Show sample cells in new format
    console.log('\n📊 Sample cells in new 2D format:');
    const sampleCells = sheetData.cells.slice(0, 10);
    
    sampleCells.forEach((cell, index) => {
      const posStr = `[${cell.pos[0]},${cell.pos[1]}]`;
      const valStr = typeof cell.val === 'string' ? `"${cell.val}"` : cell.val;
      const fmtStr = cell.fmt ? ` (formatted: "${cell.fmt}")` : '';
      console.log(`   ${index + 1}. pos: ${posStr}, val: ${valStr}, type: ${cell.type}${fmtStr}`);
    });
    
    // Test type detection
    console.log('\n🔍 Type distribution:');
    const typeCounts = {};
    sheetData.cells.forEach(cell => {
      typeCounts[cell.type] = (typeCounts[cell.type] || 0) + 1;
    });
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} cells`);
    });
    
    // Show examples of different types
    console.log('\n📊 Examples by type:');
    const typeExamples = {};
    sheetData.cells.forEach(cell => {
      if (!typeExamples[cell.type]) {
        typeExamples[cell.type] = cell;
      }
    });
    
    Object.entries(typeExamples).forEach(([type, cell]) => {
      const posStr = `[${cell.pos[0]},${cell.pos[1]}]`;
      const valStr = typeof cell.val === 'string' ? `"${cell.val}"` : cell.val;
      const fmtStr = cell.fmt ? ` → "${cell.fmt}"` : '';
      console.log(`   ${type}: ${valStr}${fmtStr} at ${posStr}`);
    });
    
    // Verify JSON serialization
    console.log('\n🔍 Testing JSON serialization...');
    try {
      const jsonString = JSON.stringify(sheetData, null, 2);
      console.log('✅ Data is JSON-serializable');
      console.log(`📊 JSON size: ${Math.round(jsonString.length / 1024)}KB`);
    } catch (error) {
      console.log('❌ Data is not JSON-serializable:', error.message);
    }

    console.log('\n🎉 2D array structure test completed successfully!');
    console.log('\n💡 New structure benefits:');
    console.log('   ✅ More compact representation');
    console.log('   ✅ Preserves exact cell positions');
    console.log('   ✅ Automatic type detection');
    console.log('   ✅ Separates raw values from formatting');
    console.log('   ✅ Easy to process for AI analysis');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
test2DStructure(); 