import '../../public/style.css';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <Toaster />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="container main-content flex-grow">
              {children}
            </main>
            <footer className="text-center py-6 mt-10 border-t">
              <p>&copy; 2025 LaPela. Todos los derechos reservados.</p>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
