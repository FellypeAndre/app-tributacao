'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Folder, PieChart as ChartIcon, AlertTriangle, Search, FileDown, Trash2, Edit2, Check, FileSpreadsheet } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AuditService } from '../../../../services/auditService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

const CORES_PIE = ['#10B981', '#EF4444'];

export default function DashboardAuditoria() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pasta, setPasta] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [buscaProduto, setBuscaProduto] = useState('');
  
  const [editandoNome, setEditandoNome] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [renderizarGraficos, setRenderizarGraficos] = useState(false);

  useEffect(() => {
    if (id) carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      const dados = await AuditService.buscarAuditoriaPorId(id);
      setPasta(dados);
      setNovoNome(dados.nome);
      
      setCarregando(false);
      setTimeout(() => { setRenderizarGraficos(true); }, 150);

    } catch (error) {
      alert("Erro ao carregar pasta. Ela pode ter sido excluída.");
      router.push('/workspace');
    }
  };

  const formatarValor = (valor: any) => {
    if (valor === undefined || valor === null) return '(Não informado)';
    if (String(valor).trim() === '') return '(Em Branco)';
    return String(valor);
  };

  const handleSalvarNome = async () => {
    if (!novoNome.trim()) { setEditandoNome(false); return; }
    setProcessandoAcao(true);
    try {
      await AuditService.atualizarNomePasta(id, novoNome);
      setPasta({ ...pasta, nome: novoNome });
      setEditandoNome(false);
    } catch (error: any) {
      alert(`Erro ao atualizar: ${error.message}`);
    } finally {
      setProcessandoAcao(false);
    }
  };

  const handleExcluirAuditoria = async () => {
    const confirmar = window.confirm("Tem certeza que deseja excluir permanentemente esta auditoria?");
    if (!confirmar) return;
    
    setProcessandoAcao(true);
    try {
      await AuditService.excluirAuditoria(id);
      router.push('/workspace');
    } catch (error: any) {
      alert(`Erro ao excluir: ${error.message}`);
      setProcessandoAcao(false);
    }
  };

  const gerarPDF = () => {
    if (!pasta || !pasta.divergencias) return;
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(14);
    doc.text(`Relatorio de Auditoria - ${pasta.nome}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Data: ${pasta.data} | Total Analisado: ${pasta.estatisticas.total}`, 14, 22);

    const linhas = pasta.divergencias.map((div: any) => [
      div.chave,
      String(div.produto).substring(0, 45),
      div.colunaDivergente,
      formatarValor(div.de ?? div.valorSistema),
      formatarValor(div.para ?? div.valorContabilidade)
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Cód / Chave', 'Produto', 'Campo', 'Sistema (Erro)', 'Contabilidade (Certo)']],
      body: linhas,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`Auditoria_${pasta.nome.replace(/\s+/g, '_')}.pdf`);
  };

  const gerarExcel = () => {
    if (!pasta || !pasta.divergencias) return;
    
    const linhasFormatadas = pasta.divergencias.map((div: any) => ({
      'Código / Chave': div.chave,
      'Descrição do Produto': div.produto,
      'Campo Alterado': div.colunaDivergente,
      'Valor no Sistema (Erro)': formatarValor(div.de ?? div.valorSistema),
      'Valor Contábil (Correto)': formatarValor(div.para ?? div.valorContabilidade)
    }));

    const csv = Papa.unparse(linhasFormatadas);
    // Adiciona o BOM do UTF-8 para o Excel Brasileiro abrir com os acentos (ç, á) corretos
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Correcoes_${pasta.nome.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <style dangerouslySetInnerHTML={{__html: `
          .dots-container { display: flex; align-items: center; justify-content: center; }
          .dot { height: 20px; width: 20px; margin-right: 10px; border-radius: 10px; background-color: #a7f3d0; animation: pulse 1.5s infinite ease-in-out; }
          .dot:last-child { margin-right: 0; }
          .dot:nth-child(1) { animation-delay: -0.4s; }
          .dot:nth-child(2) { animation-delay: -0.3s; }
          .dot:nth-child(3) { animation-delay: -0.2s; }
          .dot:nth-child(4) { animation-delay: -0.1s; }
          .dot:nth-child(5) { animation-delay: 0s; }
          @keyframes pulse {
            0% { transform: scale(0.8); background-color: #a7f3d0; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            50% { transform: scale(1.2); background-color: #10B981; box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.8); background-color: #a7f3d0; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          }
        `}} />
        <section className="dots-container mb-6">
          <div className="dot"/><div className="dot"/><div className="dot"/><div className="dot"/><div className="dot"/>
        </section>
        <p className="text-[#10B981] font-bold tracking-widest uppercase text-sm">Carregando Dados...</p>
      </div>
    );
  }

  if (!pasta) return null;

  const divergenciasFiltradas = pasta.divergencias.filter((div: any) => 
    String(div.produto).toLowerCase().includes(buscaProduto.toLowerCase()) || 
    String(div.chave).includes(buscaProduto)
  );

  const cssCard = 'p-5 rounded-xl border shadow-sm bg-white border-emerald-100';

  // O "Segredo" das animações Uiverse convertidas em Tailwind para React Sênior
  const btnUiverseBase = "relative flex justify-center items-center gap-2 px-5 py-2.5 rounded-lg overflow-hidden z-10 shadow-[4px_8px_10px_-3px_rgba(0,0,0,0.356)] transition-all duration-300 text-white font-bold uppercase text-xs";
  const btnEfeitoFundo = "before:absolute before:left-0 before:top-0 before:h-full before:w-0 before:-z-10 before:transition-all before:duration-300 hover:before:w-full";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b pb-4 border-gray-200">
        <div>
          <button onClick={() => router.push('/workspace')} className="flex items-center gap-2 text-sm font-semibold mb-3 text-[#059669] hover:opacity-80">
            <ChevronLeft size={16}/> Voltar para Pastas
          </button>
          
          <div className="flex items-center gap-3">
            <Folder className="text-[#059669]" size={28} />
            
            {editandoNome ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={novoNome} 
                  onChange={(e) => setNovoNome(e.target.value)} 
                  className="px-3 py-1 text-xl font-bold uppercase rounded-lg border border-[#10B981] outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSalvarNome()}
                  disabled={processandoAcao}
                />
                <button onClick={handleSalvarNome} disabled={processandoAcao} className="p-2 bg-[#10B981] text-white rounded-lg hover:bg-[#059669]">
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group">
                <h2 className="text-2xl font-bold uppercase tracking-wide">{pasta.nome}</h2>
                <button onClick={() => setEditandoNome(true)} className="text-gray-400 hover:text-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity" title="Renomear">
                  <Edit2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* BOTÕES COM A ANIMAÇÃO UIVERSE IMPLEMENTADA NO PADRÃO REACT */}
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExcluirAuditoria} disabled={processandoAcao} className={`${btnUiverseBase} ${btnEfeitoFundo} bg-red-600 before:bg-red-500`}>
            <Trash2 size={16}/> {processandoAcao ? 'Aguarde...' : 'Excluir'}
          </button>
          
          <button onClick={gerarPDF} className={`${btnUiverseBase} ${btnEfeitoFundo} bg-orange-600 before:bg-orange-500`}>
            <FileDown size={16}/> Salvar PDF
          </button>

          <button onClick={gerarExcel} className={`${btnUiverseBase} ${btnEfeitoFundo} bg-[#307750] before:bg-[#469b61]`}>
            <FileSpreadsheet size={16}/> Salvar Excel
          </button>
        </div>
      </div>

      {renderizarGraficos ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${cssCard} flex flex-col h-80`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><ChartIcon size={16}/> Saúde dos Produtos</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: 'Corretos', value: pasta.estatisticas.corretos }, { name: 'Com Divergência', value: pasta.estatisticas.comErro }]} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {[0, 1].map((entry, index) => <Cell key={`cell-${index}`} fill={CORES_PIE[index % CORES_PIE.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className={`${cssCard} flex flex-col h-80`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><AlertTriangle size={16}/> Inconsistências por Coluna</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pasta.dadosGraficoBarras} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="coluna" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="erros" fill="#10B981" radius={[4, 4, 0, 0]} name="Qtd. de Erros" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white mt-6 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="font-bold uppercase tracking-wide">Amostra de Relatório</h2>
                <p className="text-xs text-gray-400 mt-1">Exibindo as principais {pasta.divergencias.length} inconsistências.</p>
              </div>
              <div className="relative w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar na amostra..." value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)} className="w-full pl-9 py-2 rounded-lg border bg-gray-50 focus:bg-white border-gray-200 focus:border-[#10B981] outline-none text-sm" />
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 bg-gray-50 text-gray-600 shadow-sm z-10">
                  <tr>
                    <th className="p-4 font-bold text-xs uppercase border-b">Chave</th>
                    <th className="p-4 font-bold text-xs uppercase border-b">Produto</th>
                    <th className="p-4 font-bold text-xs uppercase border-b">Coluna Alterada</th>
                    <th className="p-4 font-bold text-xs uppercase border-b text-red-500">De (Erro)</th>
                    <th className="p-4 font-bold text-xs uppercase border-b text-[#10B981]">Para (Correto)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {divergenciasFiltradas.map((div: any) => (
                    <tr key={div.idUnico} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono text-gray-500">{div.chave}</td>
                      <td className="p-4 text-gray-700 font-medium">{div.produto}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded font-bold text-xs bg-gray-200 text-gray-700">{div.colunaDivergente}</span></td>
                      <td className="p-4 font-medium text-red-500 line-through">
                        {formatarValor(div.de ?? div.valorSistema)}
                      </td>
                      <td className="p-4 font-bold text-[#10B981]">
                        {formatarValor(div.para ?? div.valorContabilidade)}
                      </td>
                    </tr>
                  ))}
                  {divergenciasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum registro encontrado na amostra.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="h-80 bg-emerald-50/50 rounded-xl border border-emerald-100 animate-pulse"></div>
          <div className="h-80 bg-emerald-50/50 rounded-xl border border-emerald-100 animate-pulse"></div>
        </div>
      )}
    </div>
  );
}