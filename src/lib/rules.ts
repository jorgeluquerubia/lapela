export const categories=['Tecnología','Hogar','Moda','Deporte','Coleccionismo','Otros'];
export const conditions=['Como nuevo','Buen estado','Con señales de uso'];
export const money=(cents:number)=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cents/100);
export {PESETAS_PER_EURO, PESETA_DISCLAIMER, eurosToPesetas, centsToPesetas, formatPesetas, pesetaEquivalence, trackPesetaHelp} from './pesetas';
export function cents(value:unknown){const n=Number(value);if(!Number.isFinite(n)||n<1||n>10000||Math.abs(n*100-Math.round(n*100))>0.00001)throw Error('Indica un importe entre 1 y 10.000 €, con un máximo de dos decimales.');return Math.round(n*100)}
export function text(value:unknown,min:number,max:number){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)throw Error(`El texto debe tener entre ${min} y ${max} caracteres.`);return value.trim()}
export function noContact(value:string){if(/https?:|www\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+34[\s.-]*)?(?:\d[\s.-]*){9,}|whats?app|telegram|instagram|@[a-z0-9_]{3,}/i.test(value))throw Error('No incluyas teléfonos, enlaces ni datos de contacto.');return value}
export function noBargaining(value:string){
  const bargainingKeywords = /(?:^|[^\p{L}\p{N}])(?:regate[a-z]*|rebaj[a-z]*|descuent[a-z]*|contraofert[a-z]*|negoci[a-z]*|[uú]ltimo precio|precio m[ií]nimo|precio final|bajar(?:lo|le|se)?(?: el)? precio|bajad[a-z]*|ajustar(?: el)? precio|por cu[aá]nto (?:me )?lo dejas|algo menos|por menos)(?:$|[^\p{L}\p{N}])/iu;
  const offerPatterns = /(?:^|[^\p{L}\p{N}])(?:te doy|te ofrezco|te dar[ií]a|te ofrecer[ií]a|te pago|te pagar[ií]a|te lo compro(?: por)?|lo compro por|me lo dejas(?: en| por)?|d[eé]jamelo(?: en| por)?|lo dejas(?: en| por)?|aceptas?(?: una)? oferta|mi oferta es)(?:$|[^\p{L}\p{N}])/iu;
  const barterPatterns = /(?:^|[^\p{L}\p{N}])(?:trueque[s]?|cambi[ao]s? por|te lo cambio por|intercambi[ao]s? por|aceptas? (?:cambios?|trueques?)|haces? (?:cambios?|trueques?))(?:$|[^\p{L}\p{N}])/iu;
  const cashOfferPatterns = /\b\d+\s*(?:€|euros?)\s*(?:y me lo llevo|y trato hecho|en mano|hoy mismo|ya|te parece|te valen|te sirven)\b/iu;

  if(bargainingKeywords.test(value) || offerPatterns.test(value) || barterPatterns.test(value) || cashOfferPatterns.test(value)){
    throw Error('En La Pela el precio no es negociable. Las preguntas deben tratar sobre las características o estado del producto.');
  }
  return value;
}

export function publicAlias(value:unknown){
 const normalized=typeof value==='string'?value.trim().toLowerCase():'';
 if(!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(normalized)||normalized.startsWith('usuario-'))throw Error('El alias debe tener entre 3 y 30 caracteres: letras minúsculas, números, guiones o guiones bajos.');
 return normalized;
}

export function noExternalPayment(value: string) {
  const externalPaymentKeywords = /(?:^|[^\p{L}\p{N}])(?:bizum|paypal|verse|revolut|transferencia(?: bancaria)?|pago (?:por )?fuera|pago externo|cripto|bitcoin)(?:$|[^\p{L}\p{N}])/iu;
  if (externalPaymentKeywords.test(value)) {
    throw Error('No incluyas métodos de pago externos ni instrucciones fuera de la plataforma.');
  }
  return value;
}

export function validateStory(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw Error('La historia debe ser un texto.');
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 1000) {
    throw Error('La historia no puede superar los 1.000 caracteres.');
  }
  noContact(trimmed);
  noBargaining(trimmed);
  noExternalPayment(trimmed);
  return trimmed;
}

export const uuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
export function canMessage(status:string,actor:string,buyer:string,seller:string){return ['pending_payment','paid','shipped','completed','disputed'].includes(status)&&[buyer,seller].includes(actor)}

