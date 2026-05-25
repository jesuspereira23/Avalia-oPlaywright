import { test, expect } from '@playwright/test';
import * as otplib from 'otplib';

// Configurações fornecidas
const OTP_SECRET = 'EHHYZHLVKER7MJGP';
const USER_EMAIL = 'e2e-super-teacher-04@example.com';
const USER_PASS = 'password';

// Força a string de ID a ser instanciada uma única vez no escopo do arquivo
const UNIQUE_ID = String(Math.floor(Math.random() * 90000) + 10000);
const NOME_AREA = `Area Teste ${UNIQUE_ID}`;
const NOME_AREA_EDITADA = `Area Editada ${UNIQUE_ID}`;

test.describe('CRUD 1 - Áreas (Cobertura Estruturada)', () => {
  
  // Roda em ordem estrita de dependência (Sequencial)
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // 1. Fluxo de Autenticação Estável
    await page.goto('https://app.avaliei.com.br/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(USER_EMAIL);
    await page.getByRole('textbox', { name: 'Senha' }).fill(USER_PASS);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Geração do Token OTP
    otplib.authenticator.options = { window: 2 };
    const token = otplib.authenticator.generate(OTP_SECRET);

    // Preenchimento do OTP
    const otpInput = page.getByRole('textbox', { name: 'Código de verificação de 6 dí' });
    await otpInput.waitFor({ state: 'visible', timeout: 10000 });
    await otpInput.fill(token);
    await page.getByRole('button', { name: 'Verificar código de autentica' }).click();

    // 2. Navegação Lateral Estabilizada
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Disciplinas' }).first().click();
    await page.getByRole('link', { name: 'Áreas' }).click();
    await page.waitForURL(/.*areas/, { timeout: 10000 });
  });

  // ==========================================
  // 1. CREATE (Criação)
  // ==========================================

  test('CREATE [Happy Path] - Deve criar uma nova área informando um nome válido', async ({ page }) => {
    await page.getByRole('button', { name: 'Adicionar área' }).click();
    await page.getByRole('textbox', { name: 'Nome da Área:' }).fill(NOME_AREA);
    
    // Clica em salvar e aguarda o fechamento do modal/resposta da API
    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.waitForLoadState('networkidle');
    
    // Filtra na barra de pesquisa para garantir que ela aparece na tela sem paginação
    await page.getByRole('textbox', { name: 'Pesquisar área...' }).fill(NOME_AREA);
    await page.waitForTimeout(1000);
    
    await expect(page.getByText(NOME_AREA).first()).toBeVisible();
  });

  test('CREATE [Sad Path] - Deve tentar salvar sem preencher dados e fechar o modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Adicionar área' }).click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Nova área' })).not.toBeVisible();
  });

  // ==========================================
  // 2. READ (Pesquisa e Listagem)
  // ==========================================

  test('READ [Happy Path] - Deve pesquisar uma área e limpar o filtro com sucesso', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar área...' }).fill(NOME_AREA);
    await page.getByRole('textbox', { name: 'Pesquisar área...' }).press('Enter');
    
    await page.getByRole('button', { name: 'Limpar pesquisa' }).click();
  });

  test('READ [Borda] - Deve buscar por um termo inexistente e interagir com o ícone de lupa', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar área...' }).fill('dfdsfdf');
    await page.locator('.lucide.lucide-search').click();
  });

  // ==========================================
  // 3. UPDATE (Edição)
  // ==========================================

  test('UPDATE [Happy Path] - Deve buscar a área recém-criada e alterar o seu nome', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar área...' }).fill(NOME_AREA);
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: 'Editar', exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Nome da Área:' }).fill(NOME_AREA_EDITADA);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.waitForLoadState('networkidle');
    
    // Pesquisa pelo novo nome para validar a alteração
    await page.getByRole('textbox', { name: 'Pesquisar área...' }).fill(NOME_AREA_EDITADA);
    await page.waitForTimeout(1000);
    
    await expect(page.getByText(NOME_AREA_EDITADA).first()).toBeVisible();
  });

  test('UPDATE [Sad Path] - Deve abrir o modal de edição e fechar usando o botão Close', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar área...' }).fill(NOME_AREA_EDITADA);
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: 'Editar', exact: true }).first().click();
    await page.getByRole('button', { name: 'Close' }).click();
  });

  // ==========================================
  // 4. DELETE (Exclusão)
  // ==========================================

  test('DELETE [Sad Path] - Deve abrir o modal de exclusão mas cancelar a ação', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar área...' }).fill(NOME_AREA_EDITADA);
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: 'Excluir', exact: true }).first().click();
    await page.getByRole('button', { name: 'Cancelar' }).click();
  });

  test('DELETE [Happy Path] - Deve pesquisar a área editada e excluí-la confirmando no modal', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Pesquisar área...' }).fill(NOME_AREA_EDITADA);
    await page.getByRole('textbox', { name: 'Pesquisar área...' }).press('Enter');
    
    await page.getByRole('button', { name: 'Excluir', exact: true }).first().click();
    await page.getByRole('button', { name: 'Excluir' }).click();
    
    // Aguarda o encerramento das animações do modal e requisições de rede
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); 
    
    // 🔥 SOLUÇÃO: Procura o nome da área APENAS dentro do corpo da tabela (tbody)
    // Isso evita o conflito com textos de modais antigos ou mensagens flutuantes
    await expect(page.locator('tbody').getByText(NOME_AREA_EDITADA)).not.toBeVisible();
  });

});