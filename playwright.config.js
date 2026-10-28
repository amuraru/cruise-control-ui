import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  workers: 2,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173/ui/',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort --base /ui/',
    url: 'http://127.0.0.1:4173/ui/',
    reuseExistingServer: false
  }
})
