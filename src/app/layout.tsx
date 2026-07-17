import './globals.css'; // Mantenha a importação do seu CSS global, se houver
import { AuthProvider } from '../context/AuthContext';
import { AlertProvider } from '../context/AlertContext';

export const metadata = {
  title: 'Tax Auditor Pro',
  description: 'Auditoria fiscal inteligente',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* A ordem correta: Alertas por fora, Autenticação por dentro */}
        <AlertProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AlertProvider>
      </body>
    </html>
  );
}