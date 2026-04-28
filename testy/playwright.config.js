const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: '.',
  outputDir: './test-results',
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ],
  webServer: {
    command: 'node backend/server.js',
    cwd: path.resolve(__dirname, '..'),
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000
  }
});
