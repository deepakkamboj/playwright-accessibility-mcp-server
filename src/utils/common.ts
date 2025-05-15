import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { chromium, firefox, webkit } from '@playwright/test';

/**
 * Get the current directory path in ES module context
 * @returns The current directory path
 */
function getCurrentDir() {
  return path.dirname(fileURLToPath(import.meta.url));
}

/**
 * Find the project root by looking for the package.json file.
 * @param startDir - The directory to start searching from.
 * @returns The project root directory.
 */
function findProjectRoot(startDir: string): string {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // Fall back to the current working directory if project root isn't found
  return process.cwd();
}

// Get project root
export const projectRoot = findProjectRoot(getCurrentDir());

// Define output directory relative to the project root
const outputDir = path.join(projectRoot, 'output');

/**
 * Check if the current run is headless.
 * @returns True if headless mode is enabled, false otherwise.
 */
export function isHeadlessRun(): boolean {
  return ProcessEnvironmentConfig().headless;
}

/**
 * Enum for supported browser types.
 */
export enum BrowserTypes {
  Chromium = 'chromium',
  Firefox = 'firefox',
  Webkit = 'webkit',
}

/**
 * Get the browser type based on the environment configuration.
 * @returns The Playwright browser type.
 */
export function getBrowserType() {
  switch (ProcessEnvironmentConfig().browserType) {
    case BrowserTypes.Firefox:
      return firefox;
    case BrowserTypes.Webkit:
      return webkit;
    default:
      return chromium;
  }
}

/**
 * Get the process environment configuration.
 * @returns An object containing the browser type, headless mode, and output directory.
 */
export const ProcessEnvironmentConfig = () => ({
  browserType: process.env.BROWSER?.toLowerCase() || BrowserTypes.Chromium,
  headless: process.env.HEADLESS === 'true',
  outputDirectory: outputDir,
});
