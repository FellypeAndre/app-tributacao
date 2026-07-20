'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, UserPlus, ShieldCheck, Trash2, Mail, X, Save, Lock, Building2, CheckSquare } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

export default function GestaoUsuarios() {
  const { user } = useAuth();
  const router = useRouter();
  
  const isMaster = user?.nivel_acesso === 'MASTER';
  const isAdmin = user?.nivel_acesso === 'ADMIN';
  const temPermissao = isMaster || isAdmin;

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', senha: '', nivel: 'CONTABIL' });

  // Estados do Modal de Vinculação de Empresas
  const [modalEmpresaAberto, setModalEmpresaAberto] = useState(false);
  const [userSelecionado, setUserSelecionado] = useState<any>(null);
  const [todasEmpresas, setTodasEmpresas] = useState<any[]>([]);
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState<string[]>([]);
  const [carregandoEmpresas, setCarregandoEmpresas] = useState(false);
  
  // NOVO: Estado para a barra de pesquisa dentro do modal
  const [buscaEmpresaModal, setBuscaEmpresaModal] = useState('');

  useEffect(() => {
    if (user) {
      if (!temPermissao) router.push('/workspace');
      else carregarUsuarios();
    }
  }, [user, temPermissao, router]);

  const carregarUsuarios = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase.from('usuarios').select('*').order('nome', { ascending: true });
      if (error) throw error;
      setUsuarios(data || []);
    } catch (error: any) {
      alert("Erro ao buscar usuários.");
    } finally {
      setCarregando(false);
    }
  };

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) return alert("Preencha todos os campos obrigatórios.");

    setSalvando(true);
    try {
      const { error } = await supabase.from('usuarios').insert([{
          nome: novoUsuario.nome, email: novoUsuario.email, senha: novoUsuario.senha, nivel_acesso: novoUsuario.nivel
      }]);
      if (error) throw error;

      alert("Usuário adicionado com sucesso!");
      setModalAberto(false);
      setNovoUsuario({ nome: '', email: '', senha: '', nivel: 'CONTABIL' });
      carregarUsuarios();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const abrirModalEmpresas = async (usuarioParaEditar: any) => {
    setUserSelecionado(usuarioParaEditar);
    setModalEmpresaAberto(true);
    setCarregandoEmpresas(true);
    setBuscaEmpresaModal(''); // Limpa a busca do modal ao abrir

    try {
      let queryEmpresas = supabase.from('empresas').select('id, razao_social, cnpj').order('razao_social');

      if (!isMaster && user) {
        const { data: meusAcessos, error: erroMeusAcessos } = await supabase.from('usuario_empresa').select('empresa_id').eq('usuario_id', user.id);
        if (erroMeusAcessos) throw erroMeusAcessos;

        const meusIds = meusAcessos?.map(a => a.empresa_id) || [];
        if (meusIds.length === 0) {
          setTodasEmpresas([]);
          setEmpresasSelecionadas([]);
          setCarregandoEmpresas(false);
          return;
        }
        queryEmpresas = queryEmpresas.in('id', meusIds);
      }

      const resEmpresas = await queryEmpresas;
      if (resEmpresas.error) throw resEmpresas.error;
      setTodasEmpresas(resEmpresas.data || []);

      const resVinculos = await supabase.from('usuario_empresa').select('empresa_id').eq('usuario_id', usuarioParaEditar.id);
      if (resVinculos.error) throw resVinculos.error;

      const vinculadas = resVinculos.data.map(v => v.empresa_id);
      setEmpresasSelecionadas(vinculadas);

    } catch (error) {
      alert("Erro ao buscar dados das empresas.");
    } finally {
      setCarregandoEmpresas(false);
    }
  };

  const toggleEmpresa = (empresaId: string) => {
    setEmpresasSelecionadas(prev => prev.includes(empresaId) ? prev.filter(id => id !== empresaId) : [...prev, empresaId]);
  };

  const handleSalvarVinculos = async () => {
    setSalvando(true);
    try {
      const idsNaTela = todasEmpresas.map(emp => emp.id);
      if (idsNaTela.length > 0) {
         await supabase.from('usuario_empresa').delete().eq('usuario_id', userSelecionado.id).in('empresa_id', idsNaTela);
      }

      if (empresasSelecionadas.length > 0) {
        const inserts = empresasSelecionadas.map(empresaId => ({ usuario_id: userSelecionado.id, empresa_id: empresaId }));
        const { error } = await supabase.from('usuario_empresa').insert(inserts);
        if (error) throw error;
      }

      alert("Acessos atualizados com sucesso!");
      setModalEmpresaAberto(false);
    } catch (error: any) {
      alert(`Erro ao salvar vínculos: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => u.nome?.toLowerCase().includes(busca.toLowerCase()) || u.email?.toLowerCase().includes(busca.toLowerCase()));
  
  // NOVO: Filtro para a barra de pesquisa do Modal de Empresas
  const empresasFiltradasModal = todasEmpresas.filter(emp => 
    emp.razao_social.toLowerCase().includes(buscaEmpresaModal.toLowerCase()) || 
    emp.cnpj.includes(buscaEmpresaModal)
  );

  if (!temPermissao) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
            <Users className="text-[#10B981]" size={28} /> Gestão de Equipe
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Administre os acessos e clientes de cada usuário.</p>
        </div>
        
        <button onClick={() => setModalAberto(true)} className="relative flex justify-center items-center gap-2 px-6 py-3 rounded-xl shadow-[0_8px_30px_rgb(16,185,129,0.2)] transition-all duration-300 text-white font-bold uppercase text-sm bg-[#10B981] hover:bg-[#059669] hover:-translate-y-1">
          <UserPlus size={20} /> Novo Usuário
        </button>
      </div>

      {/* ÁREA DA LISTA DE USUÁRIOS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between gap-4 items-center bg-gray-50/50">
          <div className="relative w-full sm:w-96 group">
            <Search size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-500" />
            <input type="text" placeholder="Buscar usuário..." value={busca} onChange={(e) => setBusca(e.target.value)} disabled={carregando} className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 transition-all shadow-sm" />
          </div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total: {usuariosFiltrados.length}</div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100">Usuário</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100">E-mail</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100">Nível</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {carregando ? (
                <tr><td colSpan={4} className="p-12 text-center text-emerald-500 font-bold uppercase text-xs">Carregando...</td></tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-gray-400">Nenhum usuário encontrado.</td></tr>
              ) : (
                usuariosFiltrados.map((user_row) => (
                  <tr key={user_row.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{user_row.nome?.charAt(0).toUpperCase() || '?'}</div>
                        <span className="font-bold text-gray-700">{user_row.nome}</span>
                      </div>
                    </td>
                    <td className="p-5 text-gray-500 font-medium"><div className="flex items-center gap-2"><Mail size={14}/> {user_row.email}</div></td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-widest ${user_row.nivel_acesso === 'MASTER' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        <ShieldCheck size={12} /> {user_row.nivel_acesso || 'N/A'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(isAdmin && user_row.nivel_acesso === 'MASTER') ? (
                          <div className="p-2 text-gray-300" title="Acesso Negado"><Lock size={18} /></div>
                        ) : (
                          <button onClick={() => abrirModalEmpresas(user_row)} className="p-2 text-gray-400 hover:text-[#059669] hover:bg-emerald-50 rounded-lg transition-colors" title="Atribuir Empresas">
                            <Building2 size={18} />
                          </button>
                        )}
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
      {/* MODAL DE ATRIBUIR EMPRESAS */}
      {/* ========================================== */}
      {modalEmpresaAberto && userSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div>
                <h2 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                  <Building2 className="text-[#10B981]" size={20} /> Permissões de Acesso
                </h2>
                <p className="text-xs text-gray-500 mt-1 font-medium">Selecione quais clientes <strong className="text-gray-700">{userSelecionado.nome}</strong> pode acessar.</p>
              </div>
              <button onClick={() => setModalEmpresaAberto(false)} className="text-gray-400 hover:text-gray-700 p-1 bg-white rounded-full shadow-sm"><X size={20} /></button>
            </div>

            {/* NOVO: BARRA DE PESQUISA DENTRO DO MODAL */}
            {!carregandoEmpresas && todasEmpresas.length > 0 && (
              <div className="p-4 border-b border-gray-100 bg-white shrink-0">
                <div className="relative w-full group">
                  <Search size={18} className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-[#10B981] transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Buscar empresa por nome ou CNPJ..." 
                    value={buscaEmpresaModal}
                    onChange={(e) => setBuscaEmpresaModal(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#10B981] transition-all"
                  />
                </div>
              </div>
            )}

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {carregandoEmpresas ? (
                <div className="py-10 text-center text-emerald-500 font-bold text-xs uppercase animate-pulse">Buscando Clientes...</div>
              ) : todasEmpresas.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  {isMaster ? 'Nenhuma empresa cadastrada no sistema.' : 'Você ainda não possui acesso a nenhuma empresa para atribuir.'}
                </div>
              ) : empresasFiltradasModal.length === 0 ? (
                 <div className="py-10 text-center text-gray-500 text-sm">Nenhuma empresa encontrada com essa busca.</div>
              ) : (
                <div className="space-y-3">
                  {empresasFiltradasModal.map(emp => {
                    const temAcesso = empresasSelecionadas.includes(emp.id);
                    return (
                      <label 
                        key={emp.id} 
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${temAcesso ? 'border-[#10B981] bg-emerald-50/30 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                      >
                        <input type="checkbox" className="hidden" checked={temAcesso} onChange={() => toggleEmpresa(emp.id)} />
                        <div className={`flex items-center justify-center w-6 h-6 rounded border transition-colors ${temAcesso ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-gray-300'}`}>
                          {temAcesso && <CheckSquare size={16} />}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${temAcesso ? 'text-gray-800' : 'text-gray-600'}`}>{emp.razao_social}</p>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{emp.cnpj}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-3">
              <button onClick={() => setModalEmpresaAberto(false)} className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors text-sm uppercase tracking-wider">Cancelar</button>
              <button onClick={handleSalvarVinculos} disabled={salvando} className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50">
                {salvando ? 'Salvando...' : <><Save size={18}/> Salvar Acessos</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE CADASTRO DE USUÁRIO */}
      {/* ========================================== */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                <UserPlus className="text-[#10B981]" size={20} /> Cadastrar Usuário
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-1 bg-white rounded-full shadow-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleCriarUsuario} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Nome Completo</label>
                <input type="text" required value={novoUsuario.nome} onChange={(e) => setNovoUsuario({...novoUsuario, nome: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] outline-none transition-all bg-gray-50 focus:bg-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">E-mail de Acesso</label>
                <input type="email" required value={novoUsuario.email} onChange={(e) => setNovoUsuario({...novoUsuario, email: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] outline-none transition-all bg-gray-50 focus:bg-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Senha Provisória</label>
                <input type="password" required placeholder="Mínimo 6 caracteres" value={novoUsuario.senha} onChange={(e) => setNovoUsuario({...novoUsuario, senha: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] outline-none transition-all bg-gray-50 focus:bg-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Nível de Acesso</label>
                <select value={novoUsuario.nivel} onChange={(e) => setNovoUsuario({...novoUsuario, nivel: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] outline-none transition-all bg-gray-50 focus:bg-white text-sm font-medium text-gray-700">
                  <option value="ADMIN">Administrador</option>
                  <option value="CONTABIL">Contábil</option>
                  <option value="CLIENTE">Cliente</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm uppercase tracking-wider">Cancelar</button>
                <button type="submit" disabled={salvando} className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50">
                  {salvando ? 'Salvando...' : <><Save size={18}/> Cadastrar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}  