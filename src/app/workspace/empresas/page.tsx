'use client'

import React from 'react';
import { Building, Plus, Search, Wrench } from 'lucide-react';

export default function GestaoEmpresas() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
            <Building className="text-[#10B981]" size={28} />
            Gestão de Empresas
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Cadastre e gerencie os clientes (CNPJs) do seu sistema.</p>
        </div>
        
        <button className="relative flex justify-center items-center gap-2 px-6 py-3 rounded-xl overflow-hidden z-10 shadow-[0_8px_30px_rgb(16,185,129,0.2)] transition-all duration-300 text-white font-bold uppercase text-sm bg-[#10B981] hover:bg-[#059669] hover:-translate-y-1">
          <Plus size={20} /> Nova Empresa
        </button>
      </div>

      {/* ÁREA PRINCIPAL - PLACEHOLDER */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 items-center bg-gray-50/50 rounded-t-2xl">
          <div className="relative w-full sm:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar por Razão Social ou CNPJ..." 
              disabled
              className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium outline-none cursor-not-allowed text-gray-400" 
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/30 border-dashed border-b border-x border-gray-200 rounded-b-2xl">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
            <Wrench size={40} className="text-emerald-500" />
          </div>
          <h3 className="font-black text-gray-700 text-xl mb-2">Módulo em Desenvolvimento</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            A arquitetura para o gerenciamento de múltiplos Tenants (Empresas) está sendo planejada. Esta tela será responsável por gerenciar os CNPJs, configurações fiscais e certificados digitais.
          </p>
        </div>

      </div>
    </div>
  );
}