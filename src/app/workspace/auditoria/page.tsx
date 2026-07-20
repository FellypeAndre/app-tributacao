'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, Plus, FolderSearch, Clock, ChevronRight, Folder } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AuditService } from '../../../services/auditService';

export default function CentralAuditorias() {
  const router = useRouter();
  
  // 1. Puxamos também o 'user' para saber o nível de acesso
  const { empresaAtiva, user } = useAuth();
  
  // 2. REGRA DE NEGÓCIO: Verifica se é apenas visualizador
  const isCliente = user?.nivel_acesso === 'CLIENTE';

  const [auditorias, setAuditorias] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (empresaAtiva) {
      carregarLista();
    }
  }, [empresaAtiva]);

  const carregarLista = async () => {
    if (!empresaAtiva) return;

    setCarregando(true);
    try {
      const dados = await AuditService.buscarAuditorias(empresaAtiva.id);
      setAuditorias(dados);
    } catch (error) {
      console.error("Erro ao carregar auditorias:", error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-[#10B981]" size={28} />
            Central de Auditorias
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            Gerencie os relatórios cruzados da empresa <span className="font-bold text-[#059669]">{empresaAtiva?.razao_social}</span>.
          </p>
        </div>
        
        {/* MÁGICA AQUI: O botão de Nova Auditoria some para os Clientes */}
        {!isCliente && (
          <button 
            onClick={() => router.push('/workspace/auditoria/nova')}
            className="relative flex justify-center items-center gap-2 px-6 py-3 rounded-xl overflow-hidden z-10 shadow-[0_8px_30px_rgb(16,185,129,0.2)] transition-all duration-300 text-white font-bold uppercase text-sm bg-[#10B981] hover:bg-[#059669] hover:-translate-y-1"
          >
            <Plus size={20} /> Nova Auditoria
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-gray-700 uppercase tracking-wider text-sm flex items-center gap-2">
            <FolderSearch size={18} className="text-gray-400"/> Histórico de Relatórios
          </h2>
        </div>

        {carregando ? (
          <div className="text-emerald-500 animate-pulse font-bold tracking-widest uppercase text-center py-10 text-sm">
            Buscando pastas no servidor...
          </div>
        ) : auditorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <Clock size={48} className="text-gray-300 mb-4" />
            <h3 className="font-bold text-gray-600 text-lg">Nenhum relatório disponível</h3>
            <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
              Ainda não existem cruzamentos de dados liberados para <strong className="text-gray-500">{empresaAtiva?.razao_social}</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {auditorias.map((pasta) => (
              <button
                key={pasta.id}
                onClick={() => router.push(`/workspace/auditoria/${pasta.id}`)}
                className="group flex flex-col text-left p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Folder size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                    {pasta.data}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-800 text-base mb-1 group-hover:text-emerald-600 transition-colors">
                  {pasta.nome}
                </h3>
                
                {pasta.estatisticas && (
                  <p className="text-xs text-gray-500 font-medium">
                    {pasta.estatisticas.comErro} inconsistências
                  </p>
                )}

                <div className="absolute bottom-5 right-5 text-emerald-500 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <ChevronRight size={20} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}