import {fileURLToPath} from 'node:url';
const nextConfig={distDir:process.env.NODE_ENV==='development'?'.next-dev':'.next',outputFileTracingRoot:fileURLToPath(new URL('.',import.meta.url)),images:{unoptimized:true},async headers(){return [{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'X-Frame-Options',value:'DENY'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]}]}};
export default nextConfig;
