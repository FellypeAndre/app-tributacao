'use client'

import React, { useState, useEffect } from 'react';
import { Download, Building2, AlertTriangle, CheckCircle2, ArrowRightLeft, Folder, PieChart as ChartIcon, Plus, ChevronLeft, Save, FileText, User, Lock, LogIn, LogOut, Search, Edit2, Check, FileDown } from 'lucide-react';
import Papa from 'papaparse';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { createClient } from '@supabase/supabase-js';

// IMPORTAÇÕES DO GERADOR DE PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. COMPONENTE PRINCIPAL (COM PERSISTÊNCIA DE SESSÃO)
// ==========================================
export default function AppPrincipal() {
  const [sessao, setSessao] = useState<{ id: string, cnpj: string, usuario: string } | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  // Verifica se o usuário já estava logado antes do F5
  useEffect(() => {
    const sessaoSalva = localStorage.getItem('taxAuditorSession');
    if (sessaoSalva) {
      setSessao(JSON.parse(sessaoSalva));
    }
    setCarregandoSessao(false);
  }, []);

  const handleLogin = (dados: { id: string, cnpj: string, usuario: string }) => {
    setSessao(dados);
    localStorage.setItem('taxAuditorSession', JSON.stringify(dados)); // Salva no navegador
  };

  const handleLogout = () => {
    setSessao(null);
    localStorage.removeItem('taxAuditorSession'); // Limpa ao sair
  };

  if (carregandoSessao) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-[#10B981] font-bold uppercase tracking-widest">Carregando Workspace...</div>;
  }

  if (!sessao) {
    return <TelaLogin onLogin={handleLogin} />;
  }

  return <ConciliadorTributario empresaLogada={sessao} onLogout={handleLogout} />;
}

