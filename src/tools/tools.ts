import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { chromium } from '@playwright/test';
import axeBuilder from '@axe-core/playwright';
import { v4 as uuidv4 } from 'uuid';

import { logMessage } from '../utils/logger.js';
import * as path from 'path';
import * as fs from 'fs';
import { ProcessEnvironmentConfig } from '../utils/common.js';
import { promisify } from 'util';

// Define the schema for the scan-url tool parameters
const scanUrlSchema = z.object({
  url: z.string().url({
    message: 'Must be a valid URL starting with http:// or https://',
  }),
  waitForPageLoad: z
    .number()
    .int()
    .positive()
    .default(5000)
    .optional()
    .describe(
      'Time in milliseconds to wait for the page to load before scanning',
    ),
  viewport: z
    .object({
      width: z.number().int().positive().default(1280).optional(),
      height: z.number().int().positive().default(720).optional(),
    })
    .optional()
    .describe('Browser viewport dimensions'),
  axeOptions: z
    .object({
      runOnly: z
        .union([
          z.literal('wcag2a'),
          z.literal('wcag2aa'),
          z.literal('wcag2aaa'),
          z.literal('wcag21a'),
          z.literal('wcag21aa'),
          z.literal('wcag22aa'),
          z.literal('best-practice'),
          z.literal('experimental'),
        ])
        .optional()
        .describe('Standard to test against'),
      rules: z
        .record(
          z.string(),
          z.object({
            enabled: z.boolean(),
          }),
        )
        .optional()
        .describe('Enable or disable specific rules'),
    })
    .optional()
    .describe('Configuration options for axe-core'),
  includeHtml: z
    .boolean()
    .default(false)
    .optional()
    .describe('Include HTML snippets in the violation reports'),
  maxResults: z
    .number()
    .int()
    .positive()
    .default(50)
    .optional()
    .describe('Maximum number of violations to return'),
});

// Schema for the scan-html tool parameters
const scanHtmlSchema = z.object({
  html: z
    .string()
    .min(1, { message: 'HTML content cannot be empty' })
    .describe('Raw HTML content to be scanned'),
  waitForPageLoad: z
    .number()
    .int()
    .positive()
    .default(2000)
    .optional()
    .describe(
      'Time in milliseconds to wait for the page to load before scanning',
    ),
  viewport: z
    .object({
      width: z.number().int().positive().default(1280).optional(),
      height: z.number().int().positive().default(720).optional(),
    })
    .optional()
    .describe('Browser viewport dimensions'),
  axeOptions: z
    .object({
      runOnly: z
        .union([
          z.literal('wcag2a'),
          z.literal('wcag2aa'),
          z.literal('wcag2aaa'),
          z.literal('wcag21a'),
          z.literal('wcag21aa'),
          z.literal('wcag22aa'),
          z.literal('best-practice'),
          z.literal('experimental'),
        ])
        .optional()
        .describe('Standard to test against'),
      rules: z
        .record(
          z.string(),
          z.object({
            enabled: z.boolean(),
          }),
        )
        .optional()
        .describe('Enable or disable specific rules'),
    })
    .optional()
    .describe('Configuration options for axe-core'),
  includeHtml: z
    .boolean()
    .default(false)
    .optional()
    .describe('Include HTML snippets in the violation reports'),
  maxResults: z
    .number()
    .int()
    .positive()
    .default(50)
    .optional()
    .describe('Maximum number of violations to return'),
});

// Schema for the scan-batch tool parameters
const scanBatchSchema = z.object({
  urls: z
    .array(
      z.string().url({
        message: 'Must be a valid URL starting with http:// or https://',
      }),
    )
    .min(1, { message: 'At least one URL must be provided' })
    .max(20, { message: 'Maximum 20 URLs allowed per batch' })
    .describe('Array of URLs to scan'),
  ...scanUrlSchema.shape, // Reuse common parameters from scan-url
});

