import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {expect, test, type APIResponse, type BrowserContext} from '@playwright/test';
import {products} from './listings';

type Actor = {context: BrowserContext};
type Listing = {id: string; title: string};
type Product = (typeof products)[keyof typeof products];
type Order = {id: string; status: string; amount_cents: number; payment_mode: string | null};
type Notice = {id: string; type: string; listing_id: string; order_id: string | null};

const run = randomUUID().replaceAll('-', '').slice(0, 10);
const market = '/api/market/';
let admin: SupabaseClient;
let seller: Actor;
let secondSeller: Actor;
let buyer: Actor;
let rival: Actor;
let observer: Actor;
let visitor: Actor;
const contexts: BrowserContext[] = [];

function loopback(value: string | undefined, name: string) {
  if (!value) throw new Error(`Falta ${name}.`);
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    throw new Error(`${name} debe apuntar a un entorno local de pruebas.`);
  }
  return url.origin;
}

async function json<T>(response: APIResponse, status = 200): Promise<T> {
  const body = await response.text();
  expect(response.status(), `${response.url()} → ${body.slice(0, 420)}`).toBe(status);
  return JSON.parse(body) as T;
}

function get(actor: Actor, path: string) {
  return actor.context.request.get(market + path);
}

function post(actor: Actor, path: string, data: object = {}) {
  return actor.context.request.post(market + path, {data});
}

async function denied(response: APIResponse, message?: RegExp, status = 400) {
  const {error} = await json<{error: string}>(response, status);
  if (message) expect(error).toMatch(message);
}

async function photo(actor: Actor, name: string) {
  const file = fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
  const response = await actor.context.request.post(market + 'upload', {
    multipart: {file: {name, mimeType: 'image/jpeg', buffer: await readFile(file)}},
  });
  return (await json<{url: string}>(response)).url;
}

async function listingDraft(actor: Actor, product: Product, label: string) {
  const {photo: filename, ...fields} = product;
  return {
    ...fields, title: `${product.title} ${label} ${run}`,
    images: [await photo(actor, filename)],
    ends_at: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
  };
}

async function publish(actor: Actor, product: Product, label: string, overrides: object = {}) {
  const draft = {...await listingDraft(actor, product, label), ...overrides};
  const {id} = await json<{id: string}>(await post(actor, 'publish', draft), 201);
  return {id, title: draft.title};
}

async function detail(actor: Actor, listing: Listing) {
  return json<{status: string; slug: string; story: string | null; environment?: string; simulated: boolean;
    bid_count: number; price_cents: number; isHighestBidder: boolean; favoritesCount: number}>(
    await get(actor, `listing/${listing.id}`),
  );
}

async function reserve(actor: Actor, listing: Listing) {
  const {url} = await json<{url: string}>(await post(actor, `checkout/${listing.id}`));
  expect(url).toMatch(/^\/orders\/[\da-f-]+$/);
  return url.split('/').at(-1)!;
}

async function order(actor: Actor, id: string) {
  return json<{order: Order; messages: {content: string}[]; reviews: {score: number}[]; canReview: boolean}>(
    await get(actor, `order/${id}`),
  );
}

async function notifications(actor: Actor) {
  return (await json<{notifications: Notice[]}>(await get(actor, 'notifications'))).notifications;
}

async function expireFixtures(table: 'lp_listings' | 'lp_orders', ids: string[]) {
  const column = table === 'lp_orders' ? 'expires_at' : 'ends_at';
  const {data, error} = await admin.from(table)
    .update({[column]: new Date(Date.now() - 60_000).toISOString()}).in('id', ids).select('id');
  expect(error?.message).toBeUndefined();
  expect(data?.map(row => row.id).sort()).toEqual([...ids].sort());
}

