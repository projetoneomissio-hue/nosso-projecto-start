import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: "list",
    timeout: 30_000,

    globalSetup: "./e2e/global-setup.ts",

    webServer: {
        command: "npm run dev",
        url: "http://localhost:8080",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },

    use: {
        baseURL: "http://localhost:8080",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },

    projects: [
        {
            name: "auth",
            testMatch: /auth\.spec\.ts/,
            use: {
                ...devices["Desktop Chrome"],
                // No storageState — clean browser for auth tests
            },
        },
        {
            name: "chromium",
            testIgnore: /auth\.spec\.ts/,
            use: {
                ...devices["Desktop Chrome"],
                storageState: "e2e/.auth/storage-state.json",
            },
        },
    ],
});
