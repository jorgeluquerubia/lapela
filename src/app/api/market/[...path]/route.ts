import {handle} from '@/controllers/marketplace';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{path:string[]}>}){return handle(request,(await params).path)}
export const POST=GET;
