import { test, expect } from "@playwright/test";

test.describe("Navegação", () => {
    test("sidebar de navegação está visível no dashboard", async ({ page }) => {
        await page.goto("/dashboard");
        await page.waitForLoadState("networkidle");
        await expect(
            page.locator("nav, aside, [data-sidebar]").first()
        ).toBeVisible({ timeout: 10_000 });
    });

    test("página 404 para rota inexistente", async ({ page }) => {
        await page.goto("/rota-que-nao-existe-xyz");
        await expect(
            page.getByText(/404|não encontrada|not found/i).first()
        ).toBeVisible({ timeout: 5_000 });
    });
});
