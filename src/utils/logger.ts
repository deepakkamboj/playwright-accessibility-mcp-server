import fs from 'node:fs';

export function logMessage(level: string, message: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  fs.appendFileSync('server.log', logEntry);
  console.error(message); // Also log to console
}
