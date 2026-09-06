import './globals.css';
import type { Metadata } from 'next';
import {AuthProvider} from '@/context/AuthContext';
import Header from '@/components/Header';
import Brand from '@/components/Brand';
import Link from 'next/link';
import {Toaster} from 'react-hot-toast';
export const metadata:Metadata={title:{default:'La Pela · Segunda mano, sin regateos',template:'%s · La Pela'},description:'Compra a precio cerrado o participa en una subasta. Vende sin regateos y habla de la entrega después de comprar.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><AuthProvider><a className="skip-link" href="#contenido">Saltar al contenido</a><Toaster position="bottom-center"/><Header/>{process.env.LAPELA_PAYMENTS_MODE==='simulated'&&<div className="sandbox-banner">BETA DE PRUEBA · Las compras y los pagos son simulados. No se mueve dinero.</div>}<main id="contenido" className="page-shell">{children}</main><footer className="site-footer"><div><Brand/><p>Las cosas cambian de manos.<br/>El precio no se discute.</p></div><div><Link href="/como-funciona">Cómo funciona</Link><Link href="/como-funciona#reglas">Reglas de la comunidad</Link><span>© {new Date().getFullYear()} La Pela</span></div></footer></AuthProvider></body></html>}
