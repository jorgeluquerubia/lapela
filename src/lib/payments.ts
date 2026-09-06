import Stripe from 'stripe';
export function stripe(){const key=process.env.STRIPE_SECRET_KEY;if(!key)throw Error('Los pagos todavía no están configurados. No se ha realizado ningún cargo.');if(key.startsWith('sk_live_')&&process.env.LAPELA_LIVE_PAYMENTS!=='true')throw Error('Los pagos reales todavía no están habilitados.');return new Stripe(key)}
export function origin(){const url=process.env.APP_URL;if(!url)throw Error('Falta configurar la dirección del portal.');return url.replace(/\/$/,'')}
