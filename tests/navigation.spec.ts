import { test, expect } from '@playwright/test';

test.describe('Navegación de la aplicación', () => {
  test('permite pasar del catálogo de ejemplo a la ficha semántica de un artículo', async ({ page }) => {
    await page.goto('/?examples=1');

    await expect(page.getByText('Catálogo de ejemplo')).toBeVisible();
    const product = page.getByRole('link', {name: 'Auriculares inalámbricos negros', exact: true});
    await expect(product).toBeVisible();

    await product.click();

    await expect(page).toHaveURL(/\/articulos\/ejemplo-auriculares-inalambricos-negros-demo-1$/);
    await expect(page.getByRole('heading', {name: 'Auriculares inalámbricos negros'})).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Todo sobre este artículo'})).toBeVisible();
    await expect(page.getByText('Anuncio de ejemplo · Fotografía ilustrativa. Este artículo no está a la venta.', {exact: true})).toBeVisible();
  });
});
