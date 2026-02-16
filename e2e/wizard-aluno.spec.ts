
import { test, expect } from "@playwright/test";

test.describe("Wizard de Cadastro de Aluno", () => {
    // Use globalSetup auth state
    // Navigate to wizard page (assuming standard navigation or direct link)
    // But wait, the button is "window.location.href = '/responsavel/cadastrar-aluno'" in Alunos.tsx
    // So we can go directly there.

    test.beforeEach(async ({ page }) => {
        // Go to dashboard first to ensure auth state is loaded effectively if needed, 
        // or go directly if storageState is sufficient.
        await page.goto("/responsavel/cadastrar-aluno");
        await page.waitForLoadState("networkidle");
    });

    test("deve renderizar o passo 1 (Dados Pessoais) inicialmente", async ({ page }) => {
        // Verify we are on the correct page
        await expect(page).toHaveURL(/cadastrar-aluno/);

        // Text might be uppercase via CSS
        await expect(page.getByText(/Dados Pessoais/i)).toBeVisible();
        await expect(page.getByLabel(/Nome Completo/i)).toBeVisible();
        await expect(page.getByLabel(/CPF do Aluno/i)).toBeVisible();
        // Step 2 content should not be visible
        await expect(page.getByLabel(/Alergias/i)).not.toBeVisible();
    });

    test("deve validar campos obrigatórios no passo 1", async ({ page }) => {
        // Try to click Next without filling
        await page.getByRole("button", { name: /Próximo/i }).click();

        // Expect toasts or validation messages
        // Use a more robust locator strategy
        const errorToast = page.locator('div[data-state="open"], [role="alert"], .toast');
        await expect(errorToast.filter({ hasText: "Campo obrigatório" }).first()).toBeVisible({ timeout: 10000 });
    });

    test("deve navegar entre os passos corretamente", async ({ page }) => {
        // Fill Step 1
        await page.getByLabel(/Nome Completo/i).fill("Aluno Teste Wizard");
        await page.getByLabel(/Data de Nascimento/i).fill("2015-01-01");
        // CPF is optional or validated if filled. Let's leave it empty for simplicity or fill valid.
        // If empty is allowed by schema? Yes " cleanCpf || null".

        await page.getByRole("button", { name: /Próximo/i }).click();

        // Should be on Step 2
        await expect(page.getByText("Saúde & Contato")).toBeVisible();
        await expect(page.getByLabel(/Telefone/i)).toBeVisible();

        // Fill Step 2 (Optional fields mostly)
        await page.getByLabel(/Telefone/i).fill("11999999999");
        await page.getByRole("button", { name: /Próximo/i }).click();

        // Should be on Step 3
        // Check for "Foto & Fim" text, handling potential uppercase CSS
        await expect(page.getByText(/Foto & Fim/i)).toBeVisible();
        await expect(page.getByText("Aluno Teste Wizard")).toBeVisible(); // Review data

        // Click Finalizar
        // The button text changed to "Finalizar Cadastro"
        await page.getByRole("button", { name: /Finalizar Cadastro/i }).click();

        // Expect Success Dialog
        await expect(page.getByRole("heading", { name: /Cadastro Realizado com Sucesso/i })).toBeVisible();

        // Check for options
        await expect(page.getByRole("button", { name: /Cadastrar Outro Aluno/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /Matricular em Atividade/i })).toBeVisible();
    });
});
