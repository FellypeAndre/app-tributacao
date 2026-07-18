'use client'

import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, ShieldCheck, Edit2, Trash2, Mail, X, Save, Lock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext'; // 1. IMPORTAMOS O CONTEXTO DE AUTENTICAÇÃO

export default function GestaoUsuarios() {
  const { user } = useAuth(); // 2. PUXAMOS O USUÁRIO LOGADO
  
  // Agora o sistema libera tanto para ADMIN quanto para MASTER
  const isAdmin = user?.nivel_acesso === 'ADMIN' || user?.nivel_acesso === 'MASTER';

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Estados do Modal de Cadastro
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    senha: '',
    nivel: 'AUDITOR' 
  });

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, nivel_acesso')
        .order('nome', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error: any) {
      alert("Erro ao buscar a lista de usuários no servidor.");
    } finally {
      setCarregando(false);
    }
  };

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) {
      return alert("Preencha todos os campos obrigatórios.");
    }

    setSalvando(true);
    try {
      // CORREÇÃO APLICADA: Agora estamos enviando a 'senha' para o banco!
      const { error } = await supabase
        .from('usuarios')
        .insert([{
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          senha: novoUsuario.senha, // Faltava essa linha!
          nivel_acesso: novoUsuario.nivel
        }]);

      if (error) throw error;

      alert("Usuário adicionado com sucesso!");
      
      setModalAberto(false);
      setNovoUsuario({ nome: '', email: '', senha: '', nivel: 'AUDITOR' });
      carregarUsuarios();

    } catch (error: any) {
      alert(`Erro ao criar usuário: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome?.toLowerCase().includes(busca.toLowerCase()) || 
    u.email?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
            <Users className="text-[#10B981]" size={28} />
            Gestão de Equipe
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Administre os acessos e permissões dos usuários do sistema.</p>
        </div>
        
        {/* PERMISSÃO APLICADA: Botão só aparece se for ADMIN */}
        {isAdmin ? (
          <button 
            onClick={() => setModalAberto(true)}
            className="relative flex justify-center items-center gap-2 px-6 py-3 rounded-xl overflow-hidden z-10 shadow-[0_8px_30px_rgb(16,185,129,0.2)] transition-all duration-300 text-white font-bold uppercase text-sm bg-[#10B981] hover:bg-[#059669] hover:-translate-y-1"
          >
            <UserPlus size={20} /> Novo Usuário
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-gray-500 text-xs font-bold uppercase tracking-wider">
            <Lock size={14} /> Leitura Apenas
          </div>
        )}
      </div>

      {/* ÁREA DA LISTA DE USUÁRIOS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 items-center bg-gray-50/50">
          <div className="relative w-full sm:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              disabled={carregando}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm disabled:bg-gray-100" 
            />
          </div>
          
          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Total: {usuariosFiltrados.length}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100">Usuário</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100">E-mail</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100">Nível</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100 text-center">Status</th>
                {/* PERMISSÃO APLICADA: Cabeçalho de Ações oculto para não-admins */}
                {isAdmin && <th className="p-5 font-bold text-xs uppercase tracking-wider border-b border-gray-100 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {carregando ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-8 w-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                      <span className="text-emerald-500 font-bold tracking-widest uppercase text-xs">Carregando Banco de Dados...</span>
                    </div>
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="p-12 text-center text-gray-400 font-medium">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((user) => {
                  const statusVisual = user.status || 'ATIVO';
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            {user.nome?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="font-bold text-gray-700">{user.nome}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                          <Mail size={14} className="text-gray-400"/> {user.email}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-widest">
                          <ShieldCheck size={12} /> {user.nivel_acesso || 'N/A'}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest ${statusVisual === 'ATIVO' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                          {statusVisual}
                        </span>
                      </td>
                      {/* PERMISSÃO APLICADA: Botões de excluir só renderizam para ADMIN */}
                      {isAdmin && (
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SÓ RENDERIZA SE FOR ADMIN E ESTIVER ABERTO */}
      {modalAberto && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                <UserPlus className="text-[#10B981]" size={20} />
                Cadastrar Usuário
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-1 bg-white rounded-full shadow-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCriarUsuario} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Carlos Silva"
                  value={novoUsuario.nome}
                  onChange={(e) => setNovoUsuario({...novoUsuario, nome: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] outline-none transition-all bg-gray-50 focus:bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">E-mail de Acesso</label>
                <input 
                  type="email" 
                  required
                  placeholder="usuario@empresa.com"
                  value={novoUsuario.email}
                  onChange={(e) => setNovoUsuario({...novoUsuario, email: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] outline-none transition-all bg-gray-50 focus:bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Senha Provisória</label>
                <input 
                  type="password" 
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={novoUsuario.senha}
                  onChange={(e) => setNovoUsuario({...novoUsuario, senha: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] outline-none transition-all bg-gray-50 focus:bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Nível de Acesso</label>
                <select 
                  value={novoUsuario.nivel}
                  onChange={(e) => setNovoUsuario({...novoUsuario, nivel: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] outline-none transition-all bg-gray-50 focus:bg-white text-sm font-medium text-gray-700"
                >
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                  <option value="AUDITOR">Auditor (Pode cruzar dados)</option>
                  <option value="CLIENTE">Cliente (Apenas visualização)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setModalAberto(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={salvando}
                  className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50"
                >
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