'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  User, LogOut, Building, Menu, 
  LayoutDashboard, FileSpreadsheet, Users, UserCircle, ArrowLeftRight 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, empresaAtiva, loading, logout } = useAuth();
  const { showConfirm } = useAlert();
  const router = useRouter();
  const pathname = usePathname();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-[#10B981] font-bold tracking-widest uppercase text-sm animate-pulse">Carregando Workspace...</p>
      </div>
    );
  }

  const handleLogout = () => {
    showConfirm("Sair do Sistema", "Tem certeza que deseja encerrar a sua sessão?", () => {
      logout();
      router.push('/');
    });
  };

  const handleTrocarEmpresa = () => {
    router.push('/selecionar-empresa');
  };

  // ==========================================
  // NOVO MENU LIMPO E OBJETIVO
  // ==========================================
  const menuItens = [
    { nome: 'Início', icone: <LayoutDashboard size={24} />, rota: '/workspace' },
    { nome: 'Auditorias', icone: <FileSpreadsheet size={24} />, rota: '/workspace/auditoria' },
    { nome: 'Empresas', icone: <Building size={24} />, rota: '/workspace/empresas' },
    { nome: 'Usuários', icone: <Users size={24} />, rota: '/workspace/usuarios' },
    { nome: 'Meu Perfil', icone: <UserCircle size={24} />, rota: '/workspace/perfil' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-800">
      
      {/* ========================================== */}
      {/* SIDEBAR DESKTOP */}
      {/* ========================================== */}
      <aside className={`hidden md:flex flex-col bg-gradient-to-b from-[#0b3c2c] to-[#059669] text-white transition-all duration-300 ease-in-out shadow-2xl z-20 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className={`h-20 flex items-center justify-center border-b border-white/10 ${isSidebarOpen ? 'px-6 justify-start' : ''}`}>
          <div className="p-1 rounded-xl shadow-md bg-white/10 border border-white/20 flex-shrink-0">
            <Image src="/icone_tax_auditor_transparente.png" alt="Logo" width={32} height={32} className="object-contain" priority />
          </div>
          {isSidebarOpen && <h1 className="ml-3 font-bold text-lg tracking-tight uppercase whitespace-nowrap overflow-hidden">Tax Auditor</h1>}
        </div>

        {/* NAVEGAÇÃO PRINCIPAL */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto custom-scrollbar">
          {menuItens.map((item) => {
            const isAtivo = pathname === item.rota || (pathname.startsWith(item.rota) && item.rota !== '/workspace');
            return (
              <button
                key={item.nome}
                onClick={() => router.push(item.rota)}
                title={!isSidebarOpen ? item.nome : ''}
                className={`flex items-center rounded-xl transition-all duration-200 h-12 ${isAtivo ? 'bg-white/20 text-white font-bold shadow-sm' : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'} ${isSidebarOpen ? 'px-4' : 'justify-center'}`}
              >
                <div className="flex-shrink-0">{item.icone}</div>
                {isSidebarOpen && <span className="ml-3 whitespace-nowrap">{item.nome}</span>}
              </button>
            );
          })}
        </nav>

        {/* RODAPÉ DO MENU LATERAL (Botão Sair fixo embaixo) */}
        <div className="p-4 border-t border-white/10 mt-auto bg-black/10">
          <button 
            onClick={handleLogout} 
            title={!isSidebarOpen ? 'Sair do Sistema' : ''}
            className={`flex items-center text-emerald-100/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all h-12 w-full ${isSidebarOpen ? 'px-4' : 'justify-center'}`}
          >
            <LogOut size={24} className="flex-shrink-0" />
            {isSidebarOpen && <span className="ml-3 font-semibold whitespace-nowrap">Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* ÁREA PRINCIPAL */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col w-full overflow-hidden relative">
        
        {/* HEADER (Mais limpo, sem o botão de sair) */}
        <header className="h-20 px-4 md:px-6 flex justify-between items-center border-b border-gray-200 bg-white shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <Menu size={24} />
            </button>
            
            <div className="flex flex-col">
              <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest hidden md:block">Empresa Ativa</p>
              <div className="flex items-center gap-2">
                <p className="text-sm md:text-base font-bold text-[#059669] flex items-center gap-2 truncate max-w-[150px] md:max-w-none">
                  <Building size={16} className="hidden md:block"/> 
                  {empresaAtiva ? empresaAtiva.razao_social : 'Nenhuma Empresa'}
                </p>
                {empresaAtiva && (
                  <button 
                    onClick={handleTrocarEmpresa}
                    className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100 ml-1 md:ml-3"
                    title="Trocar Empresa"
                  >
                    <ArrowLeftRight size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Trocar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50">
              <User size={16} className="text-[#059669]" />
              <span className="text-sm font-bold text-[#059669] truncate max-w-[100px] md:max-w-none">{user.nome.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 bg-gray-50/50">
          {!empresaAtiva ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
              <Building size={48} className="text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-700">Nenhuma empresa selecionada</h2>
              <button onClick={handleTrocarEmpresa} className="mt-6 px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                Escolher Empresa
              </button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* ========================================== */}
      {/* BARRA INFERIOR MOBILE */}
      {/* ========================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-between items-center h-16 px-1 z-50 pb-safe shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] overflow-x-auto custom-scrollbar">
        {menuItens.map((item) => {
          const isAtivo = pathname === item.rota || (pathname.startsWith(item.rota) && item.rota !== '/workspace');
          return (
            <button
              key={item.nome}
              onClick={() => router.push(item.rota)}
              className={`flex flex-col items-center justify-center min-w-[70px] h-full space-y-1 ${isAtivo ? 'text-[#059669]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`${isAtivo ? 'bg-emerald-100 p-1.5 rounded-full' : ''} transition-all`}>
                {item.icone}
              </div>
              <span className={`text-[9px] font-bold ${isAtivo ? 'opacity-100' : 'opacity-70'} truncate max-w-[65px]`}>{item.nome}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}