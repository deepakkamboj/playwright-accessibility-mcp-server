/**
 * MCP Server Starter Template
 *
 * This is a reference implementation of a Model Context Protocol (MCP) server.
 * It demonstrates best practices for:
 * - Server initialization and configuration
 * - Tool registration and management
 * - Error handling and logging
 * - Resource cleanup
 *
 * For more information about MCP, visit:
 * https://modelcontextprotocol.io
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import fs from 'node:fs';
import path from 'node:path';
import { logMessage } from './utils/logger.js';
import { registerScanBatchTool, registerScanHtmlTool, registerScanUrlTool, registerSummariseViolationsTool, registerWriteViolationsTool } from "./tools/tools.js";


/**
 * Create a new MCP server instance with full capabilities
 */
const server = new McpServer({
  name: "playwright-tms-auth-mcp",
  version: "0.1.0",
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
    streaming: true
  }
});

const logFilePath = path.resolve(process.cwd(), 'server.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

/**
 * Set up error handling for the server
 */
process.on('uncaughtException', (error: Error) => {
  logMessage('error', `Uncaught error: ${error.message}`);
  console.error('Server error:', error);
});

// Register example tools
try {
  registerScanUrlTool(server);
  registerScanHtmlTool(server);
  registerScanBatchTool(server);
  registerSummariseViolationsTool(server);
  registerWriteViolationsTool(server);

  logMessage('info', 'Successfully registered all tools');
} catch (error) {
  logMessage('error', `Failed to register tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
}

/**
 * Set up proper cleanup on process termination
 */
async function cleanup() {
  try {
    await server.close();
    logMessage('info', 'Server shutdown completed');
  } catch (error) {
    logMessage('error', `Error during shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    process.exit(0);
  }
}

// Handle termination signals
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

/**
 * Main server startup function
 */
async function main() {
  try {
    // Set up communication with the MCP host using stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logMessage('info', 'MCP Server started successfully');
    console.error('MCP Server running on stdio transport');
  } catch (error) {
    logMessage('error', `Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

process.on('exit', () => {
  logStream.end();
});