// ==========================================
// 2. TELA DE LOGIN
// ==========================================
function TelaLogin({ onLogin }: { onLogin: (dados: { id: string, cnpj: string, usuario: string }) => void }) {
  const [cnpj, setCnpj] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const mascaraCnpj = (valor: string) => {
    return valor.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
  };

  const executarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cnpj.length < 18) return alert("Digite um CNPJ válido.");
    if (!senha) return alert("Preencha a senha.");
    
    setCarregando(true);
    const { data, error } = await supabase.from('empresas').select('*').eq('cnpj', cnpj).eq('senha', senha).maybeSingle();
    setCarregando(false);

    if (error) return alert(`Erro no banco de dados: ${error.message}`);
    if (!data) return alert("⚠️ Acesso Negado!\n\nNenhuma empresa encontrada com esses dados.");

    onLogin({ id: data.id, cnpj: data.cnpj, usuario: data.nome });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50">
      <style dangerouslySetInnerHTML={{__html: `
        .parallax > use { animation: move-forever 25s cubic-bezier(.55,.5,.45,.5) infinite; }
        .parallax > use:nth-child(1) { animation-delay: -2s; animation-duration: 7s; }
        .parallax > use:nth-child(2) { animation-delay: -3s; animation-duration: 10s; }
        .parallax > use:nth-child(3) { animation-delay: -4s; animation-duration: 13s; }
        .parallax > use:nth-child(4) { animation-delay: -5s; animation-duration: 20s; }
        @keyframes move-forever { 0% { transform: translate3d(-90px,0,0); } 100% { transform: translate3d(85px,0,0); } }
      `}} />
      <div className="absolute bottom-0 left-0 w-full h-[50vh] z-0 overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
          <defs><path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" /></defs>
          <g className="parallax">
            <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(16, 185, 129, 0.15)" />
            <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(16, 185, 129, 0.3)" />
            <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(16, 185, 129, 0.5)" />
            <use xlinkHref="#gentle-wave" x="48" y="7" fill="#10B981" />
          </g>
        </svg>
      </div>
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_0_rgba(16,185,129,0.15)] backdrop-blur-2xl bg-white/40">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-[#10B981] rounded-2xl shadow-lg shadow-[#10B981]/30 mb-4 text-white"><Building2 size={36} /></div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-widest uppercase drop-shadow-sm">Tax Auditor Pro</h1>
          <p className="text-sm text-gray-600 mt-2 text-center font-medium">Acesso seguro ao workspace</p>
        </div>
        <form onSubmit={executarLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">CNPJ da Empresa</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building2 size={18} className="text-gray-500" /></div>
              <input type="text" value={cnpj} onChange={(e) => setCnpj(mascaraCnpj(e.target.value))} placeholder="00.000.000/0000-00" className="w-full pl-10 pr-4 py-3 bg-white/60 border border-white/50 rounded-xl text-gray-800 placeholder-gray-500 font-medium outline-none focus:bg-white focus:border-[#10B981] transition-all backdrop-blur-md" maxLength={18} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-500" /></div>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-white/60 border border-white/50 rounded-xl text-gray-800 placeholder-gray-500 font-medium outline-none focus:bg-white focus:border-[#10B981] transition-all backdrop-blur-md" />
            </div>
          </div>
          <button type="submit" disabled={carregando} className="w-full py-3.5 mt-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold uppercase tracking-wider rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg">
            {carregando ? 'Validando...' : <><LogIn size={20} /> Acessar Sistema</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. SISTEMA DE AUDITORIA 
// ==========================================
function ConciliadorTributario({ empresaLogada, onLogout }: { empresaLogada: { id: string, cnpj: string, usuario: string }, onLogout: () => void }) {
  const [telaAtiva, setTelaAtiva] = useState<'historico' | 'nova' | 'dashboard'>('historico');
  const [todasPastas, setTodasPastas] = useState<any[]>([]);
  const [pastaSelecionada, setPastaSelecionada] = useState<any>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);

  const [buscaPasta, setBuscaPasta] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [novoTituloPasta, setNovoTituloPasta] = useState('');

  useEffect(() => {
    buscarAuditoriasDoBanco();
  }, []);

  const buscarAuditoriasDoBanco = async () => {
    setCarregandoDados(true);
    const { data, error } = await supabase.from('auditorias').select('*').eq('empresa_id', empresaLogada.id).order('created_at', { ascending: false });
    if (!error && data) {
      const pastasFormatadas = data.map(dbPasta => ({
        id: dbPasta.id,
        data: new Date(dbPasta.data_criacao || dbPasta.created_at).toLocaleDateString('pt-BR'),
        nome: dbPasta.nome_pasta,
        ...dbPasta.dados_json
      }));
      setTodasPastas(pastasFormatadas);
    }
    setCarregandoDados(false);
  };

  const pastasFiltradas = todasPastas.filter(p => p.nome.toLowerCase().includes(buscaPasta.toLowerCase()) || p.data.includes(buscaPasta));
  const divergenciasFiltradas = pastaSelecionada?.divergencias?.filter((div: any) => div.produto.toLowerCase().includes(buscaProduto.toLowerCase()) || String(div.chave).includes(buscaProduto)) || [];

  const [planilhaA, setPlanilhaA] = useState<any[]>([]);
  const [nomeArquivoA, setNomeArquivoA] = useState('');
  const [planilhaB, setPlanilhaB] = useState<any[]>([]);
  const [nomeArquivoB, setNomeArquivoB] = useState('');
  const [colunasA, setColunasA] = useState<string[]>([]);
  const [chavePrimaria, setChavePrimaria] = useState('');
  const [divergencias, setDivergencias] = useState<any[]>([]);
  const [comparacaoFeita, setComparacaoFeita] = useState(false);
  const [nomeNovaAuditoria, setNomeNovaAuditoria] = useState('');
  const [salvandoNoBanco, setSalvandoNoBanco] = useState(false);

  const CORES_PIE = ['#10B981', '#EF4444'];

  const salvarNovoTitulo = async () => {
    if (!novoTituloPasta.trim()) { setEditandoTitulo(false); return; }
    const { error } = await supabase.from('auditorias').update({ nome_pasta: novoTituloPasta }).eq('id', pastaSelecionada.id);
    if (error) return alert("Erro ao atualizar o nome da pasta no banco.");
    const pastasAtualizadas = todasPastas.map(p => p.id === pastaSelecionada.id ? { ...p, nome: novoTituloPasta } : p);
    setTodasPastas(pastasAtualizadas);
    setPastaSelecionada({ ...pastaSelecionada, nome: novoTituloPasta });
    setEditandoTitulo(false);
  };

  const resetarNovaConciliacao = () => {
    setPlanilhaA([]); setNomeArquivoA(''); setPlanilhaB([]); setNomeArquivoB('');
    setColunasA([]); setChavePrimaria(''); setDivergencias([]); setComparacaoFeita(false); setNomeNovaAuditoria('');
  };

  const abrirNovaConciliacao = () => { resetarNovaConciliacao(); setTelaAtiva('nova'); };
  const abrirDashboard = (pasta: any) => { setPastaSelecionada(pasta); setBuscaProduto(''); setTelaAtiva('dashboard'); };

  const lerCSV = (file: File, isPlanilhaA: boolean) => {
    if (!file.name.toLowerCase().endsWith('.csv')) return alert("Envie um arquivo .CSV.");
    if (isPlanilhaA) setNomeArquivoA(file.name); else setNomeArquivoB(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      Papa.parse(text, {
        header: true, skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) return alert("Arquivo vazio.");
          if (isPlanilhaA) {
            setPlanilhaA(results.data);
            const cols = results.meta?.fields || Object.keys(results.data[0]);
            setColunasA(cols);
            setChavePrimaria(cols.find(c => c.toUpperCase().includes('BARRA') || c.toUpperCase().includes('CODIGO')) || cols[0]);
          } else {
            setPlanilhaB(results.data);
          }
        }
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const executarComparacao = () => {
    if (!chavePrimaria) return alert("Selecione a chave (ex: CODIGO_BARRA).");
    if (planilhaA.length === 0 || planilhaB.length === 0) return alert("Importe as duas planilhas!");

    const relatorioDivergencias: any[] = [];
    const mapaContabilidade = new Map(planilhaA.map(item => [item[chavePrimaria], item]));
    const COLUNAS_IGNORADAS = ['DESCRICAO', 'DESCRIÇÃO', 'NOME', 'PRODUTO', 'EAN', 'CODIGO', 'CODIGO_BARRA'];

    planilhaB.forEach((itemB, indexB) => {
      const chaveItemAtual = itemB[chavePrimaria];
      const itemA = mapaContabilidade.get(chaveItemAtual);

      if (itemA) {
        Object.keys(itemB).forEach(coluna => {
          const colunaFormatada = coluna.toUpperCase().trim();
          if (!COLUNAS_IGNORADAS.includes(colunaFormatada)) {
            if (itemA[coluna] !== undefined && String(itemA[coluna]).trim() !== String(itemB[coluna]).trim()) {
              relatorioDivergencias.push({
                idUnico: `${chaveItemAtual}-${coluna}`,
                indiceB: indexB,
                produto: itemB['DESCRICAO'] || itemB['DESCRIÇÃO'] || chaveItemAtual,
                chave: chaveItemAtual,
                colunaDivergente: coluna,
                valorSistema: itemB[coluna],
                valorContabilidade: itemA[coluna]
              });
            }
          }
        });
      }
    });
    setDivergencias(relatorioDivergencias);
    setComparacaoFeita(true);
  };

  const salvarAuditoriaBanco = async () => {
    if (!nomeNovaAuditoria) return alert("Dê um nome para esta auditoria.");
    setSalvandoNoBanco(true);
    
    const planilhaCorrigida = [...planilhaB];
    divergencias.forEach(div => { planilhaCorrigida[div.indiceB][div.colunaDivergente] = div.valorContabilidade; });

    const totalProdutos = planilhaB.length;
    const produtosComErro = new Set(divergencias.map(d => d.chave)).size;
    const produtosCorretos = totalProdutos - produtosComErro;

    const errosPorColuna: Record<string, number> = {};
    divergencias.forEach(div => { errosPorColuna[div.colunaDivergente] = (errosPorColuna[div.colunaDivergente] || 0) + 1; });
    const dadosGraficoBarras = Object.keys(errosPorColuna).map(key => ({ coluna: key, erros: errosPorColuna[key] })).sort((a, b) => b.erros - a.erros);

    // OTIMIZAÇÃO: Salvamos a Planilha Corrigida e as Divergências. Ignoramos as originais.
    const dadosJson = {
      estatisticas: { total: totalProdutos, comErro: produtosComErro, corretos: produtosCorretos },
      dadosGraficoBarras,
      divergencias: divergencias,
      arquivos: { sistemaCorrigido: planilhaCorrigida } // Omitimos contabilidade e sistema antigo
    };

    const novaDataCriacao = new Date().toISOString();

    const { data, error } = await supabase.from('auditorias').insert([{ 
        empresa_id: empresaLogada.id, nome_pasta: nomeNovaAuditoria, data_criacao: novaDataCriacao, dados_json: dadosJson 
    }]).select().single();

    setSalvandoNoBanco(false);

    if (error || !data) return alert(`Erro do Supabase: ${error?.message}`);

    const novaPastaFrontend = {
      id: data.id,
      data: new Date(novaDataCriacao).toLocaleDateString('pt-BR'),
      nome: nomeNovaAuditoria,
      ...dadosJson
    };

    setTodasPastas([novaPastaFrontend, ...todasPastas]);
    abrirDashboard(novaPastaFrontend);
  };

  const baixarPlanilha = (dados: any[], nomeBase: string) => {
    if (!dados || dados.length === 0) return alert("Planilha não disponível no banco de dados.");
    const csv = Papa.unparse(dados);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${nomeBase}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // FUNÇÃO DE GERAR PDF (jsPDF + autoTable)
  // ==========================================
  const gerarPDFRelatorio = () => {
    if (!pastaSelecionada || !pastaSelecionada.divergencias) return;

    const doc = new jsPDF('landscape'); // Formato paisagem para caber a tabela
    
    // Cabeçalho do PDF
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text(`Relatório de Auditoria Fiscal - ${pastaSelecionada.nome}`, 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Empresa (CNPJ): ${empresaLogada.cnpj}   |   Data da Conciliação: ${pastaSelecionada.data}`, 14, 22);
    doc.text(`Total de Produtos Corrigidos: ${pastaSelecionada.estatisticas.comErro}`, 14, 28);

    // Corpo da Tabela
    const linhas = pastaSelecionada.divergencias.map((div: any) => [
      div.chave,
      String(div.produto).substring(0, 45), // Limita o tamanho do texto para não quebrar a linha
      div.colunaDivergente,
      div.valorSistema || '(vazio)',
      div.valorContabilidade || '(vazio)'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Cód / Chave', 'Descrição do Produto', 'Campo Corrigido', 'Estava no Sistema', 'Atualizado Para']],
      body: linhas,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // Cor Esmeralda #10B981
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40 },
        3: { cellWidth: 30, textColor: [239, 68, 68] }, // Vermelho
        4: { cellWidth: 30, textColor: [16, 185, 129], fontStyle: 'bold' } // Verde
      }
    });

    doc.save(`Auditoria_${pastaSelecionada.nome.replace(/\s+/g, '_')}.pdf`);
  };

  const cssCard = 'p-5 rounded-xl border shadow-sm bg-white border-emerald-100';
  const cssInput = 'w-full p-2.5 rounded-lg border outline-none transition-all bg-white border-gray-200 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20';
  const cssButtonPrimary = 'bg-[#10B981] hover:bg-[#059669] text-white font-semibold shadow-lg transition-transform hover:scale-105';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 transition-colors duration-200">
      
      {/* HEADER */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTelaAtiva('historico')}>
          <div className="p-2.5 rounded-xl shadow-lg bg-[#10B981] text-white"><Building2 size={22} /></div>
          <div>
            <h1 className="font-bold text-lg tracking-tight uppercase">Tax Auditor Pro</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#059669]">CNPJ: {empresaLogada.cnpj}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50">
            <User size={14} className="text-[#059669]" />
            <span className="text-xs font-medium text-[#059669]">{empresaLogada.usuario}</span>
          </div>
          <button onClick={onLogout} className="p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400" title="Sair"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* TELA 1: HISTÓRICO */}
        {telaAtiva === 'historico' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-wide">Auditorias da Empresa</h2>
                <p className="text-gray-500 mt-1">Gerenciando as pastas salvas no banco de dados</p>
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Buscar pasta..." value={buscaPasta} onChange={(e) => setBuscaPasta(e.target.value)} className={`${cssInput} pl-10`} />
                </div>
                <button onClick={abrirNovaConciliacao} className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 ${cssButtonPrimary}`}><Plus size={18} /> Nova Conciliação</button>
              </div>
            </div>

            {carregandoDados ? (
              <div className="flex justify-center items-center py-20 text-[#10B981]"><Folder className="animate-pulse mr-2" /> Carregando pastas do banco...</div>
            ) : todasPastas.length === 0 ? (
              <div className={`${cssCard} border-dashed flex flex-col items-center justify-center py-20 text-center`}>
                <Folder size={48} className="text-gray-400 mb-4" />
                <h3 className="font-semibold text-lg">Nenhuma pasta salva</h3>
                <p className="text-gray-500 max-w-md mt-2">Clique em "Nova Conciliação" para criar a primeira auditoria no banco.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pastasFiltradas.map((pasta) => (
                  <div key={pasta.id} onClick={() => abrirDashboard(pasta)} className={`${cssCard} cursor-pointer hover:border-[#10B981] transition-all hover:shadow-lg group`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors"><Folder size={24} className="text-[#059669]" /></div>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">{pasta.data}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1 truncate uppercase" title={pasta.nome}>{pasta.nome}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                      <div className="flex items-center gap-1"><AlertTriangle size={14} className="text-red-500"/> {pasta.estatisticas.comErro} Erros</div>
                      <div className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500"/> {pasta.estatisticas.corretos} OK</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TELA 2: NOVA CONCILIAÇÃO */}
        {telaAtiva === 'nova' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <button onClick={() => setTelaAtiva('historico')} className="flex items-center gap-2 text-sm font-semibold mb-2 text-[#059669] hover:opacity-80"><ChevronLeft size={16}/> Voltar para Pastas</button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${cssCard} border-dashed border-2 relative hover:border-[#10B981] transition-colors`}>
                <input type="file" accept=".csv" onChange={(e) => lerCSV(e.target.files![0], true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="flex flex-col items-center justify-center text-center">
                  <CheckCircle2 size={32} className="text-[#10B981] mb-2" />
                  <h3 className="font-bold uppercase tracking-wider">1. Planilha da Contabilidade</h3>
                  <p className="text-xs text-[#10B981] font-medium mt-1 uppercase">A Base de Dados Correta</p>
                  {nomeArquivoA && <p className="mt-3 text-sm font-medium bg-[#10B981]/10 text-[#059669] px-3 py-1 rounded-full">{nomeArquivoA}</p>}
                </div>
              </div>
              <div className={`${cssCard} border-dashed border-2 relative hover:border-red-500 transition-colors`}>
                <input type="file" accept=".csv" onChange={(e) => lerCSV(e.target.files![0], false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="flex flex-col items-center justify-center text-center">
                  <AlertTriangle size={32} className="text-red-500 mb-2" />
                  <h3 className="font-bold uppercase tracking-wider">2. Planilha do Sistema</h3>
                  <p className="text-xs text-red-500 font-medium mt-1 uppercase">Os dados que precisam de correção</p>
                  {nomeArquivoB && <p className="mt-3 text-sm font-medium bg-red-500/10 text-red-600 px-3 py-1 rounded-full">{nomeArquivoB}</p>}
                </div>
              </div>
            </div>

            {(planilhaA.length > 0 && planilhaB.length > 0) && !comparacaoFeita && (
              <div className={`${cssCard} flex flex-col md:flex-row gap-4 items-end`}>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Chave de Ligação:</label>
                  <select className={cssInput} value={chavePrimaria} onChange={(e) => setChavePrimaria(e.target.value)}>{colunasA.map(col => <option key={col} value={col}>{col}</option>)}</select>
                </div>
                <button onClick={executarComparacao} className={`w-full md:w-auto px-8 py-3 rounded-lg flex items-center justify-center gap-2 ${cssButtonPrimary}`}><ArrowRightLeft size={18} /> Mapear Divergências</button>
              </div>
            )}

            {comparacaoFeita && (
              <div className={`${cssCard} bg-emerald-500/5 border-emerald-500/20`}>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-[#059669] uppercase flex items-center gap-2"><CheckCircle2/> Comparação Concluída!</h3>
                    <p className="text-sm mt-1 text-gray-500">Encontradas {divergencias.length} inconsistências.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <input type="text" placeholder="Nome da Pasta..." value={nomeNovaAuditoria} onChange={e => setNomeNovaAuditoria(e.target.value)} className={`${cssInput} w-64`} />
                    <button onClick={salvarAuditoriaBanco} disabled={salvandoNoBanco} className={`px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 ${cssButtonPrimary} ${salvandoNoBanco ? 'opacity-70' : ''}`}>
                      <Save size={18} /> {salvandoNoBanco ? 'Salvando BD...' : 'Salvar Relatório'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TELA 3: DASHBOARD */}
        {telaAtiva === 'dashboard' && pastaSelecionada && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b pb-4 border-gray-200">
              <div>
                <button onClick={() => setTelaAtiva('historico')} className="flex items-center gap-2 text-sm font-semibold mb-2 text-[#059669] hover:opacity-80"><ChevronLeft size={16}/> Voltar para Pastas</button>
                <div className="flex items-center gap-3">
                  <Folder className="text-[#059669]" size={28} />
                  {editandoTitulo ? (
                    <div className="flex items-center gap-2">
                      <input type="text" value={novoTituloPasta} onChange={(e) => setNovoTituloPasta(e.target.value)} className={`${cssInput} py-1 text-xl font-bold uppercase w-64`} autoFocus onKeyDown={(e) => e.key === 'Enter' && salvarNovoTitulo()} />
                      <button onClick={salvarNovoTitulo} className="p-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg"><Check size={18} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setNovoTituloPasta(pastaSelecionada.nome); setEditandoTitulo(true); }}>
                      <h2 className="text-2xl font-bold uppercase tracking-wide">{pastaSelecionada.nome}</h2>
                      <Edit2 size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-[#10B981]" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* BOTÃO DO GERADOR DE PDF NOVO */}
                <button onClick={gerarPDFRelatorio} className="p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold uppercase border border-blue-200 hover:bg-blue-50 text-blue-600">
                  <FileDown size={14}/> Relatório PDF
                </button>
                
                {/* SOMENTE A PLANILHA CORRIGIDA */}
                {pastaSelecionada.arquivos?.sistemaCorrigido && (
                  <button onClick={() => baixarPlanilha(pastaSelecionada.arquivos.sistemaCorrigido, `SISTEMA_CORRIGIDO_${pastaSelecionada.nome}`)} className={`p-2 px-4 rounded-lg flex items-center gap-2 text-xs font-bold uppercase ${cssButtonPrimary}`}>
                    <Download size={14}/> Baixar Planilha Corrigida
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${cssCard} flex flex-col h-80`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><ChartIcon size={16}/> Saúde dos Produtos</h3>
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: 'Corretos', value: pastaSelecionada.estatisticas.corretos }, { name: 'Com Divergência', value: pastaSelecionada.estatisticas.comErro }]} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{[0, 1].map((entry, index) => <Cell key={`cell-${index}`} fill={CORES_PIE[index % CORES_PIE.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={36} /></PieChart></ResponsiveContainer>
              </div>
              <div className={`${cssCard} flex flex-col h-80`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><AlertTriangle size={16}/> Inconsistências por Coluna</h3>
                <ResponsiveContainer width="100%" height="100%"><BarChart data={pastaSelecionada.dadosGraficoBarras} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}><XAxis dataKey="coluna" /><YAxis /><Tooltip /><Bar dataKey="erros" fill="#10B981" radius={[4, 4, 0, 0]} name="Qtd. de Erros" /></BarChart></ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white mt-6">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold uppercase tracking-wide">Relatório Detalhado</h2>
                <div className="relative w-80"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Buscar produto ou chave..." value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)} className={`${cssInput} pl-9 py-2 text-sm`} /></div>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 bg-gray-50 text-gray-600">
                    <tr><th className="p-4 font-bold text-xs uppercase border-b">Chave</th><th className="p-4 font-bold text-xs uppercase border-b">Produto</th><th className="p-4 font-bold text-xs uppercase border-b">Coluna Alterada</th><th className="p-4 font-bold text-xs uppercase border-b text-red-500">De (Erro)</th><th className="p-4 font-bold text-xs uppercase border-b text-[#10B981]">Para (Correto)</th></tr>
                  </thead>
                  <tbody className="text-sm">
                    {divergenciasFiltradas.map((div: any) => (
                      <tr key={div.idUnico} className="border-b hover:bg-gray-50"><td className="p-4 font-mono text-gray-500">{div.chave}</td><td className="p-4 text-gray-600">{div.produto}</td><td className="p-4"><span className="px-2 py-1 rounded font-bold text-xs bg-gray-200 text-gray-700">{div.colunaDivergente}</span></td><td className="p-4 font-medium text-red-500 line-through">{div.valorSistema || '(Vazio)'}</td><td className="p-4 font-bold text-[#10B981]">{div.valorContabilidade || '(Vazio)'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}