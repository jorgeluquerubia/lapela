import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
export async function middleware(request:NextRequest){
 // Legacy mutation endpoints cannot bypass the v2 order and payment rules.
 if(request.nextUrl.pathname.startsWith('/api/')&&!request.nextUrl.pathname.startsWith('/api/market/')&&!request.nextUrl.pathname.startsWith('/api/cron/')&&!request.nextUrl.pathname.startsWith('/api/social-card/')&&!request.nextUrl.pathname.startsWith('/api/stripe/')&&!(request.nextUrl.pathname==='/api/products'&&request.method==='GET'))return NextResponse.json({error:'Esta operación pertenece a la versión anterior. Actualiza la página.'},{status:410});
 let response=NextResponse.next({request});
 if(!request.cookies.getAll().some(c=>c.name.startsWith('sb-')))return response;
 const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});values.forEach(({name,value,options})=>response.cookies.set(name,value,options))}}});
 await supabase.auth.getUser();return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
