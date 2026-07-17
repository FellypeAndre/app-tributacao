'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import { Mail, Lock, LogIn } from 'lucide-react'; // Trocamos Building2 por Mail
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../context/AlertContext'; 

export default function TelaLogin() {
  const { login } = useAuth();
  const { showAlert } = useAlert(); 
  
  // Trocamos o estado de CNPJ para Email
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const executarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TRATAMENTO SÊNIOR: Remove espaços invisíveis no final e força letras minúsculas
    const emailTratado = email.trim().toLowerCase();
    
    if (!emailTratado || !emailTratado.includes('@')) return showAlert("Atenção", "Digite um e-mail válido.", "warning");
    if (!senha) return showAlert("Atenção", "Preencha a senha.", "warning");
    
    setCarregando(true);
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', emailTratado) // Enviando o e-mail limpo
        .eq('senha', senha.trim()) // Removendo espaços sem querer da senha
        .maybeSingle();
      
      setCarregando(false);

      if (error) return showAlert("Erro de Conexão", error.message, "error");
      if (!data) return showAlert("Acesso Negado!", "E-mail ou senha incorretos.", "error");

      login({ 
        id: data.id, 
        nome: data.nome, 
        email: data.email,
        nivel_acesso: data.nivel_acesso
      });

    } catch (err) {
      setCarregando(false);
      showAlert("Erro Servidor", "Falha ao conectar com o servidor.", "error");
    }
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
        
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active {
            transition: background-color 5000s ease-in-out 0s;
            -webkit-text-fill-color: #1f2937 !important;
        }

        .btn-dots-container { display: flex; align-items: center; justify-content: center; height: 24px; }
        .btn-dot { height: 8px; width: 8px; margin-right: 6px; border-radius: 4px; background-color: #ffffff; animation: btn-pulse 1.5s infinite ease-in-out; }
        .btn-dot:last-child { margin-right: 0; }
        .btn-dot:nth-child(1) { animation-delay: -0.4s; }
        .btn-dot:nth-child(2) { animation-delay: -0.3s; }
        .btn-dot:nth-child(3) { animation-delay: -0.2s; }
        .btn-dot:nth-child(4) { animation-delay: -0.1s; }
        .btn-dot:nth-child(5) { animation-delay: 0s; }
        @keyframes btn-pulse { 0%, 100% { transform: scale(0.8); opacity: 0.6; } 50% { transform: scale(1.2); opacity: 1; } }
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

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_0_rgba(16,185,129,0.15)] backdrop-blur-2xl bg-white/40 mx-4">
        <div className="flex flex-col items-center mb-8">
          
          <div className="p-2 bg-[#059669] rounded-2xl shadow-lg shadow-[#10B981]/30 mb-4 border border-emerald-400">
            <Image 
              src="/icone_tax_auditor_transparente.png" 
              alt="Tax Auditor Pro Logo" 
              width={42} 
              height={42} 
              className="object-contain"
              priority
            />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 tracking-widest uppercase drop-shadow-sm">Tax Auditor Pro</h1>
          <p className="text-sm text-gray-600 mt-2 text-center font-medium">Acesso seguro ao workspace</p>
        </div>

        <form onSubmit={executarLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">E-mail Profissional</label>
            <div className="relative">
              {/* Ícone atualizado para Mail */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={18} className="text-gray-500" /></div>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="seu.nome@empresa.com" 
                className="w-full pl-10 pr-4 py-3 bg-white/60 border border-white/50 rounded-xl text-gray-800 placeholder-gray-500 font-medium outline-none focus:bg-white focus:border-[#10B981] transition-all backdrop-blur-md" 
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-500" /></div>
              <input 
                type="password" 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)} 
                placeholder="••••••••" 
                className="w-full pl-10 pr-4 py-3 bg-white/60 border border-white/50 rounded-xl text-gray-800 placeholder-gray-500 font-medium outline-none focus:bg-white focus:border-[#10B981] transition-all backdrop-blur-md" 
              />
            </div>
          </div>
          
          <button type="submit" disabled={carregando || !email} className={`w-full h-[52px] mt-4 text-white font-bold uppercase tracking-wider rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg ${carregando || !email ? 'bg-[#10B981]/70 cursor-not-allowed' : 'bg-[#10B981] hover:bg-[#059669] hover:-translate-y-0.5'}`}>
            {carregando ? (
              <section className="btn-dots-container">
                <div className="btn-dot"/><div className="btn-dot"/><div className="btn-dot"/><div className="btn-dot"/><div className="btn-dot"/>
              </section>
            ) : (
              <><LogIn size={20} /> Acessar Sistema</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}