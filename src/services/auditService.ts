import { supabase } from '../lib/supabase';

export const AuditService = {
  salvarAuditoria: async (empresaId: string, nome: string, payload: any) => {
    const { data, error } = await supabase
      .from('auditorias')
      .insert([
        {
          empresa_id: empresaId,
          nome: nome,
          nome_pasta: 'Geral',
          dados_json: payload, // 🛡️ CORREÇÃO: O nome exato da coluna no Supabase!
          status_sincronizacao: 'AGUARDANDO'
        }
      ])
      .select();

    if (error) {
      console.error("Erro ao salvar no Supabase:", error);
      throw error;
    }
    return data;
  },

  buscarAuditorias: async (empresaId: string) => {
    const { data, error } = await supabase
      .from('auditorias')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};