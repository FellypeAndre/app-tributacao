'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ArrowRightLeft, ChevronLeft, Save, Copy, Database } from 'lucide-react';
import Papa from 'papaparse';
import { useAuth } from '../../../../context/AuthContext';
import { AuditService } from '../../../../services/auditService';
import { executarComparacao, Divergencia } from '../../../../core/comparisonEngine';

export default function NovaConciliacao() {
  const { empresaAtiva, user } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (user?.nivel_acesso === 'CLIENTE') {
      router.push('/workspace/auditoria');
    }
  }, [user, router]);

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
  const [scriptCopiado, setScriptCopiado] = useState(false);

  // O seu Select mapeado para facilitar a vida do operador
  const scriptSQL = `SELECT
  P.CODIGO,
  P.CODIGO_BARRA,
  P.DESCRICAO,
  P.NCM,
  P.CEST,
  PR.CST_NFC CST_NFCE,
  PR.CST CST_NFE,
  PR.CODIGO_CFOP_NFC CFOP_ESTADUAL,
  P.F_RBC_ICMS_SAI_ESTADUAL RBC_ICMS_ESTADUAL,
  PT.DESCRICAO ALIQ_ICMS_ESTADUAL,
  PR.CST_PIS_ENTRADA CST_PIS_COMPRA,
  PR.F_PIS_COMPRA ALIQ_PIS_COMPRA,
  PR.CST_COFINS_ENTRADA CST_COFINS_COMPRA,
  PR.F_COFINS_COMPRA ALIQ_COFINS_COMPRA,
  PR.CST_PIS CST_PIS_VENDA,
  PR.F_PIS_VENDA ALIQ_PIS_VENDA,
  PR.CST_COFINS CST_COFINS_VENDA,
  PR.F_COFINS_VENDA ALIQ_COFINS_VENDA,
  PR.CST_NATUREZA_RECEITA_PISCOFINS CST_NAT_REC_PISCOFINS
FROM PRODUTO P
JOIN PRODUTO_PARAMETROS PR ON PR.CODIGO_PRODUTO = P.CODIGO
JOIN PRODUTO_TRIBUTO PT ON PT.CODIGO = PR.CODIGO_TRIBUTO
WHERE P.TIPO_PRODUTO NOT IN ('KIT', 'FRACIONAVEL')
AND P.STATUS = 'A'
AND PR.CODIGO_FILIAL = 1;`;

  const copiarScript = () => {
    navigator.clipboard.writeText(scriptSQL);
    setScriptCopiado(true);
    setTimeout(() => setScriptCopiado(false), 3000);
  };

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

          if (!dataArray || dataArray.length === 0) return alert("O arquivo está vazio ou com erro de formatação.");
          
          if (isPlanilhaA) {
            setPlanilhaA(dataArray);
            const cols = results.meta?.fields || Object.keys(dataArray[0]);
            setColunasA(cols);
            // Tenta achar o código de barras automaticamente para facilitar
            setChavePrimaria(cols.find(c => c.toUpperCase() === 'CODIGO_BARRA' || c.toUpperCase() === 'EAN') || cols[0]);
          } else {
            setPlanilhaB(dataArray);
          }
        }
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleComparar = () => {
    if (!chavePrimaria) return alert("Selecione a chave primária (Ex: CODIGO_BARRA).");
    if (planilhaA.length === 0 || planilhaB.length === 0) return alert("Você precisa importar as duas planilhas para o cruzamento!");

    const relatorio = executarComparacao(planilhaA, planilhaB, chavePrimaria);
    
    if (!relatorio) {
      return alert("Erro ao gerar relatório. Verifique se as planilhas possuem a mesma chave primária.");
    }

    setDivergencias(relatorio);
    setComparacaoFeita(true);
  };

  const salvarAuditoriaBanco = async () => {
    if (!nomeNovaAuditoria) return alert("Dê um nome para esta auditoria.");
    if (!empresaAtiva) return alert("Nenhuma empresa selecionada.");
    
    // 🛡️ TRAVA: Não deixa salvar se a comparação falhou e gerou 0 dados
    if (planilhaB.length === 0 && divergencias.length === 0) {
       return alert("O cruzamento de dados falhou ou está vazio. Impossível salvar.");
    }
    
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

      const payload = {
        estatisticas: { total: totalProdutos, comErro: produtosComErro, corretos: produtosCorretos },
        dadosGraficoBarras,
        divergencias: divergencias.length > 200 ? divergencias.slice(0, 200) : divergencias 
      };

      await AuditService.salvarAuditoria(empresaAtiva.id, nomeNovaAuditoria, payload);
      alert("Auditoria processada e salva com sucesso!");
      router.push('/workspace/auditoria'); 

    } catch (error: any) {
      alert(`Erro crítico ao salvar: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const cssCard = 'p-6 rounded-2xl border shadow-sm bg-white transition-all';

  if (user?.nivel_acesso === 'CLIENTE') return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button 
        onClick={() => router.push('/workspace/auditoria')} 
        className="flex items-center gap-2 text-sm font-semibold mb-2 text-[#059669] hover:opacity-80"
      >
        <ChevronLeft size={16}/> Voltar para Pastas
      </button>

      <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-blue-800 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
            <Database size={18}/> Script de Extração (Firebird)
          </h3>
          <p className="text-blue-600 text-xs mt-1 font-medium">Use este script no banco de dados do cliente (IBExpert/DBeaver) e exporte o resultado como CSV para a "Planilha do Sistema".</p>
        </div>
        <button onClick={copiarScript} className="shrink-0 bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-wider">
          {scriptCopiado ? <CheckCircle2 size={16}/> : <Copy size={16}/>}
          {scriptCopiado ? 'Copiado!' : 'Copiar Script SQL'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${cssCard} border-emerald-200 border-dashed border-2 relative hover:border-[#10B981] hover:bg-emerald-50/30`}>
          <input type="file" accept=".csv" onChange={(e) => lerCSV(e.target.files![0], true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <div className="flex flex-col items-center justify-center text-center py-8">
            <CheckCircle2 size={36} className="text-[#10B981] mb-3" />
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">1. Planilha da Contabilidade</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">A Base de Dados Correta (Gabarito)</p>
            {nomeArquivoA && <p className="mt-4 text-xs font-bold bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full shadow-sm">{nomeArquivoA}</p>}
          </div>
        </div>
        
        <div className={`${cssCard} border-blue-200 border-dashed border-2 relative hover:border-blue-500 hover:bg-blue-50/30`}>
          <input type="file" accept=".csv" onChange={(e) => lerCSV(e.target.files![0], false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <div className="flex flex-col items-center justify-center text-center py-8">
            <AlertTriangle size={36} className="text-blue-500 mb-3" />
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">2. Planilha do Sistema ERP</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">O CSV extraído usando o script acima</p>
            {nomeArquivoB && <p className="mt-4 text-xs font-bold bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow-sm">{nomeArquivoB}</p>}
          </div>
        </div>
      </div>

      {(planilhaA.length > 0 && planilhaB.length > 0) && !comparacaoFeita && (
        <div className="p-6 rounded-2xl border shadow-sm bg-white border-gray-100 flex flex-col md:flex-row gap-4 items-end animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Chave de Ligação (Geralmente CODIGO_BARRA):</label>
            <select 
              className="w-full p-3 rounded-xl border outline-none bg-white border-gray-200 focus:border-[#10B981] font-medium text-sm text-gray-700 shadow-sm" 
              value={chavePrimaria} 
              onChange={(e) => setChavePrimaria(e.target.value)}
            >
              {colunasA.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
          <button 
            onClick={handleComparar} 
            className="w-full md:w-auto px-8 py-3 rounded-xl flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold shadow-[0_8px_30px_rgb(16,185,129,0.2)] transition-transform hover:-translate-y-1"
          >
            <ArrowRightLeft size={18} /> Cruzar Dados
          </button>
        </div>
      )}

      {comparacaoFeita && (
        <div className="p-6 rounded-2xl border shadow-sm bg-emerald-50 border-emerald-200 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-[#059669] uppercase flex items-center gap-2"><CheckCircle2/> Cruzamento Concluído!</h3>
              <p className="text-sm mt-1 text-gray-600 font-medium">Foram mapeadas <span className="font-bold text-red-500">{divergencias.length}</span> correções a serem enviadas para o ERP.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Ex: Correção Mês Julho..." 
                value={nomeNovaAuditoria} 
                onChange={e => setNomeNovaAuditoria(e.target.value)} 
                className="p-3 rounded-xl border outline-none bg-white border-gray-300 w-full sm:w-64 focus:border-[#10B981] text-sm font-medium shadow-sm" 
              />
              <button 
                onClick={salvarAuditoriaBanco} 
                disabled={salvando} 
                className={`px-8 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg text-white transition-all uppercase tracking-wider text-xs ${salvando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#10B981] hover:bg-[#059669] hover:-translate-y-1'}`}
              >
                {salvando ? 'Gravando BD...' : <><Save size={16} /> Salvar e Ver Relatório</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}