'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import TelaLogin from '../modules/auth/TelaLogin'; // Ajuste o caminho se necessário

export default function AppPrincipal() {
  const { user, empresaAtiva, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se o usuário logou...
    if (!loading && user) {
      // Se ele já tem uma empresa escolhida, vai pro painel
      if (empresaAtiva) {
        router.push('/workspace');
      } else {
        // Se não tem empresa escolhida, vai pra tela Estilo Netflix
        router.push('/selecionar-empresa');
      }
    }
  }, [user, empresaAtiva, loading, router]);

  // ANIMAÇÃO DE CARREGAMENTO
  if (loading || (user && !loading)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <style dangerouslySetInnerHTML={{__html: `
          .dots-container { display: flex; align-items: center; justify-content: center; }
          .dot { height: 20px; width: 20px; margin-right: 10px; border-radius: 10px; background-color: #a7f3d0; animation: pulse 1.5s infinite ease-in-out; }
          .dot:last-child { margin-right: 0; }
          .dot:nth-child(1) { animation-delay: -0.4s; }
          .dot:nth-child(2) { animation-delay: -0.3s; }
          .dot:nth-child(3) { animation-delay: -0.2s; }
          .dot:nth-child(4) { animation-delay: -0.1s; }
          .dot:nth-child(5) { animation-delay: 0s; }
          @keyframes pulse {
            0% { transform: scale(0.8); background-color: #a7f3d0; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            50% { transform: scale(1.2); background-color: #10B981; box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.8); background-color: #a7f3d0; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          }
        `}} />
        <section className="dots-container mb-6">
          <div className="dot"/><div className="dot"/><div className="dot"/><div className="dot"/><div className="dot"/>
        </section>
        <p className="text-[#10B981] font-bold tracking-widest uppercase text-sm">
          {user ? 'Direcionando...' : 'Validando Token...'}
        </p>
      </div>
    );
  }

  return <TelaLogin />;
}