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

test('registro, confirmación y recuperación de contraseña por correo', async ({browser, request}) => {
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

    const recoveryContext = await browser.newContext({baseURL: app});
    try {
      const recovery = await recoveryContext.newPage();
      await recovery.goto('/login');
      await recovery.getByRole('button', {name:'¿Has olvidado tu contraseña?'}).click();
      await recovery.getByLabel('Email', {exact:true}).fill(email);
      await recovery.getByRole('button', {name:'Enviar enlace de recuperación'}).click();
      await expect(recovery.getByRole('status')).toContainText('enlace para cambiar la contraseña');
      let recoveryMessage: string | undefined;
      await expect.poll(async ()=>{
        const response=await request.get(mail+'/api/v1/messages');
        if(!response.ok())return false;
        const {messages}=await response.json() as {messages:{ID:string;To:{Address:string}[]}[]};
        recoveryMessage=messages.find(item=>item.ID!==messageId&&item.To.some(to=>to.Address===email))?.ID;
        return Boolean(recoveryMessage);
      }).toBe(true);
      const recoveryMail=await request.get(`${mail}/api/v1/message/${recoveryMessage}`);
      const recoveryHtml=(await recoveryMail.json() as {HTML:string}).HTML;
      const recoveryLink=recoveryHtml.match(/href="([^"\s]*\/auth\/v1\/verify[^"\s]*)"/)?.[1];
      if(!recoveryLink)throw new Error('Falta el enlace de recuperación.');
      const recoveryUrl=new URL(recoveryLink.replaceAll('&amp;','&'));
      expect(recoveryUrl.origin).toBe(database);
      expect(recoveryUrl.searchParams.get('type')).toBe('recovery');
      expect(recoveryUrl.searchParams.get('redirect_to')).toBe(app+'/reset-password');
      await recovery.goto(recoveryUrl.href);
      await expect(recovery).toHaveURL(/\/reset-password/);
      const changedPassword=`LaPela-${randomUUID()}!`;
      await recovery.getByLabel('Nueva contraseña',{exact:true}).fill(changedPassword);
      await recovery.getByLabel('Repite la contraseña',{exact:true}).fill(changedPassword);
      await recovery.getByRole('button',{name:'Guardar contraseña'}).click();
      await expect(recovery.getByRole('status')).toContainText('Contraseña actualizada');
      await recovery.getByRole('link',{name:'Ir a iniciar sesión'}).click();
      await recovery.getByLabel('Email',{exact:true}).fill(email);
      await recovery.getByLabel('Contraseña',{exact:true}).fill(changedPassword);
      await recovery.getByRole('button',{name:'Entrar',exact:true}).click();
      await expect(recovery.getByRole('link',{name:'Mi cuenta',exact:true})).toBeVisible();
    } finally { await recoveryContext.close(); }
  } finally { await context.close(); }
});
