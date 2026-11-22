import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {expect, test, type Frame} from '@playwright/test';
import {products} from './listings';

const stripeUrl = process.env.LAPELA_STRIPE_INTEGRATION_URL;
const sellerState = process.env.LAPELA_STRIPE_SELLER_STATE;
const buyerState = process.env.LAPELA_STRIPE_BUYER_STATE;
const orderEndpoint = '/api/market/order/';

async function enterCard(form: Frame, number: string) {
  await form.locator('input[autocomplete="cc-number"]').fill(number);
  await form.locator('input[autocomplete="cc-exp"]').fill('1234');
  await form.locator('input[autocomplete="cc-csc"]').fill('123');
  await form.locator('input[autocomplete="cc-name"]').fill('Comprador de prueba');
}

test('Stripe sandbox rechaza una tarjeta y acepta el reintento en el mismo pedido', async ({browser}) => {
  test.skip(!stripeUrl && !sellerState && !buyerState, 'Sin piloto de Stripe de prueba configurado.');
  if (!stripeUrl || !sellerState || !buyerState) throw new Error('Falta la URL o una sesión ficticia de Stripe.');
  const app = new URL(stripeUrl);
  if (app.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(app.hostname)) {
    throw new Error('El piloto de Stripe debe estar en loopback.');
  }
  const seller = await browser.newContext({baseURL: app.origin, storageState: sellerState});
  const buyer = await browser.newContext({baseURL: app.origin, storageState: buyerState});
  try {
    const {photo, ...product} = products.radio;
    const image = await readFile(fileURLToPath(new URL(`./fixtures/${photo}`, import.meta.url)));
    const upload = await seller.request.post('/api/market/upload', {
      multipart: {file: {name: photo, mimeType: 'image/jpeg', buffer: image}},
    });
    expect(upload.ok()).toBeTruthy();
    const title = `${product.title} Stripe ${randomUUID().slice(0, 8)}`;
    const published = await seller.request.post('/api/market/publish', {
      data: {...product, title, images: [(await upload.json()).url]},
    });
    expect(published.status()).toBe(201);
    const {id: listing} = await published.json();
    const response = await buyer.request.post(`/api/market/checkout/${listing}`, {data: {}});
    expect(response.ok()).toBeTruthy();
    const url = new URL((await response.json()).url);
    expect(url.origin).toBe('https://checkout.stripe.com');
    expect(url.pathname).toMatch(/\/cs_test_/);

    const page = await buyer.newPage();
    page.setDefaultTimeout(15_000);
    await page.goto(url.href, {waitUntil: 'domcontentloaded', timeout: 25_000});
    await expect(page.getByText(/entorno de prueba|test mode|sandbox/i).first()).toBeVisible();
    const returnLink = page.locator('a[href*="/orders/"]').first();
    const cancelUrl = new URL((await returnLink.getAttribute('href'))!, app);
    expect(cancelUrl.origin).toBe(app.origin);
    expect(cancelUrl.pathname).toMatch(/^\/orders\/[\da-f-]+$/);
    const orderId = cancelUrl.pathname.split('/').at(-1)!;
    // Hosted Checkout can render the payment form in its own Stripe frame.
    let form: Frame | undefined;
    await expect.poll(async () => {
      for (const frame of page.frames()) {
        const origin = new URL(frame.url() || 'about:blank').origin;
        if (origin !== url.origin && origin !== 'https://js.stripe.com') continue;
        if (await frame.locator('input[autocomplete="cc-number"]').count()) {
          form = frame;
          return true;
        }
      }
      return false;
    }).toBe(true);
    const cardForm = form!;
    const pay = cardForm.getByTestId('payment-form-submit-button');
    await enterCard(cardForm, '4000000000000002');
    await pay.click();
    await expect(cardForm.getByText(/tarjeta.*rechazad|card.*declined/i).first()).toBeVisible();
    const pending = await buyer.request.get(orderEndpoint + orderId);
    expect((await pending.json()).order.status).toBe('pending_payment');

    await enterCard(cardForm, '4242424242424242');
    await pay.click();
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}\\?payment=received`), {timeout: 35_000});
    await expect.poll(async () => {
      const r = await buyer.request.get(orderEndpoint + orderId);
      return (await r.json()).order.status;
    }).toBe('paid');
    const paid = await seller.request.get(orderEndpoint + orderId);
    expect((await paid.json()).order).toMatchObject({status: 'paid', amount_cents: 2500});
    const item = await buyer.request.get(`/api/market/listing/${listing}`);
    expect((await item.json()).status).toBe('sold');
  } finally {
    await Promise.allSettled([seller.close(), buyer.close()]);
  }
});
