import { test as base, expect } from '@playwright/test';
import { CRMApp } from './pom/CRMApp';

// Declaramos el tipo para nuestros fixtures
type MyFixtures = {
  crm: CRMApp;
};

// Extendemos el test base con nuestros fixtures
const test = base.extend<MyFixtures>({
  crm: async ({ page }, runTest) => {
    const crm = new CRMApp(page);
    await crm.goto();
    await runTest(crm);
  },
});

test.describe('MejoraCRM - Flujos Adicionales', () => {
  test('debe permitir eliminar (desactivar) un cliente', async ({ crm }) => {
    const clientName = `Eliminar Cliente ${Math.floor(Math.random() * 10000)}`;
    const clientEmail = `eliminar${Math.floor(Math.random() * 10000)}@example.com`;
    const clientPhone = '+54 376 4999999';

    // 1. Navegar a clientes y crear uno nuevo
    await crm.navigateTo('Clientes');
    await crm.createClient(clientName, clientEmail, clientPhone);
    await crm.verifyClientInList(clientName);

    // 2. Asegurarse de estar en "Vista Dueño" para poder desactivar (solo admins)
    const toggleBtn = crm.page.getByRole('button', { name: /Vista/ });
    if (await toggleBtn.isVisible()) {
      const text = await toggleBtn.textContent();
      if (text?.includes('Vendedor')) {
        await toggleBtn.click();
        await expect(crm.page.getByText('Vista Dueño')).toBeVisible();
      }
    }

    // 3. Desactivar el cliente
    await crm.deactivateClient(clientName);

    // 4. Verificar que el cliente aparece como Inactivo usando el filtro de status
    await test.step('Verificar que el cliente aparece como Inactivo', async () => {
        // Asegurarse de que el toast de éxito aparezca
        await expect(crm.page.getByText('Cliente marcado como inactivo')).toBeVisible();

        // Hacer clic en el botón de filtro 'Inactivo'
        // STATUS_LABELS['inactivo'] es "Inactivo"
        await crm.page.getByRole('button', { name: /^Inactivo/ }).click();
        
        // Buscar específicamente al cliente para filtrar la tabla
        const searchInput = crm.page.getByPlaceholder('Buscar por nombre o empresa...');
        await searchInput.fill('');
        await searchInput.fill(clientName);
        
        const row = crm.page.getByRole('row').filter({ hasText: clientName });
        // Esperar a que el cliente aparezca en la lista filtrada con el badge correcto
        await expect(row).toBeVisible({ timeout: 15000 });
        await expect(row.getByText('Inactivo')).toBeVisible();
    });
  });

  test('debe permitir configurar el tipo de cambio y persistirlo', async ({ crm }) => {
    const newRate = "1250";

    // 1. Navegar a configuración
    await crm.navigateTo('Configuración');

    // 2. Cambiar el tipo de cambio
    await crm.updateExchangeRate(newRate);

    // 3. Verificar persistencia navegando a otra página y volviendo
    await crm.navigateTo('Dashboard');
    await crm.navigateTo('Configuración');
    
    const currentRate = await crm.getExchangeRate();
    expect(currentRate).toBe(newRate);
  });
});
