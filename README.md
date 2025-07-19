# Claude Desktop Extension: Google Sheets MCP Server

A Claude Desktop Extension (DXT) that provides seamless access to Google Sheets through the Model Context Protocol (MCP). This extension allows Claude to efficiently navigate and analyze Google Sheets data using a two-tool approach designed for handling large spreadsheets with secure service account authentication.

## Features

- **Get Spreadsheet Summary**: Retrieve metadata about a Google Sheet including name, sheet count, and sheet names - perfect for navigation and understanding structure
- **Get Specific Sheet Data**: Retrieve complete data from a specific worksheet within a spreadsheet - optimized for targeted analysis
- **Structured Data Access**: Returns spreadsheet data as JSON including all worksheets, cell values, formatting, and metadata
- **Automatic URL Parsing**: Extracts sheet IDs from various Google Sheets URL formats
- **Secure Authentication**: Service account-based authentication with Google APIs
- **Real-time Access**: Direct integration with Google Sheets API
- **Desktop Extension**: Single-click installation in Claude Desktop
- **AI-Friendly Format**: Data returned in structured JSON format Claude can analyze, process, and work with directly
- **Large Spreadsheet Optimization**: Two-tool approach allows efficient handling of spreadsheets with many sheets by getting overview first

## Prerequisites

- Node.js 18+ installed
- Google Cloud Project with Google Sheets API enabled
- Google Service Account credentials configured
- Claude Desktop application

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcp-googlesheet
   cd mcp-googlesheet
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Google Service Account**:
   - Create a Google Cloud Project
   - Enable Google Sheets API and Google Drive API
   - Create a Service Account
   - Download the service account JSON file
   - Configure extension settings (see Configuration section)

4. **Install the extension in Claude Desktop**:
   - Build the extension: `npm run pack` (uses `dxt pack` under the hood)
   - Open Claude Desktop
   - Go to Settings → Extensions
   - Click "Install Extension"
   - Select the generated `mcp-googlesheet.dxt` file

## Configuration

### Extension Settings

The extension requires a Google Service Account JSON credentials file. In Claude Desktop extension settings, configure:

- **Credentials JSON File Path**: Path to your Google Service Account JSON file (e.g., `/path/to/service-account-key.json`)

This file must contain all necessary authentication information including `client_email`, `private_key`, and `project_id`.

### Testing Your Credentials

Before using the extension, you can test your credentials JSON file:

```bash
# Test your credentials file
npm run test:credentials /path/to/your/service-account-key.json

# Or directly with node
node test/test-credentials.js /path/to/your/service-account-key.json
```

This will verify that:
- The file can be read and parsed
- All required fields are present
- The private key format is correct (includes BEGIN/END markers)
- The credentials are valid

### Credentials JSON File Format

Your Google Service Account JSON file should look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service%40your-project.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

The extension will automatically extract the required fields (`client_email`, `private_key`, and `project_id`) from this file.

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API and Google Drive API
4. Create a Service Account:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Download the JSON key file
5. Share your Google Sheets with the service account email

For detailed setup instructions, see [SETUP.md](SETUP.md).

## Usage

### Available Tools

The extension provides two complementary tools designed for efficient navigation of large spreadsheets:

1. **`get_spreadsheet_summary`**: Get an overview of a Google Sheet
   - Parameters: url (Complete Google Sheets URL)
   - Returns: Spreadsheet metadata including title, sheet count, sheet names, creation/modification dates
   - Use case: Understanding spreadsheet structure and choosing which sheet to analyze

2. **`get_spreadsheet_sheet_data`**: Get complete data from a specific sheet
   - Parameters: url (Complete Google Sheets URL), sheet_name (Name of the specific sheet)
   - Returns: Complete cell data, formatting, and metadata for the specified sheet
   - Use case: Detailed analysis of specific worksheet data

### Example Usage in Claude Desktop

```
User: "Get an overview of this spreadsheet: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
Claude: [Uses get_spreadsheet_summary tool to show spreadsheet overview with sheet names]

User: "Now get the data from the 'Class Data' sheet"
Claude: [Uses get_spreadsheet_sheet_data tool with sheet_name="Class Data" to retrieve complete sheet data]

User: "Analyze the Q4 budget data from this URL: https://docs.google.com/spreadsheets/d/abc123/edit#gid=0"
Claude: [First uses get_spreadsheet_summary to see available sheets, then get_spreadsheet_sheet_data for the relevant sheet]
```

### Workflow for Large Spreadsheets

The two-tool approach is optimized for large spreadsheets:

1. **Start with Summary**: Use `get_spreadsheet_summary` to see what sheets are available
2. **Choose Target Sheet**: Based on the summary, identify which sheet contains the data you need
3. **Get Specific Data**: Use `get_spreadsheet_sheet_data` to retrieve complete data from the target sheet

This approach avoids downloading massive amounts of data when you only need specific worksheets.

### Supported URL Formats

The extension can extract sheet IDs from various Google Sheets URL formats:

- Standard format: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
- With view parameters: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0`
- With additional parameters: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit?usp=sharing`

## Development

### Project Structure

```
mcp-googlesheet/
├── manifest.json          # Extension manifest with tool definitions
├── package.json           # Node.js dependencies and scripts
├── server/
│   ├── index.js          # MCP server entry point with tool implementations
│   ├── sheets.js         # Google Sheets API integration
│   └── logger.js         # Logging utilities
├── test/                 # Test files for various functionality
├── README.md             # This file
├── SETUP.md              # Detailed Google Cloud setup guide
├── ARCHITECTURE.md       # Technical architecture details
└── TASK_LIST.md          # Development progress tracking
```

### Running in Development

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the extension**:
   ```bash
   npm test
   ```

3. **Test credentials**:
   ```bash
   npm run test:credentials /path/to/your/service-account-key.json
   ```

4. **Build the extension**:
   ```bash
   npm run pack
   ```

5. **Install in Claude Desktop**:
   - Open the generated `mcp-googlesheet.dxt` file with Claude Desktop

## Security

- Service account authentication ensures secure access to user data
- No data is stored locally beyond temporary session tokens
- All API calls use HTTPS
- Service account only has read-only access to spreadsheets
- Only the JSON file path is stored in extension settings; credentials remain in your local file system

### Debugging Environment Variables

To debug environment variable issues, run the environment test script:

```bash
# Test environment variables
npm run test:env

# Test credentials file specifically
npm run test:credentials /path/to/your/service-account-key.json

# Test Google API authentication
npm run test:auth /path/to/your/service-account-key.json

# Test private key formatting
npm run test:private-key /path/to/your/service-account-key.json

# Test Google Cloud project setup
npm run test:gcp /path/to/your/service-account-key.json
```

This will help identify:
- Whether environment variables are set correctly
- If placeholders are being resolved properly
- File access permissions
- JSON file validity
- Google API authentication status
- Google Cloud project configuration

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section
- Review the architecture documentation
- Open an issue on GitHub

## Changelog

### v1.0.0
- Initial release with structured JSON data access
- Two-tool approach for efficient large spreadsheet handling
- Support for retrieving spreadsheet summaries and specific sheet data
- Automatic URL parsing for sheet ID extraction
- Service account authentication
- MCP server implementation with comprehensive error handling 