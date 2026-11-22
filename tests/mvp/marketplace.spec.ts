import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { extractIdFromSlug } from '../../src/lib/slugs';

const database = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function confirmationEmail(email: string) {
  const mailUrl = process.env.LAPELA_MVP_MAIL_URL!;
  let messageId: string | undefined;
  await expect.poll(async () => {
    const response = await fetch(`${mailUrl}/api/v1/messages`);
    expect(response.ok).toBeTruthy();
    const { messages } = await response.json() as {
      messages: { ID: string; To: { Address: string }[] }[];
    };
    messageId = messages.find(message => message.To.some(address => address.Address === email))?.ID;
    return Boolean(messageId);
  }).toBe(true);
  const response = await fetch(`${mailUrl}/api/v1/message/${messageId}`);
  expect(response.ok).toBeTruthy();
  const { HTML } = await response.json() as { HTML: string };
  const encoded = HTML.match(/href="([^"]*\/auth\/v1\/verify[^"\s]*)"/)?.[1];
  if (!encoded) throw new Error('El correo de prueba no contiene un enlace de confirmación.');
  const url = new URL(encoded.replaceAll('&amp;', '&'));
  expect(url.origin).toBe(process.env.NEXT_PUBLIC_SUPABASE_URL);
  return url.toString();
}

async function register(page: Page, email: string) {
  const password = `Pela-${randomUUID()}!`;
  await page.goto('/register');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByLabel('Confirmar Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Registrarse' }).click();
  await expect(page.getByText(/revisa tu correo para confirmar tu cuenta/i)).toBeVisible();
  await page.goto(await confirmationEmail(email));
  const login = await page.context().browser()!.newContext();
  try {
    const loginPage = await login.newPage();
    await loginPage.goto(new URL('/login', page.url()).toString());
    await loginPage.getByLabel('Email', { exact: true }).fill(email);
    await loginPage.getByLabel('Contraseña', { exact: true }).fill(password);
    await loginPage.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(loginPage.getByRole('link', { name: 'Mi cuenta', exact: true })).toBeVisible();
    await page.context().addCookies(await login.cookies());
  } finally {
    await login.close();
  }
}

async function publish(page: Page, title: string, mode: 'sale' | 'auction' = 'sale') {
  await page.goto('/publish-ad');
  await page.getByLabel('Título', { exact: true }).fill(title);
  await page.getByLabel('Descripción y defectos').fill('Objeto de segunda mano en buen estado, conservado en su caja original.');
  await page.getByLabel('Ciudad', { exact: true }).fill('Madrid');
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 60;
    const drawing = canvas.getContext('2d')!;
    drawing.fillStyle = '#274235';
    drawing.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Fotos del artículo').setInputFiles({
    name: 'prueba.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64'),
  });
  await expect(page.getByRole('img', { name: 'Foto 1' })).toBeVisible();
  if (mode === 'auction') {
    await page.getByRole('radio', { name: /subasta/i }).check();
    const closing = new Date(Date.now() + 2 * 60 * 60_000);
    const localTime = new Date(closing.getTime() - closing.getTimezoneOffset() * 60_000);
    await page.getByLabel('Fecha y hora de cierre').fill(localTime.toISOString().slice(0, 16));
  }
  await page.getByLabel(mode === 'auction' ? 'Precio de salida (€)' : 'Precio (€)', { exact: true }).fill('25');
  await page.getByRole('checkbox', { name: /confirmo que las fotos/i }).check();
  await page.getByRole('button', { name: 'Publicar artículo' }).click();
  await expect(page).toHaveURL(/\/articulos\//);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  const path = new URL(page.url()).pathname;
  const id = extractIdFromSlug(path.split('/').at(-1)!);
  if (!id) throw new Error(`No se encontró el identificador del anuncio en ${path}.`);
  return { id, path };
}

async function reserve(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: /^Comprar ahora/ }).click();
  await page.getByRole('button', { name: 'Confirmar y reservar' }).click();
  await expect(page).toHaveURL(/\/orders\//);
  await expect(page.getByRole('heading', { name: 'Pendiente de pago' })).toBeVisible();
  return new URL(page.url()).pathname.split('/').at(-1)!;
}

