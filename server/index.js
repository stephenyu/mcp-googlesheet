#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GoogleSheetsService } from './sheets.js';
import { Logger } from './logger.js';
import { z } from 'zod';

// Initialize logger
const logger = new Logger();

// Initialize Google Sheets service
let sheetsService = null;

// Create MCP server
const server = new McpServer({
  name: 'google-sheets-mcp',
  version: '1.0.0',
});

// Initialize Google Sheets service with JSON credentials file
async function initializeSheetsService() {
  try {
    logger.info('Initializing Google Sheets service...');
    const credentialsJsonFile = process.env.GOOGLE_CREDENTIALS_JSON_FILE;

    if (!credentialsJsonFile) {
      throw new Error(
        'Missing GOOGLE_CREDENTIALS_JSON_FILE environment variable. Please configure the credentials JSON file path in the extension settings.'
      );
    }

    // Check if the credentials file path contains unresolved placeholders
    if (credentialsJsonFile.includes('${user_config.')) {
      throw new Error(
        'Environment variable interpolation failed. Credentials file path contains unresolved placeholders. Please check your extension configuration in Claude Desktop settings.'
      );
    }

    logger.info('Loading credentials from JSON file...');

    // Load credentials from JSON file
    const fs = await import('fs/promises');
    const path = await import('path');

    // Resolve the file path (handle relative paths)
    const resolvedPath = path.resolve(credentialsJsonFile);
    const credentialsData = await fs.readFile(resolvedPath, 'utf8');
    const credentials = JSON.parse(credentialsData);

    const serviceAccountEmail = credentials.client_email;
    const privateKey = credentials.private_key;
    const projectId = credentials.project_id;

    if (!serviceAccountEmail || !privateKey || !projectId) {
      throw new Error(
        'Invalid credentials JSON file. Missing required fields: client_email, private_key, or project_id'
      );
    }

    // Format the private key properly (handle escaped newlines from JSON)
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    logger.info('Successfully loaded credentials from JSON file');

    sheetsService = new GoogleSheetsService({
      serviceAccountEmail,
      privateKey: formattedPrivateKey,
      projectId,
    });

    await sheetsService.initialize();
    logger.info('Google Sheets service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Google Sheets service:', error);
    throw error;
  }
}

// Register get_spreadsheet_summary tool
server.registerTool(
  'get_spreadsheet_summary',
  {
    description:
      'Get a summary of a Google spreadsheet including its name, number of sheets, and the names of those sheets. Returns metadata only, no actual data.',
    inputSchema: {
      url: z
        .string()
        .describe(
          'The complete Google Sheets URL (e.g., "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit")'
        ),
    },
  },
  async ({ url }) => {
    try {
      logger.info('Retrieving Google Sheet summary...');

      if (!sheetsService) {
        logger.info('Sheets service not initialized, initializing now...');
        await initializeSheetsService();
      }

      const summaryData = await sheetsService.getSpreadsheetSummary(url);

      logger.info('Successfully retrieved spreadsheet summary');

      return {
        content: [
          {
            type: 'text',
            text:
              `**Google Sheet Summary: ${summaryData.title}**\n\n` +
              `Sheet ID: ${summaryData.id}\n` +
              `URL: ${summaryData.url}\n` +
              `Number of worksheets: ${summaryData.sheetCount}\n` +
              `Created: ${summaryData.metadata.createdTime}\n` +
              `Last modified: ${summaryData.metadata.modifiedTime}\n\n` +
              '**Available Sheets:**\n' +
              summaryData.sheetNames
                .map(
                  sheet => `- ${sheet.name} (${sheet.rowCount} rows × ${sheet.columnCount} columns)`
                )
                .join('\n'),
          },
        ],
      };
    } catch (error) {
      logger.error('Error in get_spreadsheet_summary:', error);

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register get_spreadsheet_sheet_data tool
server.registerTool(
  'get_spreadsheet_sheet_data',
  {
    description:
      'Get the actual data from a specific sheet within a Google spreadsheet. Returns complete sheet data including all cell values.',
    inputSchema: {
      url: z
        .string()
        .describe(
          'The complete Google Sheets URL (e.g., "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit")'
        ),
      sheet_name: z
        .string()
        .describe(
          'The name of the specific sheet to retrieve data from (e.g., "Sheet1", "Data", "Sales Q1")'
        ),
    },
  },
  async ({ url, sheet_name }) => {
    try {
      logger.info('Retrieving specific sheet data...');

      if (!sheetsService) {
        logger.info('Sheets service not initialized, initializing now...');
        await initializeSheetsService();
      }

      const sheetData = await sheetsService.getSheetData(url, sheet_name);

      logger.info('Successfully retrieved sheet data');

      return {
        content: [
          {
            type: 'text',
            text:
              `**Google Sheet Data: ${sheetData.spreadsheetTitle} - ${sheetData.metadata.title}**\n\n` +
              `Spreadsheet ID: ${sheetData.spreadsheetId}\n` +
              `URL: ${sheetData.spreadsheetUrl}\n` +
              `Sheet: ${sheetData.metadata.title}\n` +
              `Size: ${sheetData.metadata.dimensions.rows} rows × ${sheetData.metadata.dimensions.columns} columns\n` +
              `Created: ${sheetData.metadata.createdTime}\n` +
              `Last modified: ${sheetData.metadata.modifiedTime}\n\n` +
              `**Cell Data (${sheetData.cells.length} cells with data):**\n` +
              JSON.stringify(sheetData, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Error in get_spreadsheet_sheet_data:', error);

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Error handling
process.on('uncaughtException', error => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
async function main() {
  try {
    logger.info('Starting MCP server...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('MCP server started and connected via stdio');
  } catch (error) {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

main();
