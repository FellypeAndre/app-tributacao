'use client'

import React, { useState } from 'react';
import { UserCircle, Mail, Shield, Key, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

export default function MeuPerfil() {
  // Puxamos o contexto como 'any' para o TypeScript não reclamar enquanto você adiciona a nova função
  const auth = useAuth() as any; 
  const user = auth.user;
  
  const [nome, setNome] = useState(user?.nome || '');
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [sucessoNome, setSucessoNome] = useState(false);
  const [erroNome, setErroNome] = useState('');

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [sucessoSenha, setSucessoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState('');

  // ==========================================
  // ATUALIZAR NOME (COM MÁGICA SILENCIOSA)
  // ==========================================
  const handleSalvarNome = async () => {
    setErroNome('');
    if (!nome.trim()) return setErroNome("O nome não pode ficar vazio.");
    
    setSalvandoNome(true);
    try {
      // O .select() força o banco a nos devolver a linha alterada. 
      // Se voltar vazio, sabemos que a segurança do banco (RLS) bloqueou.
      const { data, error } = await supabase
        .from('usuarios')
        .update({ nome: nome })
        .eq('id', user?.id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Permissão negada no Banco de Dados. Verifique as políticas (RLS) da tabela usuários.");
      }

      // A MÁGICA ACONTECE AQUI: Atualizamos a memória do site na mesma hora!
      if (auth.atualizarUsuario) {
        auth.atualizarUsuario({ nome: nome }); // Avisa o Cabeçalho e o Menu para mudarem sozinhos
      } else if (user) {
        user.nome = nome; // Plano B caso você ainda não tenha colocado a função no AuthContext
      }

      setSucessoNome(true);
      setTimeout(() => setSucessoNome(false), 3000);
      
    } catch (error: any) {
      setErroNome(`Erro: ${error.message}`);
    } finally {
      setSalvandoNome(false);
    }
  };

  // ==========================================
  // ATUALIZAR SENHA 
  // ==========================================
  const handleSalvarSenha = async () => {
    setErroSenha('');
    
    if (novaSenha.length < 6) return setErroSenha("A senha deve ter pelo menos 6 caracteres.");
    if (novaSenha !== confirmarSenha) return setErroSenha("As senhas não conferem.");

    setSalvandoSenha(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) throw error;

      setSucessoSenha(true);
      setNovaSenha('');
      setConfirmarSenha('');
      setTimeout(() => setSucessoSenha(false), 4000);

    } catch (error: any) {
      setErroSenha(`Erro ao atualizar senha: ${error.message}`);
    } finally {
      setSalvandoSenha(false);
    }
  };

  const cssCard = 'bg-white rounded-3xl border border-gray-100 shadow-sm p-8';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      
      <div className="border-b pb-6 border-gray-200 mb-6">
        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
          <UserCircle className="text-[#10B981]" size={28} />
          Meu Perfil
        </h1>
        <p className="text-gray-500 mt-1 text-sm font-medium">Gerencie suas informações pessoais e credenciais de acesso.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: Avatar */}
        <div className={`${cssCard} md:col-span-1 flex flex-col items-center text-center h-fit`}>
          <div className="w-24 h-24 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg mb-4 border-4 border-emerald-50 transition-all duration-300">
            {nome.charAt(0).toUpperCase()}
          </div>
          <h2 className="font-bold text-gray-800 text-lg transition-all duration-300">{nome}</h2>
          <p className="text-gray-500 text-sm mb-4">{user?.email}</p>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-widest border border-emerald-100">
            <Shield size={12} /> Nível: {user?.nivel_acesso}
          </div>
        </div>

        {/* COLUNA DIREITA: Formulários */}
        <div className="md:col-span-2 space-y-6">
          
          {/* NOME */}
          <div className={cssCard}>
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm flex items-center gap-2 mb-6">
              <UserCircle size={18} className="text-gray-400"/> Dados Pessoais
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Nome Completo</label>
                <input 
                  type="text" 
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] focus:ring-2 focus:ring-emerald-50 outline-none transition-all bg-gray-50 focus:bg-white text-gray-700 font-medium"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">E-mail de Acesso</label>
                <div className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-medium cursor-not-allowed">
                  <Mail size={18} className="text-gray-400" />
                  {user?.email}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-4">
                {erroNome && <span className="text-sm font-bold text-red-500 flex items-center gap-1"><AlertCircle size={16}/> {erroNome}</span>}
                {sucessoNome && <span className="text-sm font-bold text-emerald-500 flex items-center gap-1 animate-in fade-in"><CheckCircle2 size={16}/> Salvo com sucesso!</span>}
                
                <button 
                  onClick={handleSalvarNome}
                  disabled={salvandoNome}
                  className="px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18}/> {salvandoNome ? 'Salvando...' : 'Atualizar Nome'}
                </button>
              </div>
            </div>
          </div>

          {/* SENHA */}
          <div className={cssCard}>
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm flex items-center gap-2 mb-6">
              <Key size={18} className="text-gray-400"/> Alterar Senha de Acesso
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Nova Senha</label>
                  <input type="password" placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] focus:ring-2 focus:ring-emerald-50 outline-none transition-all bg-gray-50 focus:bg-white text-gray-700" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Confirmar Nova Senha</label>
                  <input type="password" placeholder="Repita a senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#10B981] focus:ring-2 focus:ring-emerald-50 outline-none transition-all bg-gray-50 focus:bg-white text-gray-700" />
                </div>
              </div>

              {erroSenha && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl flex items-center gap-2"><AlertCircle size={16} /> {erroSenha}</div>}

              <div className="pt-4 flex items-center justify-end gap-4">
                {sucessoSenha && <span className="text-sm font-bold text-emerald-500 flex items-center gap-1 animate-in fade-in"><CheckCircle2 size={16}/> Senha alterada com sucesso!</span>}
                <button onClick={handleSalvarSenha} disabled={salvandoSenha || !novaSenha || !confirmarSenha} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Key size={18}/> {salvandoSenha ? 'Processando...' : 'Alterar Senha'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}