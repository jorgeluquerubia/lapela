#!/usr/bin/env node
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  options: {
    url: { type: 'string', short: 'u' },
    timeout: { type: 'string', short: 't', default: '15000' },
    minProducts: { type: 'string', short: 'm', default: '1' }
  },
  allowPositionals: true,
  strict: false
});

const targetUrl = values.url || positionals[0] || process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://lapela-nine.vercel.app';
const timeoutMs = parseInt(values.timeout, 10) || 15000;
const minProducts = parseInt(values.minProducts, 10) || 0;

console.log(`[Smoke Test] Validando despliegue en: ${targetUrl}`);

const endpoint = new URL('/api/products', targetUrl).toString();

try {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const start = Date.now();
  const response = await fetch(endpoint, {
    signal: controller.signal,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'LaPela-Deployment-SmokeTest/1.0'
    }
  });
  clearTimeout(timer);
  const elapsed = Date.now() - start;

  console.log(`[Smoke Test] ${endpoint} -> HTTP ${response.status} (${elapsed}ms)`);

  if (!response.ok) {
    const bodyText = await response.text();
    console.error(`[Smoke Test] FALLO: Código de respuesta HTTP ${response.status}. Cuerpo: ${bodyText.slice(0, 300)}`);
    process.exit(1);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    console.error(`[Smoke Test] FALLO: Tipo de contenido no válido: ${contentType}`);
    process.exit(1);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.products)) {
    console.error('[Smoke Test] FALLO: Respuesta no contiene un array de "products" válido.', data);
    process.exit(1);
  }

  console.log(`[Smoke Test] Total de productos reportados: ${data.totalCount ?? data.products.length}. En esta página: ${data.products.length}`);

  if (minProducts > 0 && data.products.length < minProducts) {
    console.error(`[Smoke Test] FALLO: Se esperaban al menos ${minProducts} productos, pero se encontraron ${data.products.length}`);
    process.exit(1);
  }

  // Verificar integridad básica de los productos
  if (data.products.length > 0) {
    const sample = data.products[0];
    if (!sample.id || !sample.name || typeof sample.price !== 'number') {
      console.error('[Smoke Test] FALLO: Formato de producto inesperado en el catálogo:', sample);
      process.exit(1);
    }
    console.log(`[Smoke Test] Muestra validada: ID ${sample.id} ("${sample.name}", ${sample.price}€, has_story: ${sample.has_story})`);
  }

  console.log('[Smoke Test] ÉXITO: El catálogo y el endpoint /api/products están 100% operativos.');
  process.exit(0);
} catch (error) {
  if (error.name === 'AbortError') {
    console.error(`[Smoke Test] FALLO: Timeout de ${timeoutMs}ms excedido al conectar a ${endpoint}`);
  } else {
    console.error(`[Smoke Test] FALLO: Error de red o conexión: ${error.message}`);
  }
  process.exit(1);
}
