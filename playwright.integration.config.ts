import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './integration',
  workers: 1,
  timeout: 90_000,
  expect: {timeout: 15_000},
  reporter: [['list'], ['html', {outputFolder: 'playwright-report/integration', open: 'never'}]],
  use: {...devices['Desktop Chrome'], trace: 'off'},
});
