import Stripe from 'stripe';
import {stripeSandboxPayments} from './payment-mode';

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw Error('Los pagos todavía no están configurados. No se ha realizado ningún cargo.');

  const testKey = /^(sk|rk|rkcs)_test_/.test(key);
  if (stripeSandboxPayments()) {
    if (!testKey) throw Error('Stripe sandbox requiere una clave de prueba.');
  } else {
    if (testKey) throw Error('Para usar una clave de prueba, activa el modo stripe_test.');
    if (!/^(sk|rk)_live_/.test(key) || process.env.LAPELA_LIVE_PAYMENTS !== 'true') {
      throw Error('Los pagos reales todavía no están habilitados.');
    }
  }
  return new Stripe(key);
}

export function origin(){const url=process.env.APP_URL;if(!url)throw Error('Falta configurar la dirección del portal.');return url.replace(/\/$/,'')}
