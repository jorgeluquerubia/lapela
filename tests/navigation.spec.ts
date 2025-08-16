import { test, expect } from '@playwright/test';

test.describe('Navegación de la aplicación', () => {
  test('el usuario debería poder navegar desde la página de inicio a la página de detalles de un producto', async ({ page }) => {
    // 1. Ir a la página de inicio y esperar a que la llamada a la API de productos se complete
    await page.route('**/api/products**', route => route.continue());
    const responsePromise = page.waitForResponse('**/api/products**');
    await page.goto('/');
    await responsePromise;

    // 2. Esperar a que los productos se carguen y encontrar el primer producto
    // Usamos un selector que apunte a la tarjeta de producto
    const firstProductCard = page.locator('.product-card').first();
    await expect(firstProductCard).toBeVisible();

    // Obtener el enlace del producto para la verificación posterior
    const productLinkElement = firstProductCard.locator('a').first();
    const productLink = await productLinkElement.getAttribute('href');
    expect(productLink).not.toBeNull();

    // 3. Hacer clic en el título del producto, que es un enlace
    await firstProductCard.locator('h3').click();

    // 4. Verificar que la URL ha cambiado a la página de detalles del producto
    await page.waitForURL(`**${productLink}`);
    expect(page.url()).toContain(productLink!);

    // 5. Verificar que algún contenido de la página de detalles es visible
    // Por ejemplo, buscamos el título "Descripción" que debería estar en la página de detalles.
    await expect(page.getByRole('heading', { name: 'Descripción' })).toBeVisible();
  });
});
