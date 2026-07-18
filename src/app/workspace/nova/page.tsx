'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ArrowRightLeft, ChevronLeft, Save } from 'lucide-react';
import Papa from 'papaparse';
import { useAuth } from '../../../context/AuthContext';
import { AuditService } from '../../../services/auditService';
import { executarComparacao, Divergencia } from '../../../core/comparisonEngine';

export default function NovaConciliacao() {
  // Puxamos apenas a empresaAtiva (o user não é mais necessário para salvar a pasta)
  const { empresaAtiva } = useAuth();
  const router = useRouter();

  const [planilhaA, setPlanilhaA] = useState<any[]>([]);
  const [nomeArquivoA, setNomeArquivoA] = useState('');
  
  const [planilhaB, setPlanilhaB] = useState<any[]>([]);
  const [nomeArquivoB, setNomeArquivoB] = useState('');
  
  const [colunasA, setColunasA] = useState<string[]>([]);
  const [chavePrimaria, setChavePrimaria] = useState('');
  
  const [divergencias, setDivergencias] = useState<Divergencia[]>([]);
  const [comparacaoFeita, setComparacaoFeita] = useState(false);
  const [nomeNovaAuditoria, setNomeNovaAuditoria] = useState('');
  const [salvando, setSalvando] = useState(false);

  const lerCSV = (file: File, isPlanilhaA: boolean) => {
    if (!file.name.toLowerCase().endsWith('.csv')) return alert("Envie um arquivo .CSV.");
    
    if (isPlanilhaA) setNomeArquivoA(file.name); 
    else setNomeArquivoB(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      Papa.parse(text, {
        header: true, 
        skipEmptyLines: true,
        complete: (results) => {
          const dataArray = results.data as any[]; 

          if (!dataArray || dataArray.length === 0) return alert("Arquivo vazio.");
          
          if (isPlanilhaA) {
            setPlanilhaA(dataArray);
            const cols = results.meta?.fields || Object.keys(dataArray[0]);
            setColunasA(cols);
            setChavePrimaria(cols.find(c => c.toUpperCase().includes('BARRA') || c.toUpperCase().includes('CODIGO')) || cols[0]);
          } else {
            setPlanilhaB(dataArray);
          }
        }
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleComparar = () => {
    if (!chavePrimaria) return alert("Selecione a chave (ex: CODIGO_BARRA).");
    if (planilhaA.length === 0 || planilhaB.length === 0) return alert("Importe as duas planilhas!");

    const relatorio = executarComparacao(planilhaA, planilhaB, chavePrimaria);
    setDivergencias(relatorio);
    setComparacaoFeita(true);
  };

  const salvarAuditoriaBanco = async () => {
    // 🛡️ TRAVA DE SEGURANÇA 1: Garante que o nome foi preenchido
    if (!nomeNovaAuditoria) return alert("Dê um nome para esta auditoria.");
    
    // 🛡️ TRAVA DE SEGURANÇA 2: Garante que a empresa está selecionada no sistema
    if (!empresaAtiva) return alert("Nenhuma empresa selecionada. Volte e selecione um cliente.");
    
    setSalvando(true);
    
    try {
      const totalProdutos = planilhaB.length;
      const produtosComErro = new Set(divergencias.map(d => d.chave)).size;
      const produtosCorretos = totalProdutos - produtosComErro;

      const errosPorColuna: Record<string, number> = {};
      divergencias.forEach(div => { 
        errosPorColuna[div.colunaDivergente] = (errosPorColuna[div.colunaDivergente] || 0) + 1; 
      });
      
      const dadosGraficoBarras = Object.keys(errosPorColuna)
        .map(key => ({ coluna: key, erros: errosPorColuna[key] }))
        .sort((a, b) => b.erros - a.erros)
        .slice(0, 20); 

      const divergenciasResumo = divergencias.length > 200 ? divergencias.slice(0, 200) : divergencias;

      const payload = {
        estatisticas: { total: totalProdutos, comErro: produtosComErro, corretos: produtosCorretos },
        dadosGraficoBarras,
        divergencias: divergenciasResumo 
      };

      // 🔒 O SEGREDO AQUI: Passamos empresaAtiva.id como o dono absoluto desta auditoria
      await AuditService.salvarAuditoria(empresaAtiva.id, nomeNovaAuditoria, payload);

      alert("Auditoria processada e salva com sucesso!");
      router.push('/workspace/auditoria'); // Volta para a central de auditorias correta

    } catch (error: any) {
      alert(`Erro crítico ao salvar: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const cssCard = 'p-5 rounded-xl border shadow-sm bg-white border-emerald-100';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button 
        onClick={() => router.push('/workspace/auditoria')} 
        className="flex items-center gap-2 text-sm font-semibold mb-2 text-[#059669] hover:opacity-80"
      >
        <ChevronLeft size={16}/> Voltar para Pastas
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${cssCard} border-dashed border-2 relative hover:border-[#10B981] transition-colors`}>
          <input type="file" accept=".csv" onChange={(e) => lerCSV(e.target.files![0], true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <div className="flex flex-col items-center justify-center text-center py-6">
            <CheckCircle2 size={32} className="text-[#10B981] mb-2" />
            <h3 className="font-bold uppercase tracking-wider">1. Planilha da Contabilidade</h3>
            <p className="text-xs text-[#10B981] font-medium mt-1 uppercase">A Base de Dados Correta</p>
            {nomeArquivoA && <p className="mt-4 text-sm font-bold bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full shadow-sm">{nomeArquivoA}</p>}
          </div>
        </div>
        
        <div className={`${cssCard} border-dashed border-2 relative hover:border-red-500 transition-colors`}>
          <input type="file" accept=".csv" onChange={(e) => lerCSV(e.target.files![0], false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <div className="flex flex-col items-center justify-center text-center py-6">
            <AlertTriangle size={32} className="text-red-500 mb-2" />
            <h3 className="font-bold uppercase tracking-wider">2. Planilha do Sistema</h3>
            <p className="text-xs text-red-500 font-medium mt-1 uppercase">Os dados que precisam de correção</p>
            {nomeArquivoB && <p className="mt-4 text-sm font-bold bg-red-100 text-red-800 px-4 py-1.5 rounded-full shadow-sm">{nomeArquivoB}</p>}
          </div>
        </div>
      </div>

      {(planilhaA.length > 0 && planilhaB.length > 0) && !comparacaoFeita && (
        <div className={`${cssCard} flex flex-col md:flex-row gap-4 items-end bg-white`}>
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Chave de Ligação (ID Único):</label>
            <select 
              className="w-full p-2.5 rounded-lg border outline-none bg-white border-gray-200 focus:border-[#10B981]" 
              value={chavePrimaria} 
              onChange={(e) => setChavePrimaria(e.target.value)}
            >
              {colunasA.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
          <button 
            onClick={handleComparar} 
            className="w-full md:w-auto px-8 py-3 rounded-lg flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold shadow-lg transition-transform hover:scale-105"
          >
            <ArrowRightLeft size={18} /> Mapear Divergências
          </button>
        </div>
      )}

      {comparacaoFeita && (
        <div className="p-6 rounded-xl border shadow-sm bg-emerald-50 border-emerald-200">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-[#059669] uppercase flex items-center gap-2"><CheckCircle2/> Comparação Concluída!</h3>
              <p className="text-sm mt-1 text-gray-600 font-medium">Foram encontradas <span className="font-bold text-red-500">{divergencias.length}</span> inconsistências em massa.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Nome da Pasta..." 
                value={nomeNovaAuditoria} 
                onChange={e => setNomeNovaAuditoria(e.target.value)} 
                className="p-2.5 rounded-lg border outline-none bg-white border-gray-300 w-64 focus:border-[#10B981]" 
              />
              <button 
                onClick={salvarAuditoriaBanco} 
                disabled={salvando} 
                className={`px-8 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold shadow-lg text-white transition-all ${salvando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#10B981] hover:bg-[#059669]'}`}
              >
                {salvando ? 'Gravando no BD...' : <><Save size={18} /> Salvar Relatório</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}