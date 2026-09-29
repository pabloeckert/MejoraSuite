import { test as base } from '@playwright/test';
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

test.describe('MejoraCRM - Flujo Principal', () => {
  test('debe permitir crear un cliente y registrar una interacción', async ({ crm }) => {
    const clientName = `Test Cliente ${Math.floor(Math.random() * 10000)}`;
    const clientEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
    const clientPhone = '+54 376 4123456';

    // 1 & 2. Navegar a clientes y crear uno nuevo
    await crm.navigateTo('Clientes');
    await crm.createClient(clientName, clientEmail, clientPhone);
    
    // 4. Verificar que el cliente aparece en la lista
    await crm.verifyClientInList(clientName);

    // 5. Entrar al detalle del cliente
    await crm.openClientDetail(clientName);
    
    // Cerramos el detalle para ir a registrar la interacción
    await crm.closeDialog();

    // 6. Registrar una interacción
    await crm.navigateTo('Interacciones');
    await crm.registerInteraction({
      clientName,
      result: 'Hice un seguimiento',
      scenario: 'Seguimiento independiente',
      medium: 'Llamada',
      notes: 'Llamada de seguimiento',
    });

    // 7. Verificar que la interacción aparece en el historial del cliente
    await crm.navigateTo('Clientes');
    await crm.openClientDetail(clientName);
    await crm.verifyInteractionInHistory('Llamada de seguimiento', 'Llamada');
  });
});
