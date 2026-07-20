'use client'

import React, { useState, useEffect } from 'react';
import { Building, Search, Plus, Edit2, Trash2, X, Save, Activity, Database, Key } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

export default function GestaoEmpresas() {
  const { user } = useAuth();
  
  // Apenas MASTER ou ADMIN podem gerenciar as empresas
  const temPermissao = user?.nivel_acesso === 'MASTER' || user?.nivel_acesso === 'ADMIN';

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novaEmpresa, setNovaEmpresa] = useState({ 
    razao_social: '', 
    cnpj: '', 
    tipo_integracao: 'MANUAL', // MANUAL, API_ERP, AGENTE_LOCAL
    token_integracao: '' 
  });

  useEffect(() => {
    if (temPermissao) carregarEmpresas();
  }, [temPermissao]);

  const carregarEmpresas = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase.from('empresas').select('*').order('razao_social');
      if (error) throw error;
      setEmpresas(data || []);
    } catch (error: any) {
      alert("Erro ao buscar empresas.");
    } finally {
      setCarregando(false);
    }
  };

  // ==========================================
  // SALVAR OU EDITAR EMPRESA NO BANCO
  // ==========================================
  const handleSalvarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!novaEmpresa.razao_social || !novaEmpresa.cnpj) return alert("Preencha Razão Social e CNPJ.");

    // Se escolheu integração automática e não gerou token, cria um aleatório simples (MOCK)
    let tokenFinal = novaEmpresa.token_integracao;
    if (novaEmpresa.tipo_integracao !== 'MANUAL' && !tokenFinal) {
      tokenFinal = `tax_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    setSalvando(true);
    try {
      const { error } = await supabase.from('empresas').insert([{
          razao_social: novaEmpresa.razao_social,
          cnpj: novaEmpresa.cnpj,
          tipo_integracao: novaEmpresa.tipo_integracao,
          token_integracao: tokenFinal
      }]);
      
      if (error) throw error;

      alert("Empresa adicionada com sucesso!");
      setModalAberto(false);
      setNovaEmpresa({ razao_social: '', cnpj: '', tipo_integracao: 'MANUAL', token_integracao: '' });
      carregarEmpresas();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const empresasFiltradas = empresas.filter(e => 
    e.razao_social?.toLowerCase().includes(busca.toLowerCase()) || 
    e.cnpj?.includes(busca)
  );

  if (!temPermissao) return (
    <div className="p-10 text-center text-gray-500 font-bold">Você não tem permissão para acessar esta tela.</div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
            <Building className="text-[#10B981]" size={28} /> Gestão de Empresas
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Cadastre os clientes e configure a sincronização com os ERPs.</p>
        </div>
        
        <button onClick={() => setModalAberto(true)} className="relative flex justify-center items-center gap-2 px-6 py-3 rounded-xl shadow-[0_8px_30px_rgb(16,185,129,0.2)] transition-all duration-300 text-white font-bold uppercase text-sm bg-[#10B981] hover:bg-[#059669] hover:-translate-y-1">
          <Plus size={20} /> Nova Empresa
        </button>
      </div>

      {/* ÁREA DA LISTA */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between gap-4 items-center bg-gray-50/50">
          <div className="relative w-full sm:w-96 group">
            <Search size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-500" />
            <input type="text" placeholder="Buscar por Razão Social ou CNPJ..." value={busca} onChange={(e) => setBusca(e.target.value)} disabled={carregando} className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 transition-all shadow-sm" />
          </div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total: {empresasFiltradas.length}</div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100">Razão Social</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100">CNPJ</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100">Conexão ERP</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {carregando ? (
                <tr><td colSpan={4} className="p-12 text-center text-emerald-500 font-bold uppercase text-xs">Carregando...</td></tr>
              ) : empresasFiltradas.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-gray-400">Nenhuma empresa encontrada.</td></tr>
              ) : (
                empresasFiltradas.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-5 font-bold text-gray-700">{emp.razao_social}</td>
                    <td className="p-5 text-gray-500 font-medium">{emp.cnpj}</td>
                    <td className="p-5">
                      {/* INDICADOR VISUAL DE INTEGRAÇÃO */}
                      {emp.tipo_integracao === 'MANUAL' || !emp.tipo_integracao ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 font-bold text-[10px] uppercase tracking-widest">
                          <Activity size={12} /> Planilha (Manual)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 font-bold text-[10px] uppercase tracking-widest border border-blue-100">
                          <Database size={12} /> Integrado ({emp.tipo_integracao === 'API_ERP' ? 'API' : 'Agente'})
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit2 size={18} /></button>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL DE CADASTRO */}
      {/* ========================================== */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                <Building className="text-[#10B981]" size={20} /> Cadastrar Empresa
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-700 p-1 bg-white rounded-full shadow-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleSalvarEmpresa} className="p-6 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Razão Social / Nome Fantasia</label>
                  <input type="text" required placeholder="Ex: Supermercado Preço Bom" value={novaEmpresa.razao_social} onChange={(e) => setNovaEmpresa({...novaEmpresa, razao_social: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] outline-none transition-all bg-gray-50 focus:bg-white text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">CNPJ</label>
                  <input type="text" required placeholder="00.000.000/0000-00" value={novaEmpresa.cnpj} onChange={(e) => setNovaEmpresa({...novaEmpresa, cnpj: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] outline-none transition-all bg-gray-50 focus:bg-white text-sm" />
                </div>
              </div>

              {/* SEÇÃO DE INTEGRAÇÃO */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#059669] mb-4 flex items-center gap-2">
                  <Database size={14}/> Sincronização com o ERP
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Modo de Operação</label>
                    <select 
                      value={novaEmpresa.tipo_integracao} 
                      onChange={(e) => setNovaEmpresa({...novaEmpresa, tipo_integracao: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] outline-none transition-all bg-gray-50 focus:bg-white text-sm font-medium text-gray-700"
                    >
                      <option value="MANUAL">Somente Planilhas (CSV)</option>
                      <option value="API_ERP">Integração Direta (API REST)</option>
                      <option value="AGENTE_LOCAL">Agente Instalado (Banco de Dados Local)</option>
                    </select>
                  </div>

                  {novaEmpresa.tipo_integracao !== 'MANUAL' && (
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 animate-in slide-in-from-top-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-blue-800 flex items-center gap-2">
                        <Key size={14}/> Token de Integração (Gerado Automaticamente)
                      </label>
                      <p className="text-xs text-blue-600 font-medium">O token de segurança será gerado ao salvar a empresa. Ele será usado pelo Agente ou ERP para se conectar a este sistema com segurança.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm uppercase tracking-wider">Cancelar</button>
                <button type="submit" disabled={salvando} className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50">
                  {salvando ? 'Salvando...' : <><Save size={18}/> Salvar Cliente</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}