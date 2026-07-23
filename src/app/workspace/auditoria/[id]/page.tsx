'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, CheckCircle2, AlertTriangle, Database, Send, TerminalSquare, RefreshCw } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';

export default function RelatorioAuditoria() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [auditoria, setAuditoria] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // 🛡️ CARREGAMENTO INICIAL
  useEffect(() => {
    if (params.id === 'nova') return;
    carregarAuditoria();
  }, [params.id]);

  // 📡 O RADAR (F5 AUTOMÁTICO): Fica recarregando a cada 3 segundos se o robô estiver processando
  useEffect(() => {
    let intervalo: NodeJS.Timeout;
    
    if (auditoria?.status_sincronizacao === 'LIBERADO_PARA_ROBO') {
      intervalo = setInterval(() => {
        carregarAuditoria();
      }, 3000);
    }

    // Limpa o radar se o status mudar para CONCLUIDO ou se sair da tela
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [auditoria?.status_sincronizacao]);

  const carregarAuditoria = async () => {
    try {
      const { data, error } = await supabase
        .from('auditorias')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      if (data.dados && typeof data.dados === 'string') {
        try {
          data.dados = JSON.parse(data.dados);
        } catch (e) {
          console.error("Erro ao converter texto para JSON:", e);
        }
      }

      setAuditoria(data);
    } catch (error) {
      alert("Erro ao carregar relatório.");
      router.push('/workspace/auditoria');
    } finally {
      setCarregando(false);
    }
  };

  const handleAprovarParaERP = async () => {
    setEnviando(true);
    try {
      const divergencias = auditoria?.dados_json?.divergencias || [];
      
      const comandosDeCorrecao = divergencias.map((div: any) => ({
        chave_busca: div.chave, 
        coluna_erp: div.colunaDivergente, 
        valor_correto: div.valorCorreto
      }));

      const payloadRobo = {
        auditoria_id: auditoria.id,
        empresa_id: auditoria.empresa_id,
        data_aprovacao: new Date().toISOString(),
        total_comandos: comandosDeCorrecao.length,
        comandos: comandosDeCorrecao
      };

      const { error } = await supabase
        .from('auditorias')
        .update({
          status_sincronizacao: 'LIBERADO_PARA_ROBO',
          payload_sincronizacao: payloadRobo,
          log_agente: null // Limpa o log antigo se estiver reaplicando
        })
        .eq('id', auditoria.id);

      if (error) throw error;

      setAuditoria({ 
        ...auditoria, 
        status_sincronizacao: 'LIBERADO_PARA_ROBO', 
        payload_sincronizacao: payloadRobo,
        log_agente: null
      });

    } catch (error: any) {
      alert(`Erro ao aprovar: ${error.message}`);
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) return <div className="p-10 text-center font-bold text-emerald-500 animate-pulse uppercase tracking-widest text-sm">Carregando Relatório...</div>;
  if (!auditoria) return null;

  const isLiberado = auditoria.status_sincronizacao === 'LIBERADO_PARA_ROBO';
  const isConcluido = auditoria.status_sincronizacao === 'CONCLUIDO';
  const isCliente = user?.nivel_acesso === 'CLIENTE';

  const estatisticas = auditoria?.dados_json?.estatisticas || { total: 0, comErro: 0, corretos: 0 };
  const divergencias = auditoria?.dados_json?.divergencias || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <button onClick={() => router.push('/workspace/auditoria')} className="flex items-center gap-2 text-sm font-semibold mb-2 text-[#059669] hover:opacity-80">
        <ChevronLeft size={16}/> Voltar para Pastas
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
            {auditoria.nome || 'Relatório sem nome'}
            {isConcluido && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> SINCRONIZADO NO ERP</span>}
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Relatório gerado em {new Date(auditoria.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"><Database size={24}/></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Analisado</p>
            <p className="text-2xl font-black text-gray-700">{estatisticas.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-red-500"><AlertTriangle size={24}/></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Com Erros (Divergências)</p>
            <p className="text-2xl font-black text-red-500">{estatisticas.comErro}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 size={24}/></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Itens Corretos</p>
            <p className="text-2xl font-black text-emerald-500">{estatisticas.corretos}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Detalhamento dos Erros (Top 200)</h2>
          </div>
          <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-white sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-10 text-gray-500">
                <tr>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider">Chave/Código</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider">Coluna</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-red-500 bg-red-50/50">No ERP (Incorreto)</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-emerald-600 bg-emerald-50/50">Valor Correto (Contabilidade)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {divergencias.length > 0 ? (
                  divergencias.slice(0, 200).map((div: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-semibold text-gray-700">{div.chave}</td>
                      <td className="p-4 font-bold text-gray-500">{div.colunaDivergente}</td>
                      <td className="p-4 text-red-500 font-medium bg-red-50/20">{div.valorPlanilha || 'Vazio'}</td>
                      <td className="p-4 text-emerald-600 font-bold bg-emerald-50/20">{div.valorCorreto || 'Vazio'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400 font-medium">
                      Nenhum detalhe de erro disponível neste relatório.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 rounded-3xl border border-gray-800 shadow-xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-800 bg-black/20 flex items-center gap-3">
              <TerminalSquare className="text-[#10B981]" size={20}/>
              <h2 className="font-bold text-white uppercase tracking-wider text-sm">Sync com Banco Local</h2>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <p className="text-gray-400 text-sm mb-6">Ao aprovar, um pacote de dados será gerado. O Agente Local do cliente fará o download e atualizará o banco automaticamente.</p>
              
              {/* O NOVO TERMINAL DE LOG: Só aparece se tiver log do Agente */}
              {auditoria?.log_agente ? (
                <div className="bg-black/60 rounded-xl p-4 font-mono text-xs text-emerald-400 mb-6 overflow-y-auto max-h-56 border border-emerald-900/30 whitespace-pre-wrap">
                  {auditoria.log_agente}
                </div>
              ) : (
                <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-emerald-400/70 mb-6 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/60 pointer-events-none"></div>
                  <p>{"{"}</p>
                  <p className="pl-4">"auditoria_id": "{auditoria.id.split('-')[0]}..."</p>
                  <p className="pl-4">"total_comandos": {estatisticas.comErro},</p>
                  <p className="pl-4">"comandos": [{"{"}</p>
                  <p className="pl-8 text-emerald-300">"chave_busca": "...",</p>
                  <p className="pl-8 text-emerald-300">"coluna_erp": "NCM",</p>
                  <p className="pl-8 text-emerald-300">"valor_correto": "..."</p>
                  <p className="pl-4">{"}"}, ...]</p>
                  <p>{"}"}</p>
                </div>
              )}

              <div className="mt-auto">
                {isCliente ? (
                  <div className="w-full py-4 text-center text-gray-500 font-bold text-xs uppercase tracking-widest bg-white/5 rounded-xl border border-white/10">
                    Aguardando aprovação
                  </div>
                ) : isConcluido ? (
                  <div className="flex flex-col gap-3">
                    <div className="w-full py-4 flex justify-center items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest bg-blue-900/20 rounded-xl border border-blue-500/30">
                      <CheckCircle2 size={18}/> Banco Atualizado
                    </div>
                    {/* NOVO BOTÃO: Reaplicar */}
                    <button 
                      onClick={handleAprovarParaERP}
                      disabled={enviando}
                      className="w-full py-2 text-xs font-bold text-gray-400 hover:text-white underline transition-colors disabled:opacity-50"
                    >
                      {enviando ? 'Empacotando...' : 'Aplicar Novamente'}
                    </button>
                  </div>
                ) : isLiberado ? (
                  <div className="w-full py-4 flex justify-center items-center gap-2 text-yellow-500 font-bold text-xs uppercase tracking-widest bg-yellow-900/20 rounded-xl border border-yellow-500/30">
                    <RefreshCw size={18} className="animate-spin"/> Agente Processando...
                  </div>
                ) : (
                  <button 
                    onClick={handleAprovarParaERP}
                    disabled={enviando || estatisticas.comErro === 0}
                    className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] text-white transition-all bg-[#10B981] hover:bg-[#059669] hover:-translate-y-1 disabled:opacity-50"
                  >
                    {enviando ? 'Empacotando Dados...' : <><Send size={18}/> Aprovar Correções</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}