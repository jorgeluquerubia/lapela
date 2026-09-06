import {NextResponse} from 'next/server';
// Legacy operations are retired in both middleware and route handlers.
export async function GET(_request: Request){return NextResponse.json({error:'Esta operación pertenece a la versión anterior. Actualiza la página.'},{status:410})}
export const POST=GET;export const PUT=GET;export const PATCH=GET;export const DELETE=GET;
