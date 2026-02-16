import { test, expect } from "@playwright/test";

test.describe("Financeiro", () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to dashboard first — this always works with storageState
        await page.goto("/dashboard");
        await page.waitForSelector("nav, aside, [data-sidebar]", { timeout: 15_000 });
        // Use sidebar link to navigate (like a real user)
        await page.getByRole("link", { name: /financeiro/i }).click();
        await page.waitForURL("**/financeiro**", { timeout: 10_000 });
        await page.waitForLoadState("networkidle");
    });

    test("página carrega com título correto", async ({ page }) => {
        await expect(
            page.getByRole("heading", { name: /financeiro/i }).first()
        ).toBeVisible({ timeout: 10_000 });
    });

    test("KPIs de receita e despesas são exibidos", async ({ page }) => {
        await expect(
            page.getByText(/receita mensal/i).first()
        ).toBeVisible({ timeout: 10_000 });

        await expect(
            page.getByText(/despesas/i).first()
        ).toBeVisible();
    });

    test("gráficos de receita são renderizados", async ({ page }) => {
        const chartContainers = page.locator(".recharts-responsive-container");
        await expect(chartContainers.first()).toBeVisible({ timeout: 15_000 });
    });

    test("tabela de últimos pagamentos carrega", async ({ page }) => {
        await expect(
            page.getByText(/últimos pagamentos/i).first()
        ).toBeVisible({ timeout: 10_000 });
    });
});