test('compra directa y cierre de subasta con dos cuentas confirmadas', async ({ baseURL, browser, request }) => {
  const seller = await browser.newContext({ baseURL });
  const buyer = await browser.newContext({ baseURL });
  const sellerPage = await seller.newPage();
  const buyerPage = await buyer.newPage();
  const run = randomUUID().slice(0, 8);
  try {
    await test.step('Registrar y confirmar dos cuentas', async () => {
      await register(sellerPage, `vendedor-${run}@example.com`);
      await register(buyerPage, `comprador-${run}@example.com`);
    });

    await test.step('Publicar, buscar, reservar, pagar y recibir', async () => {
      const title = `Bicicleta urbana ${run}`;
      const item = await publish(sellerPage, title);
      await buyerPage.goto(`/search?q=${encodeURIComponent(title)}`);
      await expect(buyerPage.getByRole('link', { name: title, exact: true }).first()).toBeVisible();
      await buyerPage.getByRole('spinbutton', { name: 'Precio máximo' }).fill('20');
      await expect(buyerPage.getByRole('heading', { name: 'Aún no hay artículos aquí' })).toBeVisible();
      await buyerPage.getByRole('spinbutton', { name: 'Precio máximo' }).clear();
      await expect(buyerPage.getByRole('link', { name: title, exact: true }).first()).toBeVisible();
      const order = await reserve(buyerPage, item.path);
      await buyerPage.getByLabel('Mensaje sobre la entrega o pago').fill('Puedo recoger la bicicleta el martes.');
      await buyerPage.getByRole('button', { name: 'Enviar mensaje' }).click();
      await sellerPage.goto(`/orders/${order}`);
      await expect(sellerPage.getByText('Puedo recoger la bicicleta el martes.')).toBeVisible();
      await buyerPage.getByRole('button', { name: 'Simular pago por plataforma' }).click();
      await buyerPage.getByRole('button', { name: 'Confirmar simulación' }).click();
      await expect(buyerPage.getByRole('heading', { name: 'Pago confirmado' })).toBeVisible();
      await sellerPage.reload();
      await sellerPage.getByLabel('Detalle de entrega').fill('Entrega preparada para el martes');
      await sellerPage.getByRole('button', { name: 'Marcar entrega preparada' }).click();
      await expect(sellerPage.getByRole('heading', { name: 'Enviado' })).toBeVisible();
      await buyerPage.reload();
      buyerPage.once('dialog', dialog => dialog.accept());
      await buyerPage.getByRole('button', { name: 'Confirmar recepción' }).click();
      await expect(buyerPage.getByRole('heading', { name: 'Entrega completada' })).toBeVisible();
      const stored = await database.from('lp_orders').select('status,payment_mode').eq('id', order).single();
      expect(stored.error).toBeNull();
      expect(stored.data).toEqual({ status: 'completed', payment_mode: 'simulation' });
    });

    await test.step('Pujar, cerrar la subasta y liberar una reserva vencida', async () => {
      const auction = await publish(sellerPage, `Radio portátil ${run}`, 'auction');
      await buyerPage.goto(auction.path);
      await buyerPage.getByRole('button', { name: 'Revisar puja' }).click();
      await buyerPage.getByRole('button', { name: 'Confirmar puja', exact: true }).click();
      await expect(buyerPage.getByText(/tu puja se ha registrado/i)).toBeVisible();

      const reserved = await publish(sellerPage, `Mesa auxiliar ${run}`);
      const expiredOrder = await reserve(buyerPage, reserved.path);
      const bid = await database.from('lp_bids').select('bidder_id').eq('listing_id', auction.id).single();
      expect(bid.error).toBeNull();
      const past = new Date(Date.now() - 60_000).toISOString();
      const closing = await database.from('lp_listings').update({ ends_at: past }).eq('id', auction.id);
      const expiration = await database.from('lp_orders').update({ expires_at: past }).eq('id', expiredOrder);
      expect(closing.error).toBeNull();
      expect(expiration.error).toBeNull();

      expect((await request.post('/api/cron/maintain')).status()).toBe(401);
      const runMaintenance = () => request.post('/api/cron/maintain', {
        headers: { Authorization: `Bearer ${process.env.LAPELA_MVP_CRON_SECRET}` },
      });
      const first = await runMaintenance();
      const result = await first.json();
      expect(first.status(), JSON.stringify(result)).toBe(200);
      expect(result).toMatchObject({ ok: true, closedAuctions: 1, expiredOrders: 1 });
      const second = await runMaintenance();
      expect(second.ok()).toBeTruthy();
      expect(await second.json()).toMatchObject({ ok: true, closedAuctions: 0, expiredOrders: 0 });

      const winner = await database.from('lp_orders').select('id,buyer_id,status').eq('listing_id', auction.id).single();
      expect(winner.error).toBeNull();
      expect(winner.data).toMatchObject({ buyer_id: bid.data!.bidder_id, status: 'pending_payment' });
      const released = await database.from('lp_listings').select('status').eq('id', reserved.id).single();
      expect(released.error).toBeNull();
      expect(released.data?.status).toBe('available');
      const cancelled = await database.from('lp_orders').select('status').eq('id', expiredOrder).single();
      expect(cancelled.error).toBeNull();
      expect(cancelled.data?.status).toBe('cancelled');

      const notifications = await database.from('lp_notifications').select('type')
        .in('order_id', [winner.data!.id, expiredOrder])
        .in('type', ['auction_sold', 'auction_won', 'reservation_expired']);
      expect(notifications.error).toBeNull();
      expect(notifications.data?.map(notification => notification.type).sort()).toEqual([
        'auction_sold', 'auction_won', 'reservation_expired', 'reservation_expired',
      ]);
      await buyerPage.goto(`/orders/${winner.data!.id}`);
      await expect(buyerPage.getByRole('heading', { name: 'Pendiente de pago' })).toBeVisible();
      await buyerPage.getByRole('button', { name: 'Simular pago por plataforma' }).click();
      await buyerPage.getByRole('button', { name: 'Confirmar simulación' }).click();
      await expect(buyerPage.getByRole('heading', { name: 'Pago confirmado' })).toBeVisible();
    });
  } finally {
    await seller.close();
    await buyer.close();
  }
});
