import { randomUUID } from 'node:crypto';
import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3081';
const cronSecret = process.env.LAPELA_MVP_CRON_SECRET ||= randomUUID();

for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'LAPELA_MVP_MAIL_URL']) {
  const url = process.env[name];
  if (!url || new URL(url).origin !== url || !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url)) {
    throw new Error(`${name} debe apuntar a un servicio HTTP local de pruebas.`);
  }
}

for (const name of ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!process.env[name]) throw new Error(`Falta ${name} para Supabase local.`);
}

export default defineConfig({
  testDir: './tests/mvp',
  workers: 1,
  timeout: 150_000,
  expect: { timeout: 15_000 },
  use: { ...devices['Desktop Chrome'], baseURL },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3081',
    url: baseURL,
    reuseExistingServer: false,
    env: {
      APP_URL: baseURL,
      LAPELA_PAYMENTS_MODE: 'simulated',
      LAPELA_LIVE_PAYMENTS: 'false',
      NEXT_TELEMETRY_DISABLED: '1',
      CRON_SECRET: cronSecret,
    },
  },
});
