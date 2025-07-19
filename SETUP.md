# Google Sheets MCP Extension Setup Guide

This guide will help you set up the Google Sheets MCP Extension for Claude Desktop using Google Service Account authentication.

## Prerequisites

- Node.js 18+ installed
- Google Cloud Project with billing enabled
- Claude Desktop application

## Step 1: Google Cloud Project Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "claude-sheets-extension")
4. Click "Create"

### 1.2 Enable Required APIs

1. In your project, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Google Sheets API**

### 1.3 Create a Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in the details:
   - **Service account name**: `claude-sheets-mcp`
   - **Service account ID**: `claude-sheets-mcp@your-project-id.iam.gserviceaccount.com`
   - **Description**: `Service account for Claude Sheets MCP extension`
4. Click "Create and Continue"

### 1.4 Grant Permissions

1. For "Grant this service account access to project":
   - Select "Editor" role
   - Click "Continue"
2. Click "Done"

### 1.5 Create and Download Service Account Key

1. Click on your service account name
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" format
5. Click "Create"
6. The JSON file will download automatically

## Step 2: Configure the Extension

### 2.1 Extract Service Account Information

Open the downloaded JSON file and note these values:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "claude-sheets-mcp@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 2.2 Install the Extension in Claude Desktop

1. **Build the extension**:
   ```bash
   npm run pack
   ```

2. **Install in Claude Desktop**:
   - Open Claude Desktop
   - Go to Settings → Extensions
   - Click "Install Extension"
   - Select the generated `.dxt` file

### 2.3 Configure Extension Settings

1. **Save the JSON file** to a secure location on your computer (e.g., `~/google-credentials/service-account-key.json`)

2. **Test your credentials file** (optional but recommended):
   ```bash
   npm run test:credentials /path/to/your/service-account-key.json
   ```

3. **In Claude Desktop extension settings, enter**:
   - **Credentials JSON File Path**: `/path/to/your/service-account-key.json` (use the full path to your JSON file)
   - **Maximum Search Results**: `10` (or your preferred number)

**Note**: The extension automatically extracts all required fields from the JSON file, making it easy to manage and less error-prone than manual configuration.

## Step 3: Share Google Sheets

### 3.1 Share Sheets with Service Account

For the extension to access your Google Sheets, you need to share them with the service account email:

1. Open any Google Sheet you want to access
2. Click "Share" button
3. Add the service account email: `claude-sheets-mcp@your-project-id.iam.gserviceaccount.com`
4. Grant "Viewer" permissions
5. Click "Send"

### 3.2 Alternative: Share Entire Drive Folder

You can also share an entire folder containing your sheets:

1. In Google Drive, right-click a folder
2. Click "Share"
3. Add the service account email
4. Grant "Viewer" permissions

## Step 4: Test the Extension

### 4.1 Test Your Credentials

Before using the extension, test your credentials file:

```bash
# Test your credentials file
npm run test:credentials /path/to/your/service-account-key.json
```

This will verify that:
- The file can be read and parsed
- All required fields are present
- The private key format is correct (includes BEGIN/END markers)
- The credentials are valid

### 4.2 Test in Claude Desktop

1. Open Claude Desktop
2. Try these commands:
   ```
   Search for Google Sheets containing "budget"
   ```
   
   ```
   Get the Google Sheet with ID "your-sheet-id-here"
   ```

### 4.3 Troubleshooting

If you encounter issues:

1. **Check credentials**: Verify the service account email and private key are correct
2. **Check permissions**: Ensure the service account has access to your sheets
3. **Check APIs**: Verify Google Sheets and Drive APIs are enabled
4. **Check logs**: Enable debug logging by setting `LOG_LEVEL=debug` in extension settings

## Security Considerations

- **Service Account Key**: Keep your service account JSON file secure and never commit it to version control
- **Permissions**: The service account only needs read access to your sheets
- **Scope**: The extension only requests read-only permissions for spreadsheets and drive
- **Local Processing**: All data processing happens locally on your machine

## File ID Format

Google Sheets file IDs can be found in the URL:
```
https://docs.google.com/spreadsheets/d/FILE_ID_HERE/edit
```

The FILE_ID_HERE part is what you need for the `get_googlesheet` tool.

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the extension logs in Claude Desktop
3. Open an issue on the GitHub repository
4. Ensure your Google Cloud Project has billing enabled (required for API usage)

## Next Steps

Once configured, you can:

- Search for spreadsheets by name or content
- Retrieve complete spreadsheet data
- Analyze sheet contents with Claude
- Export data in various formats

The extension provides a secure, reliable way to access your Google Sheets data directly within Claude Desktop. 