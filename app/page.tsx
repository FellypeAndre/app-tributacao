'use client'

import React, { useState } from 'react';
import { Download, Moon, Sun, Building2, Upload, AlertTriangle, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import Papa from 'papaparse';

export default function ConciliadorTributario() {
  const [temaEscuro, setTemaEscuro] = useState(true);
  
  // Estados para as duas planilhas
  const [planilhaA, setPlanilhaA] = useState<any[]>([]); // Contabilidade (Correta)
  const [nomeArquivoA, setNomeArquivoA] = useState('');
  
  const [planilhaB, setPlanilhaB] = useState<any[]>([]); // Sistema (A ser corrigida)
  const [nomeArquivoB, setNomeArquivoB] = useState('');
  
  // Estados de Comparação
  const [colunasA, setColunasA] = useState<string[]>([]);
  const [chavePrimaria, setChavePrimaria] = useState('');
  const [divergencias, setDivergencias] = useState<any[]>([]);
  const [comparacaoFeita, setComparacaoFeita] = useState(false);

  // Função genérica de leitura de CSV
  const lerCSV = (file: File, isPlanilhaA: boolean) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return alert("Por favor, envie um arquivo .CSV.");
    }

    if (isPlanilhaA) setNomeArquivoA(file.name);
    else setNomeArquivoB(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) return alert("Arquivo vazio.");
          
          if (isPlanilhaA) {
            setPlanilhaA(results.data);
            const cols = results.meta?.fields || Object.keys(results.data[0]);
            setColunasA(cols);
            // Tenta adivinhar a chave primária
            setChavePrimaria(cols.find(c => c.toUpperCase().includes('BARRA') || c.toUpperCase().includes('CODIGO')) || cols[0]);
          } else {
            setPlanilhaB(results.data);
          }
        }
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  // O "Motor" de Comparação
  const executarComparacao = () => {
    if (!chavePrimaria) return alert("Selecione a coluna chave (ex: CODIGO_BARRA).");
    if (planilhaA.length === 0 || planilhaB.length === 0) return alert("Importe as duas planilhas primeiro!");

    const relatorioDivergencias: any[] = [];

    // Cria um mapa da Planilha A (Contabilidade) para busca super rápida
    const mapaContabilidade = new Map(planilhaA.map(item => [item[chavePrimaria], item]));

    // Varre a Planilha B (Sistema) procurando diferenças
    planilhaB.forEach((itemB, indexB) => {
      const chaveItemAtual = itemB[chavePrimaria];
      const itemA = mapaContabilidade.get(chaveItemAtual);

      if (itemA) {
        // O produto existe nas duas! Vamos comparar coluna por coluna
        Object.keys(itemB).forEach(coluna => {
          // Só compara se a coluna existir na planilha da contabilidade
          if (itemA[coluna] !== undefined && String(itemA[coluna]).trim() !== String(itemB[coluna]).trim()) {
            relatorioDivergencias.push({
              idUnico: `${chaveItemAtual}-${coluna}`,
              indiceB: indexB,
              produto: itemB['DESCRICAO'] || itemB['DESCRIÇÃO'] || chaveItemAtual,
              chave: chaveItemAtual,
              colunaDivergente: coluna,
              valorSistema: itemB[coluna], // Errado
              valorContabilidade: itemA[coluna] // Certo
            });
          }
        });
      }
    });

    setDivergencias(relatorioDivergencias);
    setComparacaoFeita(true);
  };

  // Aplica as correções na Planilha B
  const aplicarCorrecoes = () => {
    if (divergencias.length === 0) return alert("Não há divergências para corrigir.");

    const novaPlanilhaB = [...planilhaB];
    
    divergencias.forEach(div => {
      novaPlanilhaB[div.indiceB][div.colunaDivergente] = div.valorContabilidade;
    });

    setPlanilhaB(novaPlanilhaB);
    setDivergencias([]);
    alert("Planilha do sistema corrigida com sucesso! Você já pode exportá-la.");
  };

  const exportarPlanilhaB = () => {
    if (planilhaB.length === 0) return;
    const csv = Papa.unparse(planilhaB);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Sistema_Corrigido_${nomeArquivoB || 'planilha.csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // VARIÁVEIS DE TEMA: PRETO E LARANJA
  const cssBackground = temaEscuro ? 'bg-[#0A0A0A] text-gray-200' : 'bg-orange-50 text-gray-900';
  const cssHeader = temaEscuro ? 'border-[#262626] bg-[#121212]' : 'border-orange-200 bg-white';
  const cssCard = `p-5 rounded-xl border shadow-sm ${temaEscuro ? 'bg-[#171717] border-[#262626]' : 'bg-white border-orange-100'}`;
  const cssInput = `w-full p-2.5 rounded-lg border outline-none transition-all ${temaEscuro ? 'bg-[#0A0A0A] border-[#333333] text-gray-200 focus:border-[#FF6B00]' : 'bg-orange-50 border-orange-200 focus:border-[#FF6B00]'}`;
  const cssButtonPrimary = temaEscuro ? 'bg-[#FF6B00] hover:bg-[#E66000] text-black font-semibold' : 'bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold';
  const cssAccentText = temaEscuro ? 'text-[#FF6B00]' : 'text-[#FF6B00]';

  return (
    <div className={`min-h-screen ${cssBackground} transition-colors duration-200`}>
      
      {/* HEADER */}
      <header className={`px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b ${cssHeader}`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl shadow-lg ${temaEscuro ? 'bg-[#FF6B00] text-black' : 'bg-[#FF6B00] text-white'}`}>
            <Building2 size={24} />
          </div>
          <h1 className="font-bold text-xl tracking-tight uppercase">Tax Auditor Pro</h1>
        </div>
        
        <button onClick={() => setTemaEscuro(!temaEscuro)} className={`p-2 rounded-full transition-colors ${temaEscuro ? 'bg-[#171717] hover:bg-[#262626]' : 'bg-orange-100 hover:bg-orange-200'}`}>
          {temaEscuro ? <Sun size={20} className="text-gray-300" /> : <Moon size={20} className="text-[#FF6B00]" />}
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* ÁREA DE UPLOADS (LADO A LADO) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PLANILHA A (CONTABILIDADE) */}
          <div className={`${cssCard} border-dashed border-2 relative hover:border-emerald-500 transition-colors`}>
            <input type="file" accept=".csv" onChange={(e) => lerCSV(e.target.files![0], true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className="flex flex-col items-center justify-center text-center">
              <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
              <h3 className="font-bold uppercase tracking-wider">1. Planilha da Contabilidade</h3>
              <p className="text-xs text-emerald-500 font-medium mt-1 uppercase">A Base de Dados Correta</p>
              {nomeArquivoA && <p className="mt-3 text-sm font-medium bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">{nomeArquivoA} ({planilhaA.length} itens)</p>}
            </div>
          </div>

          {/* PLANILHA B (SISTEMA) */}
          <div className={`${cssCard} border-dashed border-2 relative hover:border-red-500 transition-colors`}>
            <input type="file" accept=".csv" onChange={(e) => lerCSV(e.target.files![0], false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className="flex flex-col items-center justify-center text-center">
              <AlertTriangle size={32} className="text-red-500 mb-2" />
              <h3 className="font-bold uppercase tracking-wider">2. Planilha do Sistema</h3>
              <p className="text-xs text-red-500 font-medium mt-1 uppercase">Os dados que precisam de correção</p>
              {nomeArquivoB && <p className="mt-3 text-sm font-medium bg-red-500/10 text-red-500 px-3 py-1 rounded-full">{nomeArquivoB} ({planilhaB.length} itens)</p>}
            </div>
          </div>

        </div>

        {/* BARRA DE AÇÕES (CHAVE E COMPARAR) */}
        {(planilhaA.length > 0 && planilhaB.length > 0) && (
          <div className={`${cssCard} flex flex-col md:flex-row gap-4 items-end`}>
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Chave de Ligação (ID Único):</label>
              <select className={cssInput} value={chavePrimaria} onChange={(e) => setChavePrimaria(e.target.value)}>
                {colunasA.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
              <p className="text-[10px] mt-1 text-gray-500">Geralmente é o CODIGO_BARRA. Precisa existir nas duas planilhas.</p>
            </div>
            
            <button onClick={executarComparacao} className={`w-full md:w-auto px-8 py-3 rounded-lg flex items-center justify-center gap-2 ${cssButtonPrimary}`}>
              <ArrowRightLeft size={18} /> Comparar Planilhas
            </button>
          </div>
        )}

        {/* RELATÓRIO DE DIVERGÊNCIAS */}
        {comparacaoFeita && (
          <div className={`rounded-xl border overflow-hidden ${temaEscuro ? 'bg-[#121212] border-[#262626]' : 'bg-white border-orange-200'}`}>
            <div className={`px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${temaEscuro ? 'border-[#262626]' : 'border-orange-100'}`}>
              <div>
                <h2 className="font-bold flex items-center gap-2 uppercase tracking-wide">
                  Relatório de Auditoria
                </h2>
                <p className="text-sm mt-1 text-gray-500">Encontradas {divergencias.length} inconsistências.</p>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                {divergencias.length > 0 && (
                  <button onClick={aplicarCorrecoes} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors shadow-lg">
                    Aplicar Correções na Planilha B
                  </button>
                )}
                <button onClick={exportarPlanilhaB} className={`flex-1 sm:flex-none px-4 py-2 border text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${temaEscuro ? 'border-[#333333] hover:bg-[#262626]' : 'border-orange-300 hover:bg-orange-50'}`}>
                  <Download size={16}/> Exportar Sistema
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className={`sticky top-0 z-10 ${temaEscuro ? 'bg-[#0A0A0A] text-[#858585]' : 'bg-orange-50 text-gray-600'}`}>
                  <tr>
                    <th className={`p-4 font-bold text-xs tracking-wider uppercase border-b ${temaEscuro ? 'border-[#333333]' : 'border-orange-200'}`}>Chave / Código</th>
                    <th className={`p-4 font-bold text-xs tracking-wider uppercase border-b ${temaEscuro ? 'border-[#333333]' : 'border-orange-200'}`}>Produto</th>
                    <th className={`p-4 font-bold text-xs tracking-wider uppercase border-b ${temaEscuro ? 'border-[#333333]' : 'border-orange-200'}`}>Coluna Divergente</th>
                    <th className={`p-4 font-bold text-xs tracking-wider uppercase border-b bg-red-500/10 text-red-500 ${temaEscuro ? 'border-[#333333]' : 'border-orange-200'}`}>No Sistema (Errado)</th>
                    <th className={`p-4 font-bold text-xs tracking-wider uppercase border-b bg-emerald-500/10 text-emerald-500 ${temaEscuro ? 'border-[#333333]' : 'border-orange-200'}`}>Na Contabilidade (Certo)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {divergencias.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Nenhuma divergência encontrada! Os dados estão sincronizados.</td>
                    </tr>
                  ) : (
                    divergencias.slice(0, 200).map((div) => (
                      <tr key={div.idUnico} className={`border-b hover:${temaEscuro ? 'bg-[#1A1A1A]' : 'bg-orange-50/50'} ${temaEscuro ? 'border-[#262626]' : 'border-orange-100'}`}>
                        <td className="p-4 font-mono text-gray-400">{div.chave}</td>
                        <td className="p-4 text-gray-300 max-w-xs truncate" title={div.produto}>{div.produto}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded font-bold text-xs ${temaEscuro ? 'bg-[#262626] text-gray-300' : 'bg-gray-200 text-gray-700'}`}>{div.colunaDivergente}</span></td>
                        <td className="p-4 font-medium text-red-400 line-through decoration-red-500/50">{div.valorSistema || '(Vazio)'}</td>
                        <td className="p-4 font-bold text-emerald-400">{div.valorContabilidade || '(Vazio)'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {divergencias.length > 200 && (
               <div className={`p-3 text-center text-xs font-medium uppercase tracking-wider ${temaEscuro ? 'bg-[#0A0A0A] text-gray-600' : 'bg-orange-50 text-gray-500'}`}>
                 Mostrando as primeiras 200 divergências de {divergencias.length}. Clique em "Aplicar Correções" para resolver todas.
               </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}