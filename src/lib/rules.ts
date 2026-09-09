export const categories=['Tecnología','Hogar','Moda','Deporte','Coleccionismo','Otros'];
export const conditions=['Como nuevo','Buen estado','Con señales de uso'];
export const money=(cents:number)=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cents/100);
export function cents(value:unknown){const n=Number(value);if(!Number.isFinite(n)||n<1||n>10000||Math.abs(n*100-Math.round(n*100))>0.00001)throw Error('Indica un importe entre 1 y 10.000 €, con un máximo de dos decimales.');return Math.round(n*100)}
export function text(value:unknown,min:number,max:number){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)throw Error(`El texto debe tener entre ${min} y ${max} caracteres.`);return value.trim()}
export function noContact(value:string){if(/https?:|www\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+34[\s.-]*)?(?:\d[\s.-]*){9,}|whats?app|telegram|instagram|@[a-z0-9_]{3,}/i.test(value))throw Error('No incluyas teléfonos, enlaces ni datos de contacto.');return value}
export function noBargaining(value:string){if(/(?:^|[^\p{L}\p{N}])(?:regate[ao]|regatear|te doy|te ofrezco|rebaj[ao]|rebajas|rebajar|descuento|[uú]ltimo precio|precio m[ií]nimo|bajar(?:lo|le)? el precio|negociable|contraoferta)(?:$|[^\p{L}\p{N}])/iu.test(value))throw Error('En La Pela el precio no es negociable. Las preguntas deben tratar sobre las características o estado del producto.');return value}

export const uuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
export function canMessage(status:string,actor:string,buyer:string,seller:string){return ['pending_payment','paid','shipped','completed','disputed'].includes(status)&&[buyer,seller].includes(actor)}

