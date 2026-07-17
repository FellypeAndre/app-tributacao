'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, Plus, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuditService } from '../../services/auditService';

export default function WorkspaceHome() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [pastas, setPastas] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (user) {
      carregarPastas();
    }
  }, [user]);

  const carregarPastas = async () => {
    try {
      const dados = await AuditService.buscarAuditorias(user!.id);
      setPastas(dados);
    } catch (error) {
      console.error("Erro ao carregar pastas:", error);
    } finally {
      setCarregando(false);
    }
  };

  const pastasFiltradas = pastas.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.data.includes(busca)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wide">Auditorias da Empresa</h2>
          <p className="text-gray-500 mt-1">Gerenciando os arquivos fiscais na nuvem</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar pasta..." 
              value={busca} 
              onChange={(e) => setBusca(e.target.value)} 
              className="w-full pl-10 p-2.5 rounded-lg border outline-none transition-all bg-white border-gray-200 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" 
            />
          </div>
          
          {/* Este botão vai chamar a nossa futura tela de Nova Importação! */}
          <button 
            onClick={() => router.push('/workspace/nova')} 
            className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold shadow-lg transition-transform hover:scale-105"
          >
            <Plus size={18} /> Nova Conciliação
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center items-center py-20 text-[#10B981]">
          <Folder className="animate-pulse mr-2" /> Sincronizando pastas...
        </div>
      ) : pastas.length === 0 ? (
        <div className="p-5 rounded-xl border shadow-sm bg-white border-emerald-100 border-dashed flex flex-col items-center justify-center py-20 text-center">
          <Folder size={48} className="text-gray-400 mb-4" />
          <h3 className="font-semibold text-lg">Nenhuma pasta salva</h3>
          <p className="text-gray-500 max-w-md mt-2">Clique em "Nova Conciliação" para processar planilhas pesadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pastasFiltradas.map((pasta) => (
            <div 
              key={pasta.id} 
              onClick={() => router.push(`/workspace/auditoria/${pasta.id}`)} 
              className="p-5 rounded-xl border shadow-sm bg-white border-emerald-100 cursor-pointer hover:border-[#10B981] transition-all hover:shadow-lg group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                  <Folder size={24} className="text-[#059669]" />
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">{pasta.data}</span>
              </div>
              <h3 className="font-bold text-lg mb-1 truncate uppercase" title={pasta.nome}>{pasta.nome}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                <div className="flex items-center gap-1"><AlertTriangle size={14} className="text-red-500"/> {pasta.estatisticas?.comErro || 0} Erros</div>
                <div className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500"/> {pasta.estatisticas?.corretos || 0} OK</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}