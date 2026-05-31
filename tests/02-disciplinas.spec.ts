import { test, expect } from '@playwright/test';
import * as otplib from 'otplib';

const OTP_SECRET = 'EHHYZHLVKER7MJGP';
const USER_EMAIL = 'e2e-super-teacher-04@example.com';
const USER_PASS = 'password';

// IDs únicos para cada operação
const CREATE_ID = String(Math.floor(Math.random() * 90000) + 10000);
const UPDATE_ID = String(Math.floor(Math.random() * 90000) + 10000);

const NOME_DISCIPLINA_CREATE = `DisciplinaCreate_${CREATE_ID}`;
const NOME_DISCIPLINA_UPDATE = `DisciplinaUpdate_${UPDATE_ID}`;

test.describe('CRUD Disciplinas - Login + OTP', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000); 
    await page.goto('https://app.avaliei.com.br/login', { waitUntil: 'domcontentloaded' });

    // Espera pelo campo de email
    const emailInput = page.getByRole('textbox', { name: /Email/i });
    await emailInput.waitFor({ state: 'visible', timeout: 20000 });
    await emailInput.fill(USER_EMAIL);

    const senhaInput = page.getByRole('textbox', { name: /Senha/i });
    await senhaInput.waitFor({ state: 'visible', timeout: 20000 });
    await senhaInput.fill(USER_PASS);

    await page.getByRole('button', { name: /Entrar/i }).click();

    otplib.authenticator.options = { window: 2 };
    const token = otplib.authenticator.generate(OTP_SECRET);
    const otpInput = page.getByRole('textbox', { name: 'Código de verificação de 6 dí' });
    await otpInput.waitFor({ state: 'visible', timeout: 60000 });
    await otpInput.fill(token);
    await page.getByRole('button', { name: 'Verificar código de autentica' }).click();

    // Espera pelo botão "Disciplinas"
    await page.getByRole('button', { name: 'Disciplinas' }).first().waitFor({ state: 'visible', timeout: 60000 });
    await page.getByRole('button', { name: 'Disciplinas' }).first().click();
    await page.getByRole('link', { name: 'Disciplinas' }).click();
    await expect(page.getByRole('heading', { name: 'Disciplinas' })).toBeVisible({ timeout: 60000 });
  });


  // CREATE
  test('CREATE [Happy Path]', async ({ page }) => {
    await page.getByRole('button', { name: 'Adicionar disciplina' }).click();
    await page.getByRole('textbox', { name: 'Nome da disciplina: *' }).fill(NOME_DISCIPLINA_CREATE);
    await page.getByRole('button', { name: 'Selecione a área da disciplina' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText(NOME_DISCIPLINA_CREATE)).toBeVisible({ timeout: 60000 });
  });

  test('CREATE [Sad Path]', async ({ page }) => {
    await page.getByRole('button', { name: 'Adicionar disciplina' }).click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.locator('#subject-nome-error')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('#disciplina-area-error')).toBeVisible({ timeout: 60000 });
  });

  test('CREATE [Edge Case]', async ({ page }) => {
    const longName = 'B'.repeat(256);
    await page.getByRole('button', { name: 'Adicionar disciplina' }).click();
    await page.getByRole('textbox', { name: 'Nome da disciplina: *' }).fill(longName);
    await page.getByRole('button', { name: 'Selecione a área da disciplina' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('O campo nome da disciplina não pode ser superior a 125 caracteres.')).toBeVisible({ timeout: 60000 });
  });

  // READ
  test('READ [Happy Path]', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).fill(NOME_DISCIPLINA_CREATE);
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).press('Enter');
    await expect(page.locator('tbody').getByText(NOME_DISCIPLINA_CREATE)).toBeVisible({ timeout: 60000 });
    await page.getByRole('button', { name: 'Limpar pesquisa' }).click();
  });

  test('READ [Sad Path]', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).fill('Inexistente');
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).press('Enter');
    await expect(page.getByText('Nenhuma disciplina encontrada')).toBeVisible({ timeout: 60000 });
  });

  test('READ [Edge Case] - Pesquisa parcial retorna resultados', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).fill('Disciplina');
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).press('Enter');
    const rowsCount = await page.locator('tbody tr').count();
    expect(rowsCount).toBeGreaterThan(0);
  });

  // UPDATE
  test('UPDATE [Happy Path]', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).fill(NOME_DISCIPLINA_CREATE);
    await page.getByRole('button', { name: 'Editar', exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Nome da disciplina: *' }).fill(NOME_DISCIPLINA_UPDATE);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Disciplina salva com sucesso')).toBeVisible({ timeout: 60000 });
  });

  test('UPDATE [Sad Path]', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).fill(NOME_DISCIPLINA_UPDATE);
    await page.getByRole('button', { name: 'Editar', exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Nome da disciplina: *' }).fill('');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.locator('#subject-nome-error')).toBeVisible({ timeout: 60000 });
  });

  test('UPDATE [Edge Case]', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).fill(NOME_DISCIPLINA_UPDATE);
    await page.getByRole('button', { name: 'Editar', exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Nome da disciplina: *' }).fill('Disciplina ###$$$');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Conteúdo inválido detectado na requisição.')).toBeVisible({ timeout: 60000 });
  });

  // DELETE
  test('DELETE [Happy Path]', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).fill(NOME_DISCIPLINA_UPDATE);
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).press('Enter');

    const excluirBtn = page.locator('tbody').getByRole('button', { name: 'Excluir' }).first();
    await excluirBtn.waitFor({ state: 'visible', timeout: 60000 });

    if (await excluirBtn.isEnabled()) {
      await excluirBtn.click();
      await page.getByRole('button', { name: 'Excluir' }).click();
      await expect(page.getByText('Disciplina excluída com sucesso')).toBeVisible({ timeout: 60000 });

      await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).fill(NOME_DISCIPLINA_UPDATE);
      await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).press('Enter');
      await expect(page.getByText('Nenhuma disciplina encontrada')).toBeVisible({ timeout: 60000 });
    } else {
      await expect(excluirBtn).toHaveAttribute('disabled', '');
      await expect(excluirBtn).toHaveAttribute('aria-label', /Não é possível excluir|possui vínculos/);
    }
  });

  test('DELETE [Sad Path]', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).fill(NOME_DISCIPLINA_UPDATE);
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).press('Enter');

    const excluirBtn = page.locator('tbody').getByRole('button', { name: 'Excluir' }).first();
    await excluirBtn.waitFor({ state: 'visible', timeout: 60000 });

    if (await excluirBtn.isEnabled()) {
      await excluirBtn.click();
      await page.getByRole('button', { name: 'Cancelar' }).click();
    } else {
            await expect(excluirBtn).toHaveAttribute('disabled', '');
    }
  });

  test('DELETE [Edge Case]', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).fill(NOME_DISCIPLINA_UPDATE);
    await page.getByRole('textbox', { name: 'Pesquisar disciplina...' }).press('Enter');

    const excluirBtn = page.locator('tbody').getByRole('button', { name: 'Excluir' }).first();
    await excluirBtn.waitFor({ state: 'visible', timeout: 60000 });

    if (await excluirBtn.isEnabled()) {
      await excluirBtn.click();
      await page.getByRole('button', { name: 'Excluir' }).click();
      await expect(page.getByText('Disciplina excluída com sucesso')).toBeVisible({ timeout: 60000 });
    } else {
      await expect(excluirBtn).toHaveAttribute('disabled', '');
      await expect(excluirBtn).toHaveAttribute(
        'aria-label',
        /Não é possível excluir|possui vínculos/
      );
    }
  });
});
