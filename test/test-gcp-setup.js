#!/usr/bin/env node

import { google } from 'googleapis';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * Test script to check Google Cloud project setup
 * This helps verify if the necessary APIs are enabled and service account is properly configured
 */

async function testGCPSetup(credentialsFilePath) {
  try {
    console.log('🔍 Google Cloud Project Setup Check');
    console.log('===================================\n');
    
    // Load credentials
    console.log('📁 Loading credentials...');
    const resolvedPath = resolve(credentialsFilePath);
    const credentialsData = await readFile(resolvedPath, 'utf8');
    const credentials = JSON.parse(credentialsData);
    
    const serviceAccountEmail = credentials.client_email;
    const projectId = credentials.project_id;
    
    console.log('📧 Service Account: [REDACTED]');
    console.log(`🏗️  Project ID: ${projectId}`);
    console.log('');
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    });
    
    const authClient = await auth.getClient();
    
    console.log('🔐 Testing authentication...');
    
    // Test 1: Check if we can get project info
    console.log('📊 Checking project access...');
    try {
      const cloudresourcemanager = google.cloudresourcemanager('v1');
      const project = await cloudresourcemanager.projects.get({
        auth: authClient,
        projectId: projectId
      });
      console.log(`✅ Project access successful: ${project.data.name}`);
    } catch (error) {
      console.log(`❌ Project access failed: ${error.message}`);
      console.log('   This might indicate the service account lacks basic project access');
    }
    
    console.log('');
    
    // Test 2: Check if Google Sheets API is enabled
    console.log('📋 Checking Google Sheets API...');
    try {
      const serviceusage = google.serviceusage('v1');
      const sheetsApi = await serviceusage.services.get({
        auth: authClient,
        name: `projects/${projectId}/services/sheets.googleapis.com`
      });
      
      if (sheetsApi.data.state === 'ENABLED') {
        console.log('✅ Google Sheets API is enabled');
      } else {
        console.log(`❌ Google Sheets API is not enabled (state: ${sheetsApi.data.state})`);
        console.log('   You need to enable Google Sheets API in your Google Cloud Console');
      }
    } catch (error) {
      if (error.code === 404) {
        console.log('❌ Google Sheets API is not enabled');
        console.log('   You need to enable Google Sheets API in your Google Cloud Console');
      } else {
        console.log(`❌ Error checking Google Sheets API: ${error.message}`);
      }
    }
    
    console.log('');
    
    // Test 3: Check if Google Drive API is enabled
    console.log('📁 Checking Google Drive API...');
    try {
      const serviceusage = google.serviceusage('v1');
      const driveApi = await serviceusage.services.get({
        auth: authClient,
        name: `projects/${projectId}/services/drive.googleapis.com`
      });
      
      if (driveApi.data.state === 'ENABLED') {
        console.log('✅ Google Drive API is enabled');
      } else {
        console.log(`❌ Google Drive API is not enabled (state: ${driveApi.data.state})`);
        console.log('   You need to enable Google Drive API in your Google Cloud Console');
      }
    } catch (error) {
      if (error.code === 404) {
        console.log('❌ Google Drive API is not enabled');
        console.log('   You need to enable Google Drive API in your Google Cloud Console');
      } else {
        console.log(`❌ Error checking Google Drive API: ${error.message}`);
      }
    }
    
    console.log('');
    
    // Test 4: Check service account permissions
    console.log('🔑 Checking service account permissions...');
    try {
      const iam = google.iam('v1');
      const serviceAccount = await iam.projects.serviceAccounts.get({
        auth: authClient,
        name: `projects/${projectId}/serviceAccounts/${serviceAccountEmail}`
      });
      console.log(`✅ Service account exists: ${serviceAccount.data.displayName}`);
      
      // Check if service account is disabled
      if (serviceAccount.data.disabled) {
        console.log('❌ Service account is disabled');
      } else {
        console.log('✅ Service account is enabled');
      }
    } catch (error) {
      console.log(`❌ Error checking service account: ${error.message}`);
    }
    
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Select your project: ' + projectId);
    console.log('3. Go to "APIs & Services" > "Library"');
    console.log('4. Search for and enable "Google Sheets API"');
    console.log('5. Search for and enable "Google Drive API"');
    console.log('6. Go to "APIs & Services" > "Credentials"');
    console.log('7. Check that your service account has the necessary roles');
    console.log('8. Make sure the service account is not disabled');
    
  } catch (error) {
    console.error('❌ Setup check failed:', error.message);
    console.log('');
    console.log('🔍 Common issues:');
    console.log('1. Service account lacks project access');
    console.log('2. Required APIs are not enabled');
    console.log('3. Service account is disabled');
    console.log('4. Incorrect project ID or service account email');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node test-gcp-setup.js <path-to-credentials.json>');
    console.log('');
    console.log('Example:');
    console.log('  node test-gcp-setup.js ./credentials.json');
    console.log('  node test-gcp-setup.js /path/to/service-account-key.json');
    process.exit(1);
  }
  
  const credentialsPath = args[0];
  await testGCPSetup(credentialsPath);
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 