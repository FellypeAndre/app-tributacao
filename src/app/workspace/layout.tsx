'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, LogOut, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  // 1. PUXANDO O USUÁRIO E A EMPRESA ATIVA
  const { user, empresaAtiva, loading, logout } = useAuth();
  const { showConfirm } = useAlert();
  const router = useRouter();

  // Proteção de Rota
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // ANIMAÇÃO DE LOADING
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
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
        <p className="text-[#10B981] font-bold tracking-widest uppercase text-sm">Autenticando...</p>
      </div>
    );
  }

  // POP-UP DE SAÍDA
  const handleLogout = () => {
    showConfirm(
      "Sair do Sistema", 
      "Tem certeza que deseja encerrar a sua sessão?", 
      () => {
        logout();
        router.push('/');
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 transition-colors duration-200">
      {/* HEADER GLOBAL DO WORKSPACE */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/workspace')}>
          
          <div className="p-1 rounded-xl shadow-md bg-[#0b3c2c] border border-emerald-900 flex items-center justify-center h-10 w-10 overflow-hidden">
            <Image 
              src="/icone_tax_auditor_transparente.png" 
              alt="Tax Auditor Pro Logo" 
              width={32} 
              height={32} 
              className="object-contain"
              priority
            />
          </div>

          <div>
            <h1 className="font-bold text-lg tracking-tight uppercase">Tax Auditor Pro</h1>
            {/* 2. EXIBINDO O CNPJ DA EMPRESA ATIVA */}
            <p className="text-xs font-semibold uppercase tracking-wider text-[#059669]">
              {empresaAtiva ? `CNPJ: ${empresaAtiva.cnpj}` : 'Selecione uma Empresa'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50">
            <User size={14} className="text-[#059669]" />
            {/* 3. EXIBINDO O NOME DO USUÁRIO CORRETAMENTE */}
            <span className="text-xs font-medium text-[#059669]">{user.nome}</span>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400" title="Sair">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* RENDERIZA O CONTEÚDO DA PÁGINA */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Se o usuário tentar acessar o painel sem escolher uma empresa, mostramos um aviso visual ao invés de quebrar o site */}
        {!empresaAtiva ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <Building size={48} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700">Nenhuma empresa selecionada</h2>
            <p className="text-gray-500 mt-2">Você precisa selecionar um cliente para iniciar a auditoria.</p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}