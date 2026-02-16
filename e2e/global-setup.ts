import { chromium, type FullConfig } from "@playwright/test";

const SUPABASE_URL = "https://ssnmuiskarajydbtwgto.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTc3NDQsImV4cCI6MjA4NjY5Mzc0NH0.NJvrN04ghhZ7P8YUcL1Ww3KshJn8lhi0grjm6cB37YQ";

const TEST_EMAIL = "neomissiocuritiba@gmail.com";
const TEST_PASSWORD = "987546";

/**
 * Global setup: authenticate via Supabase REST API,
 * inject tokens into localStorage, then save storageState.
 */
async function globalSetup(_config: FullConfig) {
    // 1. Authenticate via Supabase GoTrue API
    const res = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
            method: "POST",
            headers: {
                apikey: SUPABASE_ANON_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Supabase auth failed: ${res.status} — ${err}`);
    }

    const session = await res.json();

    // 2. Open browser, navigate to app, inject session into localStorage
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("http://localhost:8080/login");
    await page.waitForLoadState("domcontentloaded");

    // Supabase stores session under key:
    // sb-<ref>-auth-token
    const storageKey = `sb-ssnmuiskarajydbtwgto-auth-token`;
    const storageValue = JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type,
        user: session.user,
    });

    await page.evaluate(
        ({ key, value }) => {
            localStorage.setItem(key, value);
        },
        { key: storageKey, value: storageValue }
    );

    // 3. Save storage state for reuse
    await context.storageState({ path: "e2e/.auth/storage-state.json" });

    await browser.close();
}

export default globalSetup;
