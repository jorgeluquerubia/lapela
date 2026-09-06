import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export const createClient=async()=>{const store=await cookies();return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll(){return store.getAll()},setAll(values){try{values.forEach(({name,value,options})=>store.set(name,value,options))}catch{/* Server components cannot write cookies. Middleware refreshes sessions. */}}}})};
