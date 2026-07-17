'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Building2, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth, Empresa } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../context/AlertContext';

export default function SelecionarEmpresa() {
  const { user, selecionarEmpresa, logout } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  const router = useRouter();
  
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
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
      // Mágica Relacional: Busca na Tabela Ponte apenas os CNPJs liberados para este usuário
      const { data, error } = await supabase
        .from('usuario_empresa')
        .select('empresas ( id, cnpj, razao_social )')
        .eq('usuario_id', user?.id);

      if (error) throw error;

      if (data) {
        const listaLimpa = data.map((item: any) => item.empresas);
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-16 px-4">
      
      {/* CABEÇALHO DA TELA DE SELEÇÃO */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-xl shadow-md bg-[#0b3c2c] border border-emerald-900 flex items-center justify-center h-12 w-12 overflow-hidden">
            <Image src="/icone_tax_auditor_transparente.png" alt="Logo" width={36} height={36} className="object-contain" priority />
          </div>
          <h1 className="font-black text-xl text-gray-800 tracking-widest uppercase">Tax Auditor Pro</h1>
        </div>
        
        <button onClick={handleSair} className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors font-semibold text-sm uppercase tracking-wider">
          Sair <LogOut size={16} />
        </button>
      </div>

      <div className="text-center mb-12 animate-in zoom-in-95 duration-500 delay-150 fill-mode-both">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-widest mb-4">
          <ShieldCheck size={16} /> Autenticado como {user?.nivel_acesso}
        </div>
        <h2 className="text-4xl font-black text-gray-800 tracking-tight mb-2">
          Olá, {user?.nome.split(' ')[0]}
        </h2>
        <p className="text-gray-500 font-medium">Qual empresa você deseja acessar hoje?</p>
      </div>

      {carregando ? (
        <div className="text-emerald-500 animate-pulse font-bold tracking-widest uppercase mt-10">Buscando Clientes...</div>
      ) : empresas.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-3xl border border-gray-200 shadow-sm max-w-md w-full">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-1">Nenhuma empresa vinculada</h3>
          <p className="text-gray-500 text-sm">O seu usuário ainda não possui acesso a nenhum CNPJ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {empresas.map((empresa, index) => (
            <button
              key={empresa.id}
              onClick={() => handleEscolherEmpresa(empresa)}
              className="group flex flex-col items-center p-8 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.15)] hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-bottom-4 fade-in"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors mb-5">
                <Building2 size={32} />
              </div>
              
              <h3 className="font-bold text-gray-800 text-lg text-center leading-tight mb-2 group-hover:text-emerald-600 transition-colors">
                {empresa.razao_social}
              </h3>
              
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
                {empresa.cnpj}
              </p>
              
              <div className="mt-auto flex items-center text-emerald-500 font-bold text-sm uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                Acessar Workspace <ArrowRight size={16} className="ml-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}