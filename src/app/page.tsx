import {Suspense} from 'react';
import Catalog from '@/components/Catalog';
export default function Home(){return <Suspense fallback={<p>Cargando catálogo…</p>}><Catalog/></Suspense>}
