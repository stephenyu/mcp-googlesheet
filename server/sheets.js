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
      throw new Error('Authentication configuration failed. Please check your service account credentials.');
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

      throw new Error('Could not extract sheet ID from URL. Please provide a valid Google Sheets URL.');
    } catch (error) {
      this.logger.error('Error extracting sheet ID from URL:', error);
      throw new Error('Invalid Google Sheets URL format. Please provide a valid Google Sheets URL.');
    }
  }

  /**
   * Get spreadsheet as XLSX file by Google Sheets ID
   * @param {string} sheetId - Google Sheets file ID
   * @returns {Buffer} - XLSX file buffer
   */
  async getSpreadsheetById(sheetId) {
    try {
      if (!this.auth) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      this.logger.info('Retrieving spreadsheet by ID...');

      // Create Google Spreadsheet instance
      const doc = new GoogleSpreadsheet(sheetId, this.auth);
      
      // Load document properties
      await doc.loadInfo();
      
      this.logger.info(`Spreadsheet loaded with ${doc.sheetCount} sheets`);

      // Download as XLSX
      const xlsxBuffer = await doc.downloadAsXLSX();
      
      this.logger.info('Successfully downloaded XLSX file');
      return xlsxBuffer;
    } catch (error) {
      this.logger.error('Error retrieving spreadsheet by ID:', error);
      throw new Error('Failed to retrieve spreadsheet. Please check your permissions and try again.');
    }
  }

  /**
   * Get spreadsheet as XLSX file by Google Sheets URL
   * @param {string} url - Google Sheets URL
   * @returns {Buffer} - XLSX file buffer
   */
  async getSpreadsheetByUrl(url) {
    try {
      if (!this.auth) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      this.logger.info('Retrieving spreadsheet from URL...');

      // Extract sheet ID from URL
      const sheetId = this.extractSheetIdFromUrl(url);
      this.logger.info('Extracted sheet ID from URL');

      // Use the existing method to get the spreadsheet
      return await this.getSpreadsheetById(sheetId);
    } catch (error) {
      this.logger.error('Error retrieving spreadsheet by URL:', error);
      throw new Error('Failed to retrieve spreadsheet from URL. Please check the URL and your permissions.');
    }
  }

  async searchFiles(query, maxResults = 10) {
    try {
      if (!this.auth) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      this.logger.info('Searching for files...');

      // For now, we'll return a simple response since we need to implement
      // Google Drive API search. The google-spreadsheet library doesn't include
      // Drive API search functionality directly.
      // TODO: Implement proper Drive API search
      
      this.logger.warn('File search not yet implemented. Please provide file IDs directly.');
      
      return [{
        id: 'example-sheet-id',
        title: 'Example Sheet',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        owners: [this.config.serviceAccountEmail],
        webViewLink: 'https://docs.google.com/spreadsheets/d/example-sheet-id',
        type: 'spreadsheet',
        note: 'This is a placeholder. File search requires Google Drive API implementation.'
      }];
    } catch (error) {
      this.logger.error('Error searching files:', error);
      throw new Error('Failed to search files. Please check your permissions and try again.');
    }
  }

  async getSheet(fileId) {
    try {
      if (!this.auth) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      this.logger.info('Retrieving sheet data...');

      // Create Google Spreadsheet instance
      const doc = new GoogleSpreadsheet(fileId, this.auth);
      
      // Load document properties
      await doc.loadInfo();
      
      this.logger.info(`Spreadsheet loaded with ${doc.sheetCount} sheets`);

      // Load all sheets
      const sheets = [];
      for (let i = 0; i < doc.sheetCount; i++) {
        const sheet = doc.sheetsByIndex[i];
        await sheet.loadCells();
        
        const sheetData = {
          title: sheet.title,
          index: sheet.index,
          rowCount: sheet.rowCount,
          columnCount: sheet.columnCount,
          gridProperties: sheet.gridProperties,
          cells: this.extractCellData(sheet),
        };
        
        sheets.push(sheetData);
      }

      const result = {
        id: fileId,
        title: doc.title,
        url: doc.spreadsheetUrl,
        sheetCount: doc.sheetCount,
        sheets: sheets,
        metadata: {
          createdTime: doc.createdTime,
          modifiedTime: doc.modifiedTime,
          lastModifyingUser: doc.lastModifyingUser,
        },
      };

      this.logger.info('Successfully retrieved sheet data');
      return result;
    } catch (error) {
      this.logger.error('Error retrieving sheet:', error);
      throw new Error('Failed to retrieve sheet data. Please check your permissions and try again.');
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
      throw new Error('Failed to retrieve spreadsheet summary. Please check the URL and your permissions.');
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
        throw new Error(`Specified sheet not found. Please check the sheet name and try again.`);
      }

      // Load cell data for the specific sheet
      await sheet.loadCells();
      
      const sheetData = {
        title: sheet.title,
        index: sheet.index,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount,
        gridProperties: sheet.gridProperties,
        cells: this.extractCellData(sheet),
      };

      const result = {
        spreadsheetId: sheetId,
        spreadsheetTitle: doc.title,
        spreadsheetUrl: doc.spreadsheetUrl,
        sheet: sheetData,
        metadata: {
          createdTime: doc.createdTime,
          modifiedTime: doc.modifiedTime,
          lastModifyingUser: doc.lastModifyingUser,
        },
      };

      this.logger.info('Successfully retrieved specific sheet data');
      return result;
    } catch (error) {
      this.logger.error('Error retrieving sheet data:', error);
      throw new Error('Failed to retrieve sheet data. Please check the sheet name and your permissions.');
    }
  }

  extractCellData(sheet) {
    const cells = {};

    // Iterate through all cells in the sheet
    // sheet.cellStats contains the range of cells with data
    const maxRow = sheet.rowCount;
    const maxCol = sheet.columnCount;

    for (let row = 0; row < maxRow; row++) {
      for (let col = 0; col < maxCol; col++) {
        const cell = sheet.getCell(row, col);
        
        // Only include cells that have some content or formatting
        if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
          const cellAddress = `${this.columnToLetter(col + 1)}${row + 1}`;
          
          const cellData = {
            row: row + 1, // Convert to 1-based indexing
            column: col + 1, // Convert to 1-based indexing
            address: cellAddress,
            value: cell.value,
            formattedValue: cell.formattedValue,
          };

          // Add optional properties if they exist, using safe property access
          try {
            if (cell.note) cellData.note = cell.note;
          } catch (e) { /* ignore */ }
          
          try {
            const bgColor = cell.backgroundColor;
            if (bgColor) cellData.backgroundColor = bgColor;
          } catch (e) { /* ignore */ }
          
          try {
            const textFormat = cell.textFormat;
            if (textFormat) cellData.textFormat = textFormat;
          } catch (e) { /* ignore */ }
          
          try {
            if (cell.horizontalAlignment) cellData.horizontalAlignment = cell.horizontalAlignment;
          } catch (e) { /* ignore */ }
          
          try {
            if (cell.verticalAlignment) cellData.verticalAlignment = cell.verticalAlignment;
          } catch (e) { /* ignore */ }
          
          try {
            if (cell.textDirection) cellData.textDirection = cell.textDirection;
          } catch (e) { /* ignore */ }
          
          try {
            if (cell.hyperlink) cellData.hyperlink = cell.hyperlink;
          } catch (e) { /* ignore */ }
          
          try {
            const numberFormat = cell.numberFormat;
            if (numberFormat) cellData.numberFormat = numberFormat;
          } catch (e) { /* ignore */ }

          cells[cellAddress] = cellData;
        }
      }
    }

    return cells;
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

  async testConnection() {
    try {
      if (!this.auth) {
        throw new Error('Service not initialized');
      }

      // Try to list a few files to test the connection
      const files = await this.searchFiles('test', 1);
      return {
        success: true,
        message: 'Connection successful',
        filesFound: files.length,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
} 