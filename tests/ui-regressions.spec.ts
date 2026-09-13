import { test, expect } from '@playwright/test';

test.describe('LP-FIX-011: Regresiones de interfaz y apilamiento', () => {
  test('la cabecera posee un contexto de apilamiento superior a la sección market-intro', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('.site-header');
    await expect(header).toBeVisible();

    const headerZIndex = await header.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        position: style.position,
        zIndex: style.zIndex,
      };
    });

    expect(headerZIndex.position).toBe('relative');
    expect(parseInt(headerZIndex.zIndex, 10)).toBeGreaterThanOrEqual(40);
  });

  test('las tarjetas de producto cargan imágenes válidas sin quedar vacías ni bloqueadas', async ({ page }) => {
    await page.goto('/?examples=1');

    const productImages = page.locator('.product-image img');
    await expect(productImages.first()).toBeVisible();

    const count = await productImages.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 4); i++) {
      const img = productImages.nth(i);
      await expect(img).toHaveClass(/product-image-loaded/);
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('el panel de notificaciones tiene un z-index adecuado para superponerse', async ({ page }) => {
    await page.goto('/');

    const styles = await page.evaluate(() => {
      const dummyMenu = document.createElement('div');
      dummyMenu.className = 'notification-menu';
      const dummyPanel = document.createElement('section');
      dummyPanel.className = 'notification-panel';
      document.querySelector('.site-header')?.appendChild(dummyMenu);
      dummyMenu.appendChild(dummyPanel);

      const menuZ = window.getComputedStyle(dummyMenu).zIndex;
      const panelZ = window.getComputedStyle(dummyPanel).zIndex;

      dummyMenu.remove();
      return { menuZ, panelZ };
    });

    expect(parseInt(styles.menuZ, 10)).toBeGreaterThanOrEqual(50);
    expect(parseInt(styles.panelZ, 10)).toBeGreaterThanOrEqual(50);
  });
});
