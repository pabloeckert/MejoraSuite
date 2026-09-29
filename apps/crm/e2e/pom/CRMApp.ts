import { Page, expect } from '@playwright/test';

export class CRMApp {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
    // Esperar a que desaparezca el cargador inicial si existe
    await this.page.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await this.closeOnboarding();
  }

  async closeOnboarding() {
    // Intentar cerrar el onboarding si aparece (con timeout de 2 segundos)
    const skipButton = this.page.getByText('Saltar onboarding');
    const closeButton = this.page.getByRole('button', { name: 'Cerrar' });
    
    try {
      if (await skipButton.isVisible({ timeout: 2000 })) {
        await skipButton.click();
      } else if (await closeButton.isVisible({ timeout: 500 })) {
        await closeButton.click();
      }
    } catch (e) {
      // Si no aparece, ignorar
    }
  }

  async navigateTo(section: 'Clientes' | 'Interacciones' | 'Dashboard' | 'Productos' | 'Vista General' | 'Configuración') {
    // Usar selectores de href para mayor estabilidad, especialmente si el sidebar está colapsado
    const hrefs = {
      'Dashboard': '/',
      'Vista General': '/',
      'Clientes': '/clients',
      'Interacciones': '/interactions',
      'Productos': '/products',
      'Configuración': '/settings'
    };
    
    const href = hrefs[section];
    const link = this.page.locator(`a[href="${href}"]`);
    await link.waitFor({ state: 'visible' });
    await link.click();
  }

  // --- Clients Section ---

  async createClient(name: string, email: string, whatsapp: string) {
    await this.page.getByRole('button', { name: 'Nuevo cliente' }).click();
    
    // Usar placeholders para mayor robustez ante cambios en labels con asteriscos o espacios
    await this.page.getByPlaceholder('Nombre y apellido del cliente').fill(name);
    await this.page.locator('#email').fill(email);
    await this.page.getByPlaceholder('+54 376 4000000').fill(whatsapp);
    
    await this.page.getByRole('button', { name: 'Crear' }).click();
  }

  async verifyClientInList(name: string) {
    await expect(this.page.getByRole('cell', { name })).toBeVisible({ timeout: 10000 });
  }

  async openClientDetail(name: string) {
    await this.page.getByRole('cell', { name }).click();
    await expect(this.page.getByRole('dialog')).toBeVisible();
    await expect(this.page.getByRole('heading', { name })).toBeVisible();
  }

  async closeDialog() {
    await this.page.keyboard.press('Escape');
    await expect(this.page.getByRole('dialog')).not.toBeVisible();
  }

  async deactivateClient(name: string) {
    // Buscar la fila del cliente y hacer clic en el botón de desactivar (trash/user-x)
    // El botón tiene el título "Marcar como inactivo"
    const row = this.page.getByRole('row').filter({ hasText: name });
    await row.getByTitle('Marcar como inactivo').click();
  }

  async verifyClientNotInList(name: string) {
    await expect(this.page.getByRole('cell', { name })).not.toBeVisible();
  }

  // --- Settings Section ---

  async updateExchangeRate(rate: string) {
    const input = this.page.locator('input[type="number"]').first();
    await input.fill(rate);
    await this.page.getByRole('button', { name: 'Guardar' }).first().click();
  }

  async getExchangeRate(): Promise<string> {
    return await this.page.locator('input[type="number"]').first().inputValue();
  }

  // --- Interactions Section ---

  async registerInteraction(options: {
    clientName: string;
    result: string;
    scenario?: string;
    medium: string;
    notes: string;
  }) {
    await this.page.getByRole('button', { name: 'Nueva interacción' }).click();
    
    // Paso 1: Seleccionar cliente
    await this.page.getByPlaceholder('Buscar cliente...').fill(options.clientName);
    await this.page.getByText(options.clientName).first().click();
    await this.page.getByRole('button', { name: 'Siguiente' }).click();
    
    // Paso 2: Resultado
    const resultBtn = this.page.getByRole('button', { name: options.result });
    await resultBtn.waitFor({ state: 'visible' });
    await resultBtn.click();
    await this.page.getByRole('button', { name: 'Siguiente' }).click();
    
    // Paso 3: Detalles (si aplica)
    if (options.scenario) {
      await this.page.getByRole('combobox').first().click();
      await this.page.getByRole('option', { name: options.scenario }).click();
      await this.page.getByRole('button', { name: 'Siguiente' }).click();
    }
    
    // Paso 4: Medio y Observaciones
    await this.page.getByRole('button', { name: options.medium }).click();
    await this.page.getByPlaceholder('Detalles adicionales...').fill(options.notes);
    await this.page.getByRole('button', { name: 'Registrar' }).click();
    
    await expect(this.page.getByRole('dialog')).not.toBeVisible();
  }

  async verifyInteractionInHistory(notes: string, medium: string) {
    await expect(this.page.getByText(notes)).toBeVisible();
    await expect(this.page.getByText(medium, { exact: true })).toBeVisible();
  }
}
