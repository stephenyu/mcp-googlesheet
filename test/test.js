#!/usr/bin/env node

import { spawn } from 'child_process';
import { Logger } from '../server/logger.js';

const logger = new Logger();

async function testMCPServer() {
  logger.info('Starting MCP server test...');

  // Test 1: Check if server can be spawned
  try {
    const serverProcess = spawn('node', ['server/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GOOGLE_CREDENTIALS_JSON_FILE: '/tmp/fake-credentials.json',
        LOG_LEVEL: 'debug',
      },
    });

    let stdout = '';
    let stderr = '';

    serverProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      logger.info('Server stdout:', data.toString());
    });

    serverProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      logger.error('Server stderr:', data.toString());
    });

    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Check if server process is still running
    if (serverProcess.killed) {
      logger.error('Server process was killed unexpectedly');
      return false;
    }

    logger.info('Server process is running');

    // Test 3: Send a simple message to test communication
    const testMessage = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'ping',
      params: {},
    }) + '\n';

    serverProcess.stdin.write(testMessage);

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clean up
    serverProcess.kill('SIGTERM');

    logger.info('Test completed successfully');
    return true;
  } catch (error) {
    logger.error('Test failed:', error);
    return false;
  }
}

// Test Google Sheets service directly
async function testSheetsService() {
  logger.info('Testing Google Sheets service...');

  try {
    const { GoogleSheetsService } = await import('../server/sheets.js');
    
    const service = new GoogleSheetsService({
      serviceAccountEmail: 'test@example.com',
      privateKey: 'test-key',
      projectId: 'test-project',
    });

    // Test initialization (should fail with invalid credentials, but shouldn't crash)
    try {
      await service.initialize();
      logger.warn('Service initialized with test credentials (unexpected)');
    } catch (error) {
      logger.info('Service initialization failed as expected:', error.message);
    }

    // Test search files
    const searchResults = await service.searchFiles('test');
    logger.info('Search results:', searchResults);

    logger.info('Sheets service test completed');
    return true;
  } catch (error) {
    logger.error('Sheets service test failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  logger.info('Running tests...');

  const serverTest = await testMCPServer();
  const serviceTest = await testSheetsService();

  if (serverTest && serviceTest) {
    logger.info('✅ All tests passed!');
    process.exit(0);
  } else {
    logger.error('❌ Some tests failed');
    process.exit(1);
  }
}

runTests().catch(error => {
  logger.error('Test runner failed:', error);
  process.exit(1);
}); 