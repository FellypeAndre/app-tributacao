'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, ArrowRight, ShieldCheck, Search, Building2, Briefcase } from 'lucide-react';
import { useAuth, Empresa } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../context/AlertContext';

export default function SelecionarEmpresa() {
  const { user, selecionarEmpresa, logout } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  const router = useRouter();
  
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    carregarEmpresasPermitidas();
  }, [user, router]);

  const carregarEmpresasPermitidas = async () => {
    try {
      const { data, error } = await supabase
        .from('usuario_empresa')
        .select('empresas ( id, cnpj, razao_social )')
        .eq('usuario_id', user?.id);

      if (error) throw error;

      if (data) {
        const listaLimpa = data.map((item: any) => item.empresas);
        listaLimpa.sort((a, b) => a.razao_social.localeCompare(b.razao_social));
        setEmpresas(listaLimpa);
      }
    } catch (err) {
      showAlert("Erro", "Não foi possível carregar as suas empresas.", "error");
    } finally {
      setCarregando(false);
    }
  };

  const handleEscolherEmpresa = (empresa: Empresa) => {
    selecionarEmpresa(empresa);
    router.push('/workspace');
  };

  const handleSair = () => {
    showConfirm("Sair", "Deseja voltar para a tela de login?", () => {
      logout();
      router.push('/');
    });
  };

  const empresasFiltradas = empresas.filter(emp => 
    emp.razao_social.toLowerCase().includes(busca.toLowerCase()) || 
    emp.cnpj.includes(busca)
  );

  const pegarIniciais = (nome: string) => {
    const palavras = nome.trim().split(' ');
    if (palavras.length === 1) return palavras[0].substring(0, 2).toUpperCase();
    return (palavras[0][0] + palavras[1][0]).toUpperCase();
  };

  return (
    // 1. O NOVO FUNDO: Degradê do Menu Lateral
    <div className="relative min-h-screen flex flex-col items-center py-12 px-4 overflow-hidden bg-gradient-to-b from-[#0b3c2c] to-[#059669]">
      
      {/* 2. GRID SUTIL BRANCO (Fica parecendo estrelas/pontos de conexão) */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:24px_24px] opacity-100 z-0 pointer-events-none"></div>

      {/* CABEÇALHO COM EFEITO DE VIDRO (Glassmorphism) */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700 relative z-10">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-lg">
          <div className="p-1 rounded-xl shadow-md bg-white flex items-center justify-center h-10 w-10">
            <Image src="/icone_tax_auditor_transparente.png" alt="Logo" width={28} height={28} className="object-contain" priority />
          </div>
          <h1 className="font-black text-lg text-white tracking-widest uppercase drop-shadow-sm">Tax Auditor Pro</h1>
        </div>
        
        <button onClick={handleSair} className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-emerald-50 hover:text-white hover:bg-red-500/80 hover:border-red-400 transition-all font-semibold text-xs uppercase tracking-wider shadow-lg">
          Sair <LogOut size={16} />
        </button>
      </div>

      <div className="w-full max-w-6xl relative z-10 flex flex-col lg:flex-row gap-12 lg:items-start mt-4">
        
        {/* COLUNA ESQUERDA: Boas-vindas em Textos Claros */}
        <div className="lg:w-1/3 flex flex-col animate-in slide-in-from-left-8 fade-in duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-100 font-bold text-[10px] uppercase tracking-widest mb-6 w-max shadow-sm backdrop-blur-sm">
            <ShieldCheck size={14} /> Autenticado • {user?.nivel_acesso}
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-md">
            Olá, <span className="text-emerald-300">{user?.nome.split(' ')[0]}</span>
          </h2>
          <p className="text-emerald-50/80 font-medium text-lg mb-10 drop-shadow-sm">
            Selecione o ambiente de trabalho (Workspace) do cliente que deseja acessar hoje.
          </p>

          {/* BARRA DE PESQUISA (Continua branca para focar a atenção do usuário) */}
          {!carregando && empresas.length > 0 && (
            <div className="relative group shadow-xl rounded-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input 
                type="text" 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou CNPJ..." 
                className="w-full pl-12 pr-4 py-4 bg-white border border-transparent rounded-2xl text-gray-700 placeholder-gray-400 font-medium outline-none focus:ring-4 focus:ring-emerald-400/50 transition-all shadow-sm" 
              />
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: Grid de Cartões (Mantidos Brancos para Contraste) */}
        <div className="lg:w-2/3 w-full">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-300 rounded-full animate-spin mb-4"></div>
              <p className="text-emerald-100 font-bold tracking-widest uppercase text-xs drop-shadow-sm">Sincronizando clientes...</p>
            </div>
          ) : empresas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl text-center">
              <Briefcase size={56} className="text-emerald-100/50 mb-6" />
              <h3 className="font-black text-white text-xl mb-2">Sem acesso atribuído</h3>
              <p className="text-emerald-50/70">O seu usuário não possui acesso a nenhum CNPJ. Solicite a liberação ao Administrador do sistema.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-max">
              {empresasFiltradas.length > 0 ? (
                empresasFiltradas.map((empresa, index) => (
                  <button
                    key={empresa.id}
                    onClick={() => handleEscolherEmpresa(empresa)}
                    className="group flex flex-col text-left p-6 bg-white rounded-3xl border border-transparent shadow-xl hover:shadow-[0_15px_35px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                    style={{ animation: 'fade-in 0.5s ease-out backwards', animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-xl text-[#0b3c2c] group-hover:bg-gradient-to-br group-hover:from-[#10B981] group-hover:to-[#059669] group-hover:text-white group-hover:border-emerald-500 transition-all shadow-sm">
                        {pegarIniciais(empresa.razao_social)}
                      </div>
                      
                      <span className="px-2.5 py-1 bg-emerald-100/50 text-[#059669] text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-200/50">
                        Ativo
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1 group-hover:text-[#059669] transition-colors relative z-10 pr-4">
                      {empresa.razao_social}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest relative z-10">
                      <Building2 size={12} className="text-gray-300" />
                      {empresa.cnpj}
                    </div>
                    
                    <div className="absolute bottom-6 right-6 h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight size={16} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 text-center py-12 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
                  <Search size={32} className="mx-auto text-emerald-100/50 mb-3" />
                  <p className="text-emerald-50 font-medium">Nenhuma empresa encontrada com "<span className="text-white font-bold">{busca}</span>"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}