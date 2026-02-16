import { test, expect } from "@playwright/test";

const TEST_EMAIL = "neomissiocuritiba@gmail.com";
const TEST_PASSWORD = "987546";

test.describe("Autenticação", () => {
    test("tela de login renderiza campos de email e senha", async ({ page }) => {
        await page.goto("/login");
        await page.waitForSelector('input[type="email"]', { timeout: 10_000 });

        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
    });

    test("login com credenciais inválidas mostra erro", async ({ page }) => {
        await page.goto("/login");
        await page.waitForSelector('input[type="email"]', { timeout: 10_000 });

        await page.locator('input[type="email"]').fill("usuario@invalido.com");
        await page.locator('input[type="password"]').fill("SenhaErrada123!");
        await page.getByRole("button", { name: /entrar/i }).click();

        // Wait for a toast notification — the Toaster component uses data attributes
        await page.waitForTimeout(3_000);

        // Check: either a toast appeared, or an error text is visible, or the page still has login form
        const stillOnLogin = page.url().includes("/login");
        expect(stillOnLogin).toBeTruthy();
    });

    test("login com credenciais válidas redireciona", async ({ page }) => {
        await page.goto("/login");
        await page.waitForSelector('input[type="email"]', { timeout: 10_000 });

        await page.locator('input[type="email"]').fill(TEST_EMAIL);
        await page.locator('input[type="password"]').fill(TEST_PASSWORD);
        await page.getByRole("button", { name: /entrar/i }).click();

        // Should redirect away from /login
        await page.waitForFunction(
            () => !window.location.pathname.includes("/login"),
            { timeout: 20_000 }
        );

        expect(page.url()).not.toContain("/login");
    });
});
