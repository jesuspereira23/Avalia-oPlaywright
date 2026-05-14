import { test, expect } from '@playwright/test';
// Mudança aqui: Importação específica para evitar o conflito de módulos
import { authenticator } from 'otplib';

const OTP_SECRET = 'AROGZAK4OLYH5KTWLS5AETEUOEEVNNTC';
const USER_EMAIL = 'e2e-super-teacher-01@example.com';
const USER_PASS = 'password';

test('Fluxo de Login Completo com Gerador de 2FA', async ({ page }) => {
  await page.goto('https://app.avaliei.com.br/login');

  // Preenchimento de login
  await page.getByRole('textbox', { name: 'Email' }).fill(USER_EMAIL);
  await page.getByRole('textbox', { name: 'Senha' }).fill(USER_PASS);
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Gerar Token (colocado dentro do teste para garantir execução correta)
  const token = authenticator.generate(OTP_SECRET);
  console.log(`Token gerado: ${token}`);

  // Esperar e preencher o OTP
  const otpInput = page.getByRole('textbox', { name: 'Código de verificação de 6 dí' });
  await otpInput.waitFor({ state: 'visible' });
  await otpInput.fill(token);
  
  await page.getByRole('button', { name: 'Verificar código de autentica' }).click();

  // Validação final
  await expect(page).not.toHaveURL(/login/);
});