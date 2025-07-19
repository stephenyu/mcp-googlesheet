#!/usr/bin/env node

/**
 * Test script to verify structured data functionality
 * This tests that the MCP server returns JSON data instead of binary XLSX
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

// Test Google Sheets ID (public Google Sheets template)
const TEST_SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';

async function testStructuredData() {
  console.log('🧪 Testing structured data functionality...\n');

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

    // Test getSheet method (should return structured JSON)
    console.log('\n📊 Testing getSheet method (structured JSON data)...');
    const structuredData = await sheetsService.getSheet(TEST_SHEET_ID);
    
    console.log('✅ Successfully retrieved structured data');
    console.log(`📋 Sheet Title: ${structuredData.title}`);
    console.log(`🔢 Number of worksheets: ${structuredData.sheetCount}`);
    console.log(`📅 Created: ${structuredData.metadata.createdTime}`);
    console.log(`📝 Last modified: ${structuredData.metadata.modifiedTime}`);
    
    // Display first worksheet summary
    if (structuredData.sheets && structuredData.sheets.length > 0) {
      const firstSheet = structuredData.sheets[0];
      console.log(`\n📄 First worksheet: "${firstSheet.title}"`);
      console.log(`   📏 Size: ${firstSheet.rowCount} rows × ${firstSheet.columnCount} columns`);
      
      // Show sample of cell data
      if (firstSheet.cells && Object.keys(firstSheet.cells).length > 0) {
        console.log('   📊 Sample cell data:');
        const cellKeys = Object.keys(firstSheet.cells).slice(0, 5);
        cellKeys.forEach(key => {
          const cell = firstSheet.cells[key];
          console.log(`      ${key}: "${cell.formattedValue || cell.value || '(empty)'}"`);
        });
      }
    }

    // Verify data structure
    console.log('\n🔍 Verifying data structure...');
    
    // Check required properties
    const requiredProps = ['id', 'title', 'url', 'sheetCount', 'sheets', 'metadata'];
    const missingProps = requiredProps.filter(prop => !(prop in structuredData));
    
    if (missingProps.length === 0) {
      console.log('✅ All required properties present');
    } else {
      console.log(`❌ Missing properties: ${missingProps.join(', ')}`);
    }
    
    // Verify it's JSON-serializable
    try {
      const jsonString = JSON.stringify(structuredData, null, 2);
      console.log('✅ Data is JSON-serializable');
      console.log(`📊 JSON size: ${Math.round(jsonString.length / 1024)}KB`);
    } catch (error) {
      console.log('❌ Data is not JSON-serializable:', error.message);
    }

    console.log('\n🎉 Structured data test completed successfully!');
    console.log('\n💡 This data format can now be understood by Claude for analysis and processing.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testStructuredData();
} 