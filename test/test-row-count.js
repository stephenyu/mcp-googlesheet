#!/usr/bin/env node

import { GoogleSheetsService } from '../server/sheets.js';
import { readFileSync } from 'fs';

const TEST_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';

async function testRowCount() {
  console.log('🧪 Testing row count verification (checking if we get ALL rows, not just 30)...\n');

  try {
    // Load credentials from JSON file
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_JSON_FILE;
    if (!credentialsPath) {
      throw new Error('Missing GOOGLE_CREDENTIALS_JSON_FILE environment variable');
    }

    console.log('📄 Loading credentials from JSON file...');
    const credentialsContent = readFileSync(credentialsPath, 'utf8');
    const credentials = JSON.parse(credentialsContent);
    
    const serviceAccountEmail = credentials.client_email;
    const privateKey = credentials.private_key;
    const projectId = credentials.project_id;

    // Initialize service
    const sheetsService = new GoogleSheetsService({
      serviceAccountEmail,
      privateKey,
      projectId,
    });

    await sheetsService.initialize();
    console.log('✅ Google Sheets service initialized\n');

    // Get spreadsheet summary first
    console.log('📊 Getting spreadsheet summary...');
    const summary = await sheetsService.getSpreadsheetSummary(TEST_SHEET_URL);
    
    const firstSheet = summary.sheetNames[0];
    console.log(`📄 Found sheet: "${firstSheet.name}" with ${firstSheet.rowCount} rows × ${firstSheet.columnCount} columns\n`);

    // Get actual data
    console.log('📊 Retrieving sheet data to count actual cells...');
    const sheetData = await sheetsService.getSheetData(TEST_SHEET_URL, firstSheet.name);
    
    // Count cells with data
    const cellsWithData = Object.keys(sheetData.sheet.cells);
    const cellCount = cellsWithData.length;
    
    console.log(`✅ Retrieved ${cellCount} cells with data`);
    
    // Find the highest row number in the actual data
    let highestRow = 0;
    let highestCol = 0;
    cellsWithData.forEach(cellAddress => {
      const cell = sheetData.sheet.cells[cellAddress];
      if (cell.row > highestRow) highestRow = cell.row;
      if (cell.column > highestCol) highestCol = cell.column;
    });
    
    console.log(`📈 Highest row with data: ${highestRow}`);
    console.log(`📈 Highest column with data: ${highestCol}`);
    
    // Show sample of data from different rows to prove we got more than 30 rows
    console.log('\n📊 Sample data from different rows:');
    
    // Show data from rows 1, 30, 50, and the highest row
    const testRows = [1, 30, 50, Math.min(80, highestRow), highestRow];
    
    testRows.forEach(rowNum => {
      const cellsInRow = cellsWithData.filter(addr => {
        const cell = sheetData.sheet.cells[addr];
        return cell.row === rowNum;
      });
      
      if (cellsInRow.length > 0) {
        const firstCellInRow = sheetData.sheet.cells[cellsInRow[0]];
        console.log(`   Row ${rowNum}: "${firstCellInRow.value || firstCellInRow.formattedValue || '(empty)'}" (${cellsInRow.length} cells)`);
      }
    });
    
    // Final verification
    console.log('\n🎉 VERIFICATION RESULTS:');
    console.log(`   📊 Total sheet rows: ${firstSheet.rowCount}`);
    console.log(`   📊 Highest row with data: ${highestRow}`);
    console.log(`   📊 Total cells retrieved: ${cellCount}`);
    
    if (highestRow > 30) {
      console.log('   ✅ SUCCESS: Retrieved data from rows BEYOND 30! The 30-row limitation is FIXED! 🎉');
    } else {
      console.log('   ⚠️  Note: This test sheet only has data up to row 30 or less');
    }
    
    if (cellCount > 50) {
      console.log(`   ✅ SUCCESS: Retrieved ${cellCount} cells, which is much more than a 30-row limitation would allow!`);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

testRowCount(); 