'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  nivel_acesso: string;
}

export interface Empresa {
  id: string;
  cnpj: string;
  razao_social: string;
}

interface AuthContextType {
  user: Usuario | null;
  empresaAtiva: Empresa | null;
  loading: boolean;
  login: (dadosUser: Usuario) => void;
  selecionarEmpresa: (empresa: Empresa) => void;
  logout: () => void;
  atualizarUsuario: (novosDados: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();
  
  // Referência para guardar o cronômetro de inatividade
  const timeoutInatividade = useRef<NodeJS.Timeout | null>(null);
  
  // 2 horas = 7.200.000 milissegundos
  const TEMPO_MAXIMO_OCIOSO = 7200000; 

  const logout = () => {
    localStorage.removeItem('@TaxAuditor:token');
    localStorage.removeItem('@TaxAuditor:user');
    localStorage.removeItem('@TaxAuditor:empresa');
    setUser(null);
    setEmpresaAtiva(null);
    
    // Limpa o cronômetro
    if (timeoutInatividade.current) {
      clearTimeout(timeoutInatividade.current);
    }
    
    router.push('/');
  };

  // Função que zera o cronômetro sempre que o usuário mexe no sistema
  const resetarCronometro = () => {
    if (timeoutInatividade.current) {
      clearTimeout(timeoutInatividade.current);
    }
    
    // Só inicia a contagem se o usuário estiver logado
    const token = localStorage.getItem('@TaxAuditor:token');
    if (token) {
      timeoutInatividade.current = setTimeout(() => {
        alert("Sessão expirada por inatividade. Por favor, faça login novamente.");
        logout();
      }, TEMPO_MAXIMO_OCIOSO);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('@TaxAuditor:token');
    const storedUser = localStorage.getItem('@TaxAuditor:user');
    const storedEmpresa = localStorage.getItem('@TaxAuditor:empresa');

    if (token && storedUser) {
      try {
        const payload = JSON.parse(atob(token));
        
        if (Date.now() > payload.exp) {
          logout();
        } else {
          setUser(JSON.parse(storedUser));
          if (storedEmpresa) {
            setEmpresaAtiva(JSON.parse(storedEmpresa));
          }
          // Inicia a contagem de ociosidade
          resetarCronometro();
        }
      } catch (e) {
        logout(); 
      }
    }
    
    setTimeout(() => setLoading(false), 500);

    // ==========================================
    // ESCUTADORES DE ATIVIDADE DO USUÁRIO
    // ==========================================
    const eventosAtividade = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const rastrearAtividade = () => {
      // Se estiver na tela de login, não precisa rodar cronômetro
      if (pathname !== '/') {
        resetarCronometro();
      }
    };

    // Adiciona os "olheiros" na tela
    eventosAtividade.forEach(evento => window.addEventListener(evento, rastrearAtividade));

    // Limpeza de memória quando o sistema é fechado
    return () => {
      eventosAtividade.forEach(evento => window.removeEventListener(evento, rastrearAtividade));
      if (timeoutInatividade.current) clearTimeout(timeoutInatividade.current);
    };
  }, [pathname]);

  const login = (dadosUser: Usuario) => {
    const payload = {
      userId: dadosUser.id,
      exp: Date.now() + 86400000 // Expiração física do token (24 horas)
    };
    
    const token = btoa(JSON.stringify(payload));

    localStorage.setItem('@TaxAuditor:token', token);
    localStorage.setItem('@TaxAuditor:user', JSON.stringify(dadosUser));
    
    setUser(dadosUser);
    resetarCronometro(); // Inicia a contagem logada
  };

  const selecionarEmpresa = (empresa: Empresa) => {
    localStorage.setItem('@TaxAuditor:empresa', JSON.stringify(empresa));
    setEmpresaAtiva(empresa);
  };

  const atualizarUsuario = (novosDados: Partial<Usuario>) => {
    setUser((userAntigo) => {
      if (!userAntigo) return null;
      const userAtualizado = { ...userAntigo, ...novosDados };
      localStorage.setItem('@TaxAuditor:user', JSON.stringify(userAtualizado));
      return userAtualizado;
    });
  };

  return (
    <AuthContext.Provider value={{ user, empresaAtiva, loading, login, selecionarEmpresa, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);