import {randomUUID} from 'node:crypto';
import {expect, test} from '@playwright/test';

function localOrigin(value: string | undefined) {
  if (!value) throw new Error('Falta una URL del entorno local.');
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    throw new Error('La prueba de registro solo admite servicios de loopback.');
  }
  return url.origin;
}

test('registro público, confirmación por correo e inicio de sesión', async ({browser, request}) => {
  test.skip(!process.env.LAPELA_INTEGRATION_MAIL_URL, 'Sin buzón local configurado.');
  const app = localOrigin(process.env.LAPELA_INTEGRATION_URL);
  const database = localOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const mail = localOrigin(process.env.LAPELA_INTEGRATION_MAIL_URL);
  const email = `registro-${randomUUID().slice(0, 10)}@example.com`;
  const password = `LaPela-${randomUUID()}!`;
  const context = await browser.newContext({baseURL: app});
  try {
    const page = await context.newPage();
    await page.goto('/register');
    await page.getByLabel('Email', {exact: true}).fill(email);
    await page.getByLabel('Contraseña', {exact: true}).fill(password);
    await page.getByLabel('Confirmar Contraseña', {exact: true}).fill(password);
    await page.getByRole('button', {name: 'Registrarse'}).click();
    await expect(page.getByText(/revisa tu correo para confirmar tu cuenta/i)).toBeVisible();
    let messageId: string | undefined;
    await expect.poll(async () => {
      const response = await request.get(mail + '/api/v1/messages');
      if (!response.ok()) return false;
      const {messages} = await response.json() as {messages: {ID: string; To: {Address: string}[]}[]};
      messageId = messages.find(message => message.To.some(to => to.Address === email))?.ID;
      return Boolean(messageId);
    }).toBe(true);
    const message = await request.get(`${mail}/api/v1/message/${messageId}`);
    expect(message.ok()).toBeTruthy();
    const {HTML} = await message.json() as {HTML: string};
    const link = HTML.match(/href="([^"]*\/auth\/v1\/verify[^"\s]*)"/)?.[1];
    if (!link) throw new Error('Falta el enlace de confirmación en el correo.');
    const verification = new URL(link.replaceAll('&amp;', '&'));
    expect(verification.origin).toBe(database);
    const confirmation = await request.get(verification.href, {maxRedirects: 0});
    expect(confirmation.status()).toBe(303);
    expect(confirmation.headers().location).not.toMatch(/error_code=/);

    await page.goto('/login');
    await page.getByLabel('Email', {exact: true}).fill(email);
    await page.getByLabel('Contraseña', {exact: true}).fill(password);
    await page.getByRole('button', {name: 'Entrar', exact: true}).click();
    await expect(page.getByRole('link', {name: 'Mi cuenta', exact: true})).toBeVisible();
  } finally { await context.close(); }
});
