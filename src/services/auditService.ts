import { supabase } from '../lib/supabase';

export const AuditService = {
  
  async buscarAuditorias(empresaId: string) {
    const { data, error } = await supabase
      .from('auditorias')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data_criacao', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(dbPasta => ({
      id: dbPasta.id,
      data: new Date(dbPasta.data_criacao).toLocaleDateString('pt-BR'),
      nome: dbPasta.nome_pasta,
      ...dbPasta.dados_json
    }));
  },

  async buscarAuditoriaPorId(id: string) {
    const { data, error } = await supabase
      .from('auditorias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      data: new Date(data.data_criacao).toLocaleDateString('pt-BR'),
      nome: data.nome_pasta,
      ...data.dados_json
    };
  },

  async salvarAuditoria(empresaId: string, nomePasta: string, dadosJson: any) {
    const novaDataCriacao = new Date().toISOString();

    const { data, error } = await supabase
      .from('auditorias')
      .insert([{ 
        empresa_id: empresaId, 
        nome_pasta: nomePasta,
        data_criacao: novaDataCriacao,
        dados_json: dadosJson 
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      data: new Date(novaDataCriacao).toLocaleDateString('pt-BR'),
      nome: nomePasta,
      ...dadosJson
    };
  },

  async atualizarNomePasta(id: string, novoNome: string) {
    const { error } = await supabase
      .from('auditorias')
      .update({ nome_pasta: novoNome })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // NOVO MÉTODO: Exclui a pasta definitivamente do banco
  async excluirAuditoria(id: string) {
    const { error } = await supabase
      .from('auditorias')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};