test.beforeAll(async ({browser}) => {
  const baseURL = loopback(process.env.LAPELA_INTEGRATION_URL, 'LAPELA_INTEGRATION_URL');
  const database = loopback(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
  expect(process.env.LAPELA_PAYMENTS_MODE).toBe('simulated');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY para las cuentas de prueba.');
  admin = createClient(database, key, {auth: {persistSession: false, autoRefreshToken: false}});

  async function makeActor(role?: string): Promise<Actor> {
    const context = await browser.newContext({baseURL});
    contexts.push(context);
    if (!role) return {context};
    const email = `${role}-${run}@example.com`;
    const password = `LaPela-${randomUUID()}!`;
    const {error} = await admin.auth.admin.createUser({email, password, email_confirm: true});
    expect(error?.message).toBeUndefined();
    const page = await context.newPage();
    try {
      await page.goto('/login');
      await page.getByLabel('Email', {exact: true}).fill(email);
      await page.getByLabel('Contraseña', {exact: true}).fill(password);
      await page.getByRole('button', {name: 'Entrar', exact: true}).click();
      await expect(page.getByRole('link', {name: 'Mi cuenta', exact: true})).toBeVisible();
      await json(await post({context}, 'profile', {alias: `${role}-${run}`}));
    } finally { await page.close(); }
    return {context};
  }

  [seller, secondSeller, buyer, rival, observer, visitor] = await Promise.all([
    makeActor('vendedora'), makeActor('vendedor'), makeActor('compradora'),
    makeActor('pujador'), makeActor('observadora'), makeActor(),
  ]);
  // The server's behavior is checked before commercial fixtures are created.
  await denied(await post(seller, 'onboard'), /modo de prueba/i);
});

test.afterAll(async () => {
  await Promise.all(contexts.map(context => context.close()));
});

test('publicación, fotos, catálogo y ficha desde una visita móvil', async () => {
  const radio = await publish(seller, products.radio, 'catálogo');
  const lamp = await publish(secondSeller, products.lamp, 'catálogo');
  const found = await detail(visitor, radio);
  expect(found).toMatchObject({status: 'available', simulated: true, story: products.radio.story});
  expect((await detail(visitor, lamp)).story).toBeNull();
  const page = await visitor.context.newPage();
  await page.setViewportSize({width: 390, height: 844});
  try {
    await page.goto('/search?q=' + encodeURIComponent(radio.title));
    await expect(page.getByRole('link', {name: radio.title, exact: true}).first()).toBeVisible();
    await page.goto('/articulos/' + found.slug);
    await expect(page.getByRole('heading', {name: radio.title, exact: true})).toBeVisible();
    await expect(page.getByText(products.radio.story, {exact: true})).toBeVisible();
    const image = page.getByRole('img', {name: radio.title, exact: true}).first();
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  } finally { await page.close(); }
});

test('validación de contacto, formato, precio, fotos y fechas', async () => {
  const draft = await listingDraft(seller, products.rover, 'validación');
  const cases = [
    [{description: 'Descripción suficiente con contacto ejemplo@example.com'}, /datos de contacto/i],
    [{story: 'Acepto pago por Bizum fuera de la plataforma.'}, /métodos de pago externos/i],
    [{price: 0.99}, /importe/i],
    [{price: 12.345}, /dos decimales/i],
    [{category: 'Instrumentos'}, /categoría/i],
    [{images: []}, /fotos/i],
    [{images: Array(7).fill(draft.images[0])}, /fotos/i],
    [{buy_now: 20}, /superar el precio/i],
    [{ends_at: new Date().toISOString()}, /una hora/i],
  ] as const;
  for (const [overrides, error] of cases) {
    await denied(await post(seller, 'publish', {...draft, ...overrides}), error);
  }
  const fakeUpload = await seller.context.request.post(market + 'upload', {multipart: {
    file: {name: 'archivo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('texto disfrazado')},
  }});
  await denied(fakeUpload, /imagen válida/i);
  await denied(await post(visitor, 'publish', draft), /inicia sesión/i, 401);
  await denied(await post(secondSeller, 'publish', draft), /fotos/i);
});

test('preguntas, favoritos, avisos y retirada del anuncio', async () => {
  const lamp = await publish(secondSeller, products.lamp, 'preguntas');
  await denied(await post(buyer, `question/${lamp.id}`, {question: '¿Te doy veinte euros?'}), /no es negociable/i);
  const question = await json<{id: string}>(await post(buyer, `question/${lamp.id}`, {
    question: '¿La pantalla se puede desmontar para limpiarla?',
  }), 201);
  await denied(await post(observer, `answer/${question.id}`, {answer: 'Sí, con una arandela.'}));
  await json(await post(secondSeller, `answer/${question.id}`, {answer: 'Sí, tiene una arandela roscada.'}));
  const visible = await json<{questions: {id: string; answer: string; buyer_id?: string}[]}>(
    await get(visitor, `questions/${lamp.id}`),
  );
  expect(visible.questions[0]).toMatchObject({id: question.id, answer: 'Sí, tiene una arandela roscada.'});
  expect(visible.questions[0]).not.toHaveProperty('buyer_id');

  await json(await post(buyer, `favorite/${lamp.id}`, {active: true}));
  await json(await post(observer, `favorite/${lamp.id}`, {active: true}));
  expect((await detail(secondSeller, lamp)).favoritesCount).toBe(2);
  const personalFavorites = await json<{favorites: {id: string}[]}>(await get(buyer, 'favorites'));
  expect(personalFavorites.favorites.map(item => item.id)).toContain(lamp.id);
  await json(await post(observer, `favorite/${lamp.id}`, {active: false}));
  expect((await detail(secondSeller, lamp)).favoritesCount).toBe(1);
  await denied(await post(buyer, `withdraw/${lamp.id}`), /solo puedes retirar/i);
  await json(await post(secondSeller, `withdraw/${lamp.id}`));
  expect((await detail(visitor, lamp)).status).toBe('withdrawn');
});

test('dos compradores compiten por una reserva y solo gana uno', async () => {
  const radio = await publish(seller, products.radio, 'concurrencia');
  await denied(await post(seller, `checkout/${radio.id}`), /tu artículo/i);
  const results = await Promise.all([buyer, rival].map(async actor => ({
    actor, response: await post(actor, `checkout/${radio.id}`),
  })));
  expect(results.map(item => item.response.status()).sort()).toEqual([200, 400]);
  const winner = results.find(item => item.response.ok())!;
  const {url} = await json<{url: string}>(winner.response);
  const id = url.split('/').at(-1)!;
  const loser = results.find(item => !item.response.ok())!;
  await denied(loser.response, /ya no está disponible/i);
  expect(await reserve(winner.actor, radio)).toBe(id);
  expect((await order(seller, id)).order.status).toBe('pending_payment');
  await denied(await get(loser.actor, `order/${id}`), /no encontrado/i, 404);
  await denied(await post(observer, `message/${id}`, {content: 'Mensaje ajeno al pedido'}), /solo entre las partes/i);
  await denied(await post(winner.actor, `pay-in-person/${id}`), /solo el vendedor/i);
  expect((await json<Order>(await post(seller, `pay-in-person/${id}`)))).toMatchObject({
    status: 'completed', payment_mode: 'in_person', amount_cents: 2500,
  });
  expect((await detail(visitor, radio)).status).toBe('sold');
});

test('envío, notificaciones, conversación, pago idempotente y dos valoraciones', async () => {
  const lamp = await publish(secondSeller, products.lamp, 'envío');
  const id = await reserve(buyer, lamp);
  expect((await order(buyer, id)).order.amount_cents).toBe(4575);
  await denied(await post(buyer, `review/${id}`, {score: 5}), /pedido completado/i);
  await denied(await post(secondSeller, `simulate-payment/${id}`), /no puedes confirmar/i);
  const content = 'Prepararé el paquete en una caja reforzada.';
  await json(await post(secondSeller, `message/${id}`, {content}), 201);
  expect(await notifications(buyer)).toEqual(expect.arrayContaining([expect.objectContaining({
    type: 'new_message', order_id: id,
  })]));
  expect((await order(buyer, id)).messages).toEqual(expect.arrayContaining([expect.objectContaining({content})]));
  for (let attempt = 0; attempt < 2; attempt++) {
    expect(await json<Order>(await post(buyer, `simulate-payment/${id}`))).toMatchObject({status: 'paid'});
  }
  const paymentNotices = (await notifications(secondSeller)).filter(n => n.order_id === id && n.type === 'payment_confirmed');
  expect(paymentNotices).toHaveLength(1);
  await denied(await post(buyer, `ship/${id}`, {tracking: 'DEMO0001'}));
  expect(await json<Order>(await post(secondSeller, `ship/${id}`, {tracking: 'DEMO0001'}))).toMatchObject({status: 'shipped'});
  await denied(await post(secondSeller, `complete/${id}`));
  expect(await json<Order>(await post(buyer, `complete/${id}`))).toMatchObject({status: 'completed'});
  await json(await post(buyer, `review/${id}`, {score: 5, comment: 'Llegó en buen estado.'}), 201);
  await json(await post(secondSeller, `review/${id}`, {score: 4, comment: 'Coordinación sencilla.'}), 201);
  await denied(await post(buyer, `review/${id}`, {score: 3}));
  await denied(await post(observer, `review/${id}`, {score: 5}));
  expect((await order(buyer, id)).reviews.map(review => review.score)).toEqual([5, 4]);
});

test('escalada de pujas, sobrepuja, cierre y adjudicación al ganador', async () => {
  const backpack = await publish(seller, products.backpack, 'pujas');
  const noBids = await publish(secondSeller, products.rover, 'sin pujas');
  await denied(await post(seller, `bid/${backpack.id}`, {amount: 18}), /tu subasta/i);
  await denied(await post(buyer, `bid/${backpack.id}`, {amount: 17}), /mínimo/i);
  await denied(await post(buyer, `checkout/${backpack.id}`), /solo se adjudica por subasta/i);
  await json(await post(buyer, `bid/${backpack.id}`, {amount: 18}));
  await denied(await post(rival, `bid/${backpack.id}`, {amount: 18.5}), /mínimo/i);
  await json(await post(rival, `bid/${backpack.id}`, {amount: 21}));
  expect((await detail(rival, backpack))).toMatchObject({price_cents: 2100, bid_count: 2, isHighestBidder: true});
  expect(await notifications(buyer)).toEqual(expect.arrayContaining([
    expect.objectContaining({type: 'outbid', listing_id: backpack.id}),
  ]));
  await denied(await post(seller, `withdraw/${backpack.id}`), /sin pujas/i);

  await expireFixtures('lp_listings', [backpack.id, noBids.id]);
  await json(await get(rival, 'activity')); // Runs the regular maintenance path.
  expect((await detail(visitor, noBids)).status).toBe('expired');
  expect((await detail(visitor, backpack)).status).toBe('reserved');
  await denied(await post(buyer, `bid/${backpack.id}`, {amount: 25}), /cerrada/i);
  const won = (await notifications(rival)).find(n => n.type === 'auction_won' && n.listing_id === backpack.id);
  expect(won?.order_id).toBeTruthy();
  const id = won!.order_id!;
  expect((await order(rival, id)).order).toMatchObject({amount_cents: 2500, status: 'pending_payment'});
  await denied(await get(buyer, `order/${id}`), /no encontrado/i, 404);
  expect(await json<Order>(await post(rival, `simulate-payment/${id}`))).toMatchObject({status: 'paid'});
});

test('compra inmediata de subasta después de pujas', async () => {
  const rover = await publish(secondSeller, products.rover, 'compra inmediata');
  await json(await post(buyer, `bid/${rover.id}`, {amount: 24}));
  await denied(await post(rival, `bid/${rover.id}`, {amount: 55}), /comprar ahora/i);
  const id = await reserve(rival, rover);
  expect((await order(rival, id)).order.amount_cents).toBe(5500);
  await denied(await post(buyer, `bid/${rover.id}`, {amount: 30}), /cerrada/i);
  await json(await post(rival, `simulate-payment/${id}`));
  expect((await detail(visitor, rover)).status).toBe('sold');
});

test('una reserva caducada se libera y otro comprador puede adquirirla', async () => {
  const radio = await publish(seller, products.radio, 'caducidad');
  const expiredId = await reserve(buyer, radio);
  await expireFixtures('lp_orders', [expiredId]);
  await json(await get(observer, 'activity'));
  expect((await detail(visitor, radio)).status).toBe('available');
  await denied(await post(buyer, `simulate-payment/${expiredId}`), /ya no admite pagos/i);
  const replacementId = await reserve(rival, radio);
  expect(replacementId).not.toBe(expiredId);
  await json(await post(rival, `simulate-payment/${replacementId}`));
  expect((await detail(visitor, radio)).status).toBe('sold');
});

test('dos pujas iguales en el último minuto provocan una sola prórroga', async () => {
  const backpack = await publish(seller, products.backpack, 'prórroga');
  const oldEnd = new Date(Date.now() + 60_000).toISOString();
  const {error} = await admin.from('lp_listings').update({ends_at: oldEnd}).eq('id', backpack.id);
  expect(error?.message).toBeUndefined();
  const responses = await Promise.all([buyer, rival].map(actor => post(actor, `bid/${backpack.id}`, {amount: 18})));
  expect(responses.map(response => response.status()).sort()).toEqual([200, 400]);
  const accepted = await json<{ends_at: string; bid_count: number; price_cents: number}>(
    responses.find(response => response.ok())!,
  );
  expect(accepted).toMatchObject({bid_count: 1, price_cents: 1800});
  expect(Date.parse(accepted.ends_at) - Date.parse(oldEnd)).toBeGreaterThan(50_000);
  await denied(responses.find(response => !response.ok())!, /mínimo/i);
  const notes = (await notifications(seller)).filter(note => note.listing_id === backpack.id && note.type === 'bid_received');
  expect(notes).toHaveLength(1);
});

test('cada cuenta gestiona sus avisos y su alias público por separado', async () => {
  const radio = await publish(secondSeller, products.radio, 'avisos');
  const id = await reserve(buyer, radio);
  const incoming = (await notifications(secondSeller)).find(n => n.order_id === id && n.type === 'order_created');
  expect(incoming).toBeDefined();
  await json(await post(observer, `mark-notification-read/${incoming!.id}`));
  expect(await notifications(secondSeller)).toContainEqual(incoming);
  await json(await post(secondSeller, `mark-notification-read/${incoming!.id}`));
  expect(await notifications(secondSeller)).not.toContainEqual(incoming);
  await denied(await post(observer, 'profile', {alias: `compradora-${run}`}), /alias/i);
  await json(await post(secondSeller, `pay-in-person/${id}`));
  const profilePath = `profile/compradora-${run}`;
  const publicProfile = await json<{profile: {alias: string; showPurchases: boolean}; purchases: Listing[]}>(
    await get(visitor, profilePath),
  );
  expect(publicProfile.profile).toEqual(expect.objectContaining({alias: `compradora-${run}`, showPurchases: false}));
  expect(publicProfile.profile).not.toHaveProperty('email');
  expect(publicProfile.purchases).toEqual([]);
  await json(await post(buyer, 'profile', {alias: `compradora-${run}`, showPurchases: true}));
  const optedIn = await json<{purchases: Listing[]}>(await get(visitor, profilePath));
  expect(optedIn.purchases.map(item => item.id)).toContain(radio.id);
});

test('los filtros de categoría, ciudad y precio se aplican juntos', async () => {
  const coat = await publish(seller, products.coat, 'filtro exacto');
  const expensive = await publish(secondSeller, products.coat, 'precio alto', {price: 48});
  const away = await publish(secondSeller, products.coat, 'otra ciudad', {location: 'Málaga'});
  const plane = await publish(seller, products.plane, 'historia');
  const params = new URLSearchParams({category: 'Moda', location: 'Zaragoza', minPrice: '27', maxPrice: '30', mode: 'sale'});
  const response = await visitor.context.request.get('/api/products?' + params);
  const {products: filtered} = await json<{products: {id: string}[]}>(response);
  const ids = filtered.map(item => item.id);
  expect(ids).toContain(coat.id);
  for (const excluded of [expensive, away, plane]) expect(ids).not.toContain(excluded.id);
  expect((await detail(visitor, plane)).story).toBe(products.plane.story);
  await denied(await post(observer, `remove-story/${plane.id}`));
  await json(await post(seller, `remove-story/${plane.id}`));
  expect((await detail(visitor, plane))).toMatchObject({status: 'available', story: null});
});

test('los avisos de pedido llegan una sola vez a la parte correspondiente', async () => {
  const lamp = await publish(seller, products.lamp, 'avisos de pedido');
  const id = await reserve(buyer, lamp);
  expect(await reserve(buyer, lamp)).toBe(id);

  const sent = await post(seller, `message/${id}`, {content: 'Confirmo que el embalaje está preparado.'});
  await json(sent, 201);
  const payments = await Promise.all([buyer, buyer, buyer].map(actor => post(actor, `simulate-payment/${id}`)));
  for (const response of payments) {
    expect(await json<Order>(response)).toMatchObject({status: 'paid'});
  }
  await json(await post(seller, `ship/${id}`, {tracking: 'PAQUETE-DEMO'}));
  await json(await post(buyer, `complete/${id}`));

  const types = async (actor: Actor) => (await notifications(actor)).filter(n => n.order_id === id)
    .map(n => n.type).sort();
  expect(await types(seller)).toEqual(['order_created', 'payment_confirmed', 'status_changed']);
  expect(await types(buyer)).toEqual(['new_message', 'status_changed']);
  expect(await types(observer)).toEqual([]);
  await order(buyer, id);
  expect(await types(buyer)).toEqual([]);
  expect(await types(seller)).toEqual(['order_created', 'payment_confirmed', 'status_changed']);

  const page = await seller.context.newPage();
  try {
    await page.goto('/');
    await page.getByRole('button', {name: /^\d+ novedades sin leer$/}).click();
    const panel = page.getByRole('region', {name: 'Novedades'});
    const shipmentNotice = panel.getByRole('listitem').filter({hasText: lamp.title}).filter({hasText: 'Pago confirmado'});
    await expect(shipmentNotice).toBeVisible();
    await expect(shipmentNotice.getByRole('link', {name: 'Ver pedido'})).toHaveAttribute('href', `/orders/${id}`);
    await panel.getByRole('button', {name: 'Marcar todas como vistas'}).click();
    await expect(panel.getByText('No tienes novedades pendientes.')).toBeVisible();
    await expect(page.getByRole('button', {name: 'No tienes novedades sin leer'})).toBeVisible();
  } finally { await page.close(); }

  await json(await post(seller, 'mark-all-notifications-read'));
  expect(await types(seller)).toEqual([]);
  const {data, error} = await admin.from('lp_notifications').select('read,read_at').eq('order_id', id);
  expect(error?.message).toBeUndefined();
  expect(data).toHaveLength(5);
  for (const notice of data!) expect(notice).toEqual({read: true, read_at: expect.any(String)});
});

test('el mantenimiento concurrente no duplica avisos de subastas favoritas', async () => {
  const rover = await publish(secondSeller, products.rover, 'avisos de subasta');
  await json(await post(buyer, `favorite/${rover.id}`, {active: true}));
  await json(await post(observer, `favorite/${rover.id}`, {active: true}));

  async function maintainTogether() {
    const responses = await Promise.all([seller, secondSeller, buyer, rival, observer].map(a => get(a, 'activity')));
    for (const response of responses) await json(response);
  }
  const {error} = await admin.from('lp_listings').update({
    ends_at: new Date(Date.now() + 20 * 60_000).toISOString(),
  }).eq('id', rover.id);
  expect(error?.message).toBeUndefined();
  await maintainTogether();
  await expireFixtures('lp_listings', [rover.id]);
  await maintainTogether();
  await maintainTogether();
  for (const actor of [buyer, observer]) {
    const types = (await notifications(actor)).filter(n => n.listing_id === rover.id).map(n => n.type).sort();
    expect(types).toEqual(['favorite_auction_closing_soon', 'favorite_auction_ended']);
  }
  expect((await notifications(rival)).filter(n => n.listing_id === rover.id)).toEqual([]);
  expect((await notifications(secondSeller)).filter(n => n.listing_id === rover.id).map(n => n.type).sort())
    .toEqual(['auction_ended', 'favorite_received']);
});
