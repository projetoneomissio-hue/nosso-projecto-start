import { test, expect } from "@playwright/test";

test.describe("Alunos (Coordenação)", () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to dashboard first
        await page.goto("/dashboard");
        await page.waitForSelector("nav, aside, [data-sidebar]", { timeout: 15_000 });

        // Navigate to Alunos via sidebar
        await page.locator('a[href*="alunos"]').first().click();
        await page.waitForURL("**/alunos", { timeout: 10_000 });
        await page.waitForLoadState("networkidle");
    });

    test("página de alunos carrega com título correto", async ({ page }) => {
        await expect(
            page.getByRole("heading", { name: /alunos/i }).first()
        ).toBeVisible({ timeout: 10_000 });
    });

    test("botão de novo aluno está visível", async ({ page }) => {
        // Look for button "Novo Aluno"
        const novoAlunoBtn = page.locator("button", { hasText: /novo aluno/i });
        await expect(novoAlunoBtn).toBeVisible({ timeout: 10_000 });
    });

    test("lista de alunos é exibida ou mensagem de vazio", async ({ page }) => {
        // Either a table/list exists OR a "Nenhum aluno" message
        // Either a table/list exists OR a "Nenhum aluno" message
        const table = page.locator("table");
        const grid = page.locator(".ag-grid");
        const emptyMsg = page.getByText("Nenhum aluno");

        await expect(table.or(grid).or(emptyMsg).first()).toBeVisible({ timeout: 10_000 });
    });
});
