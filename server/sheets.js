import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Logger } from './logger.js';

export class GoogleSheetsService {
  constructor(config) {
    this.config = config;
    this.logger = new Logger();
    this.auth = null;
  }

  async initialize() {
    try {
      // Define required scopes for Google Sheets and Drive access
      const SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ];

      // Create JWT authentication with proper scopes
      this.auth = new JWT({
        email: this.config.serviceAccountEmail,
        key: this.config.privateKey,
        scopes: SCOPES,
      });

      this.logger.info('Google authentication configured with JWT and scopes');
    } catch (error) {
      this.logger.error('Failed to configure Google authentication:', error);
      throw new Error(
        'Authentication configuration failed. Please check your service account credentials.'
      );
    }
  }

  /**
   * Extract Google Sheets ID from a Google Sheets URL
   * @param {string} url - Google Sheets URL
   * @returns {string} - The extracted sheet ID
   */
  extractSheetIdFromUrl(url) {
    try {
      // Handle various Google Sheets URL formats
      const patterns = [
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/, // Standard format
        /\/d\/([a-zA-Z0-9-_]+)/, // Shortened format
        /id=([a-zA-Z0-9-_]+)/, // Query parameter format
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      throw new Error(
        'Could not extract sheet ID from URL. Please provide a valid Google Sheets URL.'
      );
    } catch (error) {
      this.logger.error('Error extracting sheet ID from URL:', error);
      throw new Error(
        'Invalid Google Sheets URL format. Please provide a valid Google Sheets URL.'
      );
    }
  }

  /**
   * Get spreadsheet summary (metadata only) by URL
   * @param {string} url - Google Sheets URL
   * @returns {Object} - Spreadsheet summary with metadata only
   */
  async getSpreadsheetSummary(url) {
    try {
      if (!this.auth) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      this.logger.info('Retrieving spreadsheet summary...');

      // Extract sheet ID from URL
      const sheetId = this.extractSheetIdFromUrl(url);
      this.logger.info('Extracted sheet ID from URL');

      // Create Google Spreadsheet instance
      const doc = new GoogleSpreadsheet(sheetId, this.auth);

      // Load document properties only (no cell data)
      await doc.loadInfo();

      this.logger.info(`Spreadsheet loaded with ${doc.sheetCount} sheets`);

      // Get sheet names without loading cell data
      const sheetNames = [];
      for (let i = 0; i < doc.sheetCount; i++) {
        const sheet = doc.sheetsByIndex[i];
        sheetNames.push({
          name: sheet.title,
          index: sheet.index,
          rowCount: sheet.rowCount,
          columnCount: sheet.columnCount,
        });
      }

      const result = {
        id: sheetId,
        title: doc.title,
        url: doc.spreadsheetUrl,
        sheetCount: doc.sheetCount,
        sheetNames: sheetNames,
        metadata: {
          createdTime: doc.createdTime,
          modifiedTime: doc.modifiedTime,
          lastModifyingUser: doc.lastModifyingUser,
        },
      };

      this.logger.info('Successfully retrieved spreadsheet summary');
      return result;
    } catch (error) {
      this.logger.error('Error retrieving spreadsheet summary:', error);
      throw new Error(
        'Failed to retrieve spreadsheet summary. Please check the URL and your permissions.'
      );
    }
  }

  /**
   * Get data for a specific sheet by URL and sheet name
   * @param {string} url - Google Sheets URL
   * @param {string} sheetName - Name of the specific sheet to retrieve
   * @returns {Object} - Sheet data for the specified sheet
   */
  async getSheetData(url, sheetName) {
    try {
      if (!this.auth) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      this.logger.info('Retrieving specific sheet data...');

      // Extract sheet ID from URL
      const sheetId = this.extractSheetIdFromUrl(url);
      this.logger.info('Extracted sheet ID from URL');

      // Create Google Spreadsheet instance
      const doc = new GoogleSpreadsheet(sheetId, this.auth);

      // Load document properties
      await doc.loadInfo();

      this.logger.info(`Spreadsheet loaded with ${doc.sheetCount} sheets`);

      // Find the specific sheet by name
      const sheet = doc.sheetsByTitle[sheetName];
      if (!sheet) {
        throw new Error('Specified sheet not found. Please check the sheet name and try again.');
      }

      // Load cell data for the specific sheet
      await sheet.loadCells();

      // Extract cell data in new 2D array format
      const extractedData = this.extractCellData(sheet);

      const result = {
        spreadsheetId: sheetId,
        spreadsheetTitle: doc.title,
        spreadsheetUrl: doc.spreadsheetUrl,
        metadata: {
          title: extractedData.metadata.title,
          dimensions: extractedData.metadata.dimensions,
          createdTime: doc.createdTime,
          modifiedTime: doc.modifiedTime,
          lastModifyingUser: doc.lastModifyingUser,
          sheetIndex: sheet.index,
          gridProperties: sheet.gridProperties,
        },
        cells: extractedData.cells,
      };

      this.logger.info('Successfully retrieved specific sheet data');
      return result;
    } catch (error) {
      this.logger.error('Error retrieving sheet data:', error);
      throw new Error(
        'Failed to retrieve sheet data. Please check the sheet name and your permissions.'
      );
    }
  }

  extractCellData(sheet) {
    const cells = [];
    const maxRow = sheet.rowCount;
    const maxCol = sheet.columnCount;

    for (let row = 0; row < maxRow; row++) {
      for (let col = 0; col < maxCol; col++) {
        const cell = sheet.getCell(row, col);

        // Only include cells that have some content
        if (cell.value !== null && cell.value !== undefined && cell.value !== '' && 
            cell.formattedValue !== null && cell.formattedValue !== undefined && cell.formattedValue !== '') {
          
          const cellData = {
            pos: [row + 1, col + 1], // Convert to 1-based indexing [row, column]
            val: cell.value, // Raw value
            type: this.detectCellType(cell)
          };

          // Add formatted value if different from raw value
          if (cell.formattedValue && cell.formattedValue !== cell.value) {
            cellData.fmt = cell.formattedValue;
          }

          // Add hyperlink if present
          try {
            if (cell.hyperlink) {
              cellData.hyperlink = cell.hyperlink;
            }
          } catch {
            /* ignore */
          }

          cells.push(cellData);
        }
      }
    }

    return {
      metadata: {
        title: sheet.title,
        dimensions: {
          rows: maxRow,
          columns: maxCol
        }
      },
      cells: cells
    };
  }

  /**
   * Detect the type of a cell based on its value and formatting
   * @param {Object} cell - Google Sheets cell object
   * @returns {string} - Detected type: string, number, currency, percentage, date, boolean
   */
  detectCellType(cell) {
    // Check if it's a boolean
    if (typeof cell.value === 'boolean') {
      return 'boolean';
    }

    // Check if it's a number
    if (typeof cell.value === 'number') {
      const formatted = cell.formattedValue || '';
      
      // Check for percentage
      if (formatted.includes('%')) {
        return 'percentage';
      }
      
      // Check for currency symbols
      if (formatted.match(/[$£€¥₹₽₩]/)) {
        return 'currency';
      }
      
      // Check for date patterns (basic detection)
      if (formatted.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}/)) {
        return 'date';
      }
      
      return 'number';
    }

    // Check if string looks like a date
    if (typeof cell.value === 'string') {
      const datePattern = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|\d{4}-\d{2}-\d{2}/;
      if (datePattern.test(cell.value)) {
        return 'date';
      }
    }

    // Default to string for text and other types
    return 'string';
  }

  /**
   * Convert column number to Excel-style letter (1 = A, 26 = Z, 27 = AA, etc.)
   * @param {number} colNum - Column number (1-based)
   * @returns {string} - Excel-style column letter
   */
  columnToLetter(colNum) {
    let result = '';
    while (colNum > 0) {
      colNum--;
      result = String.fromCharCode(65 + (colNum % 26)) + result;
      colNum = Math.floor(colNum / 26);
    }
    return result;
  }
}