// Schema for the summarise-violations tool parameters
const summariseViolationsSchema = z.object({
  violations: z
    .array(
      z.object({
        id: z.string(),
        impact: z.union([
          z.literal('minor'),
          z.literal('moderate'),
          z.literal('serious'),
          z.literal('critical'),
        ]),
        description: z.string(),
        helpUrl: z.string().optional(),
        nodes: z
          .array(
            z.object({
              impact: z.union([
                z.literal('minor'),
                z.literal('moderate'),
                z.literal('serious'),
                z.literal('critical'),
              ]),
              target: z.array(z.string()),
              failureSummary: z.string().optional(),
              html: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .describe('Array of accessibility violations from Axe results'),
  format: z
    .union([
      z.literal('default'),
      z.literal('simple'),
      z.literal('detailed'),
      z.literal('markdown'),
      z.literal('html'),
      z.literal('csv'),
    ])
    .default('default')
    .optional()
    .describe('Output format for the summary'),
});

/**
 * Common function to perform accessibility checks.
 */
async function performA11yScan(
  page: import('playwright').Page,
  params: z.infer<typeof scanUrlSchema | typeof scanHtmlSchema>,
  testTitle: string,
): Promise<{ summary: any; violations: any[] }> {
  logMessage('info', `Performing accessibility scan: ${testTitle}`);

  await page.waitForLoadState('load');
  const tags = params.axeOptions?.runOnly
    ? [params.axeOptions.runOnly]
    : ['wcag2a', 'wcag2aa', 'wcag21aa']; // Get tags from axeOptions
  const builder = new axeBuilder({ page }).withTags(tags);

  const accessibilityScanResults = await builder.analyze();
  const violations = accessibilityScanResults.violations
    .slice(0, params.maxResults || 50)
    .map((violation: any) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map((node: any) => ({
        impact: node.impact,
        target: node.target,
        failureSummary: node.failureSummary,
        ...(params.includeHtml ? { html: node.html } : {}),
      })),
    }));

  const summary = {
    timestamp: new Date().toISOString(),
    violationsCount: accessibilityScanResults.violations.length,
    passesCount: accessibilityScanResults.passes.length,
    incompleteCount: accessibilityScanResults.incomplete.length,
  };

  return { summary, violations };
}

/**
 * Registers a tool for scanning URLs for accessibility violations using `a11y`.
 */
export function registerScanUrlTool(server: McpServer) {
  server.tool(
    'scan-url',
    'Scans a URL for accessibility violations using Playwright and Axe.',
    scanUrlSchema.shape,
    async (params: z.infer<typeof scanUrlSchema>) => {
      try {
        logMessage(
          'info',
          `Starting accessibility scan for URL: ${params.url}`,
        );

        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
          viewport: {
            width: params.viewport?.width ?? 1280,
            height: params.viewport?.height ?? 720,
          },
        });

        try {
          const page = await context.newPage();
          await page.goto(params.url, {
            waitUntil: 'networkidle',
            timeout: 30000,
          });

          if (params.waitForPageLoad) {
            await page.waitForTimeout(params.waitForPageLoad);
          }

          const results = await performA11yScan(
            page,
            params,
            `scan-url-${params.url}`,
          );
          logMessage('info', `Scan completed for URL: ${params.url}`);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        } finally {
          await browser.close();
        }
      } catch (error) {
        logMessage('error', `URL scanning error: ${(error as Error).message}`);
        return {
          content: [
            {
              type: 'text',
              text: `Error scanning URL: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * Registers a tool for scanning raw HTML content for accessibility violations using `a11y`.
 */
export function registerScanHtmlTool(server: McpServer) {
  server.tool(
    'scan-html',
    'Scans raw HTML content for accessibility violations using Playwright and Axe.',
    scanHtmlSchema.shape,
    async (params: z.infer<typeof scanHtmlSchema>) => {
      try {
        logMessage('info', `Starting accessibility scan for raw HTML content`);

        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
          viewport: {
            width: params.viewport?.width ?? 1280,
            height: params.viewport?.height ?? 720,
          },
        });
        try {
          const page = await context.newPage();
          await page.setContent(params.html, {
            waitUntil: 'networkidle',
            timeout: 30000,
          });

          if (params.waitForPageLoad) {
            await page.waitForTimeout(params.waitForPageLoad);
          }

          const results = await performA11yScan(
            page,
            { ...params, url: params.html },
            'scan-html',
          );
          logMessage('info', `Scan completed for raw HTML content`);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        } finally {
          await browser.close();
        }
      } catch (error) {
        logMessage('error', `HTML scanning error: ${(error as Error).message}`);
        return {
          content: [
            {
              type: 'text',
              text: `Error scanning HTML content: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * Registers a tool for scanning multiple URLs for accessibility violations using `a11y`.
 */
export function registerScanBatchTool(server: McpServer) {
  server.tool(
    'scan-batch',
    'Scans multiple URLs for accessibility violations using Playwright and Axe.',
    scanBatchSchema.shape,
    async (params: z.infer<typeof scanBatchSchema>) => {
      try {
        logMessage(
          'info',
          `Starting batch accessibility scan for ${params.urls.length} URLs`,
        );

        const browser = await chromium.launch({ headless: true });
        const results = [];

        try {
          for (const url of params.urls) {
            const context = await browser.newContext({
              viewport: {
                width: params.viewport?.width ?? 1280,
                height: params.viewport?.height ?? 720,
              },
            });

            try {
              const page = await context.newPage();
              logMessage('info', `Scanning URL: ${url}`);
              await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 30000,
              });

              if (params.waitForPageLoad) {
                await page.waitForTimeout(params.waitForPageLoad);
              }

              const result = await performA11yScan(
                page,
                { ...params, url },
                `scan-batch-${url}`,
              );
              results.push({ url, success: true, ...result });
              logMessage('info', `Scan completed for URL: ${url}`);
            } catch (error) {
              logMessage(
                'error',
                `Error scanning URL ${url}: ${(error as Error).message}`,
              );
              results.push({
                url,
                success: false,
                error: (error as Error).message,
              });
            } finally {
              await context.close();
            }
          }
        } finally {
          await browser.close();
        }

        logMessage(
          'info',
          `Batch scan completed for ${params.urls.length} URLs`,
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        logMessage(
          'error',
          `Batch scanning error: ${(error as Error).message}`,
        );
        return {
          content: [
            {
              type: 'text',
              text: `Error during batch scan: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * Summarizes accessibility violations from Axe results.
 * This tool processes an array of violations and returns a summary of the findings.
 */
export function registerSummariseViolationsTool(server: McpServer) {
  server.tool(
    'summarize-violations',
    'Summarizes accessibility violations from Axe results.',
    summariseViolationsSchema.shape,
    async (params: z.infer<typeof summariseViolationsSchema>) => {
      try {
        logMessage(
          'info',
          `Summarizing ${params.violations.length} accessibility violations`,
        );
        const summary = params.violations.reduce((acc, violation) => {
          acc[violation.impact] = (acc[violation.impact] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const formattedSummary = {
          totalViolations: params.violations.length,
          byImpact: summary,
          violations: params.violations.map((violation) => ({
            id: violation.id,
            description: violation.description,
            impact: violation.impact,
            helpUrl: violation.helpUrl,
            nodesAffected: violation.nodes?.length || 0,
          })),
        };

        logMessage(
          'info',
          `Summary generated for ${params.violations.length} violations`,
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formattedSummary, null, 2),
            },
          ],
        };
      } catch (error) {
        logMessage(
          'error',
          `Error summarizing violations: ${(error as Error).message}`,
        );
        return {
          content: [
            {
              type: 'text',
              text: `Error summarizing violations content: ${
                (error as Error).message
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * Summarizes accessibility violations from Axe results.
 * This tool processes an array of violations and returns a summary of the findings.
 */
export function registerWriteViolationsTool(server: McpServer) {
  server.tool(
    'write-violations-report',
    'Write accessibility violations report from Axe results.',
    summariseViolationsSchema.shape,
    async (params: z.infer<typeof summariseViolationsSchema>) => {
      try {
        logMessage(
          'info',
          `Writing ${params.violations.length} accessibility violations report`,
        );
        const summary = params.violations.reduce((acc, violation) => {
          acc[violation.impact] = (acc[violation.impact] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const formattedSummary = {
          totalViolations: params.violations.length,
          byImpact: summary,
          violations: params.violations.map((violation) => ({
            id: violation.id,
            description: violation.description,
            impact: violation.impact,
            helpUrl: violation.helpUrl,
            nodesAffected: violation.nodes?.length || 0,
          })),
        };

        // Add summary to file
        const accessibilityTestResultsDirectory = path.join(
          ProcessEnvironmentConfig().outputDirectory,
          'accessibility-test-results',
        );
        if (!fs.existsSync(accessibilityTestResultsDirectory)) {
          fs.mkdirSync(accessibilityTestResultsDirectory, { recursive: true });
        }
        const exportFileName = `${uuidv4()}.sarif`;
        const accessibilityTestResultFilePath = path.join(
          accessibilityTestResultsDirectory,
          exportFileName,
        );

        await promisify(fs.writeFile)(
          accessibilityTestResultFilePath,
          JSON.stringify(formattedSummary, null, 2), // Use formattedSummary here
        );

        logMessage(
          'info',
          `Summary generated for ${params.violations.length} violations`,
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formattedSummary, null, 2),
            },
          ],
        };
      } catch (error) {
        logMessage(
          'error',
          `Error summarizing violations: ${(error as Error).message}`,
        );
        return {
          content: [
            {
              type: 'text',
              text: `Error summarizing violations content: ${
                (error as Error).message
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
