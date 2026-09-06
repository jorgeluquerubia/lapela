'use client';
import {createContext,useState,useEffect,useContext,ReactNode} from 'react';
import {supabase} from '@/utils/supabase';
import {Session,User} from '@supabase/supabase-js';
type Auth={session:Session|null;user:User|null;profile:{username:string|null;avatar_url:string|null}|null;loading:boolean;refreshUserProfile:()=>Promise<void>};
const AuthContext=createContext<Auth>({session:null,user:null,profile:null,loading:true,refreshUserProfile:async()=>{}});
export function AuthProvider({children}:{children:ReactNode}){const [session,setSession]=useState<Session|null>(null);const [loading,setLoading]=useState(true);useEffect(()=>{let active=true;supabase.auth.getSession().then(({data})=>{if(active){setSession(data.session);setLoading(false)}}).catch(()=>{if(active)setLoading(false)});const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>{if(active){setSession(s);setLoading(false)}});return()=>{active=false;subscription.unsubscribe()}},[]);return <AuthContext.Provider value={{session,user:session?.user||null,profile:null,loading,refreshUserProfile:async()=>{}}}>{children}</AuthContext.Provider>}
export const useAuth=()=>useContext(AuthContext);
