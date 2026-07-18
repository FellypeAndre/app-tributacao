'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

// ============================================================================
// 1. AS NOVAS INTERFACES (Espelho do Banco de Dados)
// ============================================================================
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
  empresaAtiva: Empresa | null; // O CNPJ que está sendo auditado no momento
  loading: boolean;
  login: (dadosUser: Usuario) => void;
  selecionarEmpresa: (empresa: Empresa) => void; // Função para alternar clientes
  logout: () => void;
  atualizarUsuario: (novosDados: Partial<Usuario>) => void; // A NOSSA FUNÇÃO MÁGICA AQUI
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// ============================================================================
// 2. O PROVEDOR DE CONTEXTO (Motor de Segurança)
// ============================================================================
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validação de Sessão Segura ao atualizar a página (F5)
    const token = localStorage.getItem('@TaxAuditor:token');
    const storedUser = localStorage.getItem('@TaxAuditor:user');
    const storedEmpresa = localStorage.getItem('@TaxAuditor:empresa');

    if (token && storedUser) {
      try {
        const payload = JSON.parse(atob(token));
        
        // Verifica se o token de 24h já venceu
        if (Date.now() > payload.exp) {
          logout();
        } else {
          // Restaura o usuário
          setUser(JSON.parse(storedUser));
          
          // Se ele já tinha escolhido um CNPJ antes de dar F5, restaura também
          if (storedEmpresa) {
            setEmpresaAtiva(JSON.parse(storedEmpresa));
          }
        }
      } catch (e) {
        logout(); // Token adulterado
      }
    }
    
    // Delay de 500ms para a animação das bolinhas verdes brilhar
    setTimeout(() => setLoading(false), 500);
  }, []);

  const login = (dadosUser: Usuario) => {
    // Gera o Token de 24 horas
    const payload = {
      userId: dadosUser.id,
      exp: Date.now() + 86400000 
    };
    
    const token = btoa(JSON.stringify(payload));

    localStorage.setItem('@TaxAuditor:token', token);
    localStorage.setItem('@TaxAuditor:user', JSON.stringify(dadosUser));
    
    setUser(dadosUser);
    
    // OBS: Note que no login NÃO setamos a empresaAtiva. 
    // O usuário precisa selecionar o CNPJ na próxima tela!
  };

  const selecionarEmpresa = (empresa: Empresa) => {
    // Salva a escolha do CNPJ e libera o acesso ao Dashboard
    localStorage.setItem('@TaxAuditor:empresa', JSON.stringify(empresa));
    setEmpresaAtiva(empresa);
  };

  // ============================================================================
  // FUNÇÃO MÁGICA: Atualiza o estado visual e a memória (localStorage) na mesma hora
  // ============================================================================
  const atualizarUsuario = (novosDados: Partial<Usuario>) => {
    setUser((userAntigo) => {
      if (!userAntigo) return null;
      
      const userAtualizado = { ...userAntigo, ...novosDados };
      
      // Salva no localStorage para não perder a edição se o usuário apertar F5
      localStorage.setItem('@TaxAuditor:user', JSON.stringify(userAtualizado));
      
      return userAtualizado;
    });
  };

  const logout = () => {
    localStorage.removeItem('@TaxAuditor:token');
    localStorage.removeItem('@TaxAuditor:user');
    localStorage.removeItem('@TaxAuditor:empresa');
    setUser(null);
    setEmpresaAtiva(null);
  };

  return (
    <AuthContext.Provider value={{ user, empresaAtiva, loading, login, selecionarEmpresa, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);