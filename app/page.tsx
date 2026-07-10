'use client'

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Moon, Sun, Edit3, Building2, Upload, Plus, Trash2 } from 'lucide-react';
import Papa from 'papaparse';

export default function WorkspaceTributario() {
  const [temaEscuro, setTemaEscuro] = useState(true);
  
  const [empresas, setEmpresas] = useState([{ id: 1, nome: "Minha Empresa Matriz", cnpj: "12.345.678/0001-99" }]);
  const [empresaAtiva, setEmpresaAtiva] = useState(1);
  const [novaEmpresaNome, setNovaEmpresaNome] = useState('');
  const [novaEmpresaCnpj, setNovaEmpresaCnpj] = useState('');

  const [itens, setItens] = useState<any[]>([]);
  const [colunas, setColunas] = useState<string[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState('');

  const [filtroColuna, setFiltroColuna] = useState('');
  const [filtroValor, setFiltroValor] = useState('');
  const [alterarColuna, setAlterarColuna] = useState('');
  const [novoValor, setNovoValor] = useState('');

  const adicionarEmpresa = () => {
    if (!novaEmpresaNome || !novaEmpresaCnpj) return alert("Preencha Nome e CNPJ!");
    const nova = { id: Date.now(), nome: novaEmpresaNome, cnpj: novaEmpresaCnpj };
    setEmpresas([...empresas, nova]);
    setEmpresaAtiva(nova.id);
    setNovaEmpresaNome('');
    setNovaEmpresaCnpj('');
    setItens([]);
  };

  const importarPlanilha = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    // Trava de segurança contra arquivos Excel (.xlsx)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert("Atenção: O sistema aceita apenas arquivos .CSV.\nPor favor, no Excel vá em 'Salvar Como' > 'CSV (UTF-8)' e tente importar novamente.");
      return;
    }

    setNomeArquivo(file.name);

    // Leitura nativa e blindada do arquivo
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results || !results.data || results.data.length === 0) {
            alert("Atenção: O arquivo está vazio ou com formatação inválida.");
            return;
          }

          // Garantia de mapeamento das colunas
          let nomesColunas: string[] = [];
          if (results.meta && results.meta.fields) {
            nomesColunas = results.meta.fields;
          } else {
            nomesColunas = Object.keys(results.data[0]);
          }
          
          setColunas(nomesColunas);
          setItens(results.data);
          
          // Define colunas padrão para os filtros se existirem
          if (nomesColunas.length > 0) {
            setFiltroColuna(nomesColunas.find(c => c.includes('NCM')) || nomesColunas[0]);
            setAlterarColuna(nomesColunas.find(c => c.includes('CST')) || nomesColunas[0]);
          }
        },
        error: (error: any) => {
          console.error("Erro no parse:", error);
          alert(`Falha ao ler o conteúdo do arquivo: ${error.message}`);
        }
      });
    };

    reader.onerror = () => {
      alert("Erro do navegador ao tentar ler o arquivo físico.");
    };

    reader.readAsText(file, 'UTF-8');
  };

  const exportarPlanilha = () => {
    if (itens.length === 0) return alert("Não há dados para exportar.");
    const csv = Papa.unparse(itens);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Atualizado_${nomeArquivo || 'planilha.csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const aplicarEdicaoEmMassa = () => {
    if (!filtroColuna || !filtroValor || !alterarColuna || !novoValor) {
      return alert("Preencha todos os campos da edição em massa!");
    }
    
    let contador = 0;
    const itensAtualizados = itens.map(item => {
      const valorAtual = item[filtroColuna] || '';
      if (String(valorAtual).startsWith(filtroValor)) {
        contador++;
        return { ...item, [alterarColuna]: novoValor };
      }
      return item;
    });

    setItens(itensAtualizados);
    alert(`${contador} produtos atualizados com sucesso!`);
  };

  // VARIÁVEIS DE TEMA: PRETO E LARANJA
  const cssBackground = temaEscuro ? 'bg-[#0A0A0A] text-gray-200' : 'bg-orange-50 text-gray-900';
  const cssHeader = temaEscuro ? 'border-[#262626] bg-[#121212]' : 'border-orange-200 bg-white';
  const cssCard = `p-5 rounded-xl border shadow-sm ${temaEscuro ? 'bg-[#171717] border-[#262626]' : 'bg-white border-orange-100'}`;
  const cssInput = `w-full p-2.5 rounded-lg border outline-none transition-all ${temaEscuro ? 'bg-[#0A0A0A] border-[#333333] text-gray-200 focus:border-[#FF6B00]' : 'bg-orange-50 border-orange-200 focus:border-[#FF6B00]'}`;
  const cssTextMuted = temaEscuro ? 'text-gray-500' : 'text-gray-500';
  const cssButtonPrimary = temaEscuro ? 'bg-[#FF6B00] hover:bg-[#E66000] text-black font-semibold' : 'bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold';
  const cssAccentText = temaEscuro ? 'text-[#FF6B00]' : 'text-[#FF6B00]';

  return (
    <div className={`min-h-screen ${cssBackground} transition-colors duration-200`}>
      
      <header className={`px-6 py-4 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b ${cssHeader}`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl shadow-lg ${temaEscuro ? 'bg-[#FF6B00] text-black' : 'bg-[#FF6B00] text-white'}`}>
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight uppercase">TaxManager Pro</h1>
            <select 
              className={`text-sm font-semibold bg-transparent outline-none cursor-pointer ${cssAccentText}`}
              value={empresaAtiva}
              onChange={(e) => setEmpresaAtiva(Number(e.target.value))}
            >
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id} className={temaEscuro ? 'bg-[#171717] text-gray-200' : 'text-black'}>
                  {emp.nome} - {emp.cnpj}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${temaEscuro ? 'border-[#333333] bg-[#0A0A0A]' : 'border-orange-200 bg-orange-50'}`}>
            <input type="text" placeholder="Nova Empresa" className="bg-transparent w-28 text-sm outline-none" value={novaEmpresaNome} onChange={e => setNovaEmpresaNome(e.target.value)} />
            <input type="text" placeholder="CNPJ" className={`bg-transparent w-32 text-sm outline-none border-l pl-2 ${temaEscuro ? 'border-[#333333]' : 'border-orange-300'}`} value={novaEmpresaCnpj} onChange={e => setNovaEmpresaCnpj(e.target.value)} />
            <button onClick={adicionarEmpresa} className={`${cssAccentText} hover:opacity-80`}><Plus size={18}/></button>
          </div>
          <button onClick={() => setTemaEscuro(!temaEscuro)} className={`p-2 rounded-full transition-colors ${temaEscuro ? 'bg-[#171717] hover:bg-[#262626]' : 'bg-orange-100 hover:bg-orange-200'}`}>
            {temaEscuro ? <Sun size={20} className="text-gray-300" /> : <Moon size={20} className="text-[#FF6B00]" />}
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`${cssCard} flex flex-col items-center justify-center border-dashed border-2 text-center transition-colors cursor-pointer relative hover:border-[#FF6B00]`}>
            <input type="file" accept=".csv" onChange={importarPlanilha} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <Upload size={32} className={`${cssAccentText} mb-2`} />
            <h3 className="font-semibold uppercase text-sm tracking-wider">Importar CSV</h3>
            <p className={`text-xs mt-1 ${cssTextMuted}`}>{nomeArquivo || "Clique ou arraste o arquivo"}</p>
          </div>

          <div className={cssCard}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${cssTextMuted}`}>Total de Produtos</h3>
            <p className={`text-4xl font-bold ${cssAccentText}`}>{itens.length}</p>
          </div>
          
          <div className={cssCard}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${cssTextMuted}`}>Colunas Mapeadas</h3>
            <p className="text-4xl font-bold text-emerald-500">{colunas.length}</p>
          </div>

          <div className={cssCard}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${cssTextMuted}`}>Empresa Ativa</h3>
            <p className="text-lg font-bold truncate">{empresas.find(e => e.id === empresaAtiva)?.nome}</p>
          </div>
        </div>

        {itens.length > 0 && (
          <div className={`${cssCard} flex flex-col md:flex-row gap-4 items-end`}>
            <div className="flex-1 w-full">
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${cssTextMuted}`}>Se a coluna:</label>
              <select className={cssInput} value={filtroColuna} onChange={(e) => setFiltroColuna(e.target.value)}>
                {colunas.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${cssTextMuted}`}>Começar com:</label>
              <input type="text" placeholder="Ex: 9..." value={filtroValor} onChange={(e) => setFiltroValor(e.target.value)} className={cssInput} />
            </div>
            <div className="flex-1 w-full">
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${cssTextMuted}`}>Alterar a coluna:</label>
              <select className={cssInput} value={alterarColuna} onChange={(e) => setAlterarColuna(e.target.value)}>
                {colunas.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${cssTextMuted}`}>Para o valor:</label>
              <input type="text" placeholder="Ex: 060" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} className={cssInput} />
            </div>
            <button onClick={aplicarEdicaoEmMassa} className={`w-full md:w-auto px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 ${cssButtonPrimary}`}>
              <Edit3 size={18} /> Aplicar
            </button>
          </div>
        )}

        {itens.length > 0 && (
          <div className={`rounded-xl border overflow-hidden ${temaEscuro ? 'bg-[#121212] border-[#262626]' : 'bg-white border-orange-200'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${temaEscuro ? 'border-[#262626]' : 'border-orange-100'}`}>
              <h2 className="font-semibold flex items-center gap-2 uppercase tracking-wide text-sm"><FileSpreadsheet size={18} className={cssAccentText}/> Registros: {nomeArquivo}</h2>
              <div className="flex gap-3">
                <button onClick={() => setItens([])} className="text-sm font-medium text-red-500 hover:text-red-400 flex items-center gap-1 uppercase tracking-wider">
                  <Trash2 size={16}/> Limpar
                </button>
                <button onClick={exportarPlanilha} className={`text-sm font-bold flex items-center gap-1 uppercase tracking-wider ${cssAccentText} hover:opacity-80`}>
                  <Download size={16}/> Exportar CSV
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className={`sticky top-0 z-10 ${temaEscuro ? 'bg-[#0A0A0A] text-[#858585]' : 'bg-orange-50 text-gray-600'}`}>
                  <tr>
                    {colunas.map((col, index) => (
                      <th key={index} className={`p-4 font-bold text-xs tracking-wider uppercase border-b ${temaEscuro ? 'border-[#333333]' : 'border-orange-200'}`}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {itens.slice(0, 100).map((item, rowIndex) => (
                    <tr key={rowIndex} className={`border-b transition-colors hover:${temaEscuro ? 'bg-[#1A1A1A]' : 'bg-orange-50/50'} ${temaEscuro ? 'border-[#262626]' : 'border-orange-100'}`}>
                      {colunas.map((col, colIndex) => (
                        <td key={colIndex} className="p-4 text-gray-300">
                          {col.includes('NCM') || col.includes('CST') ? (
                            <span className={`px-2 py-1 rounded font-bold ${temaEscuro ? 'bg-[#0A0A0A] border border-[#333333] text-[#FF6B00]' : 'bg-orange-100 text-[#FF6B00]'}`}>
                              {item[col] || '-'}
                            </span>
                          ) : (
                            item[col] || '-'
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`p-3 text-center text-xs font-medium uppercase tracking-wider ${temaEscuro ? 'bg-[#0A0A0A] text-gray-600' : 'bg-orange-50 text-gray-500'}`}>
              Exibindo os primeiros 100 registros na tela para performance. A exportação salvará todos os {itens.length} itens.
            </div>
          </div>
        )}

      </main>
    </div>
  );
}