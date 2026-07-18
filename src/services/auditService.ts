import { supabase } from '../lib/supabase';

export const AuditService = {
  
  // ==========================================
  // 1. LISTAR TODAS (Filtra apenas as da empresa ativa)
  // ==========================================
  async buscarAuditorias(empresaId: string) {
    const { data, error } = await supabase
      .from('auditorias')
      .select('*')
      .eq('empresa_id', empresaId) // Filtro Mágico
      .order('data_criacao', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(dbPasta => ({
      id: dbPasta.id,
      data: new Date(dbPasta.data_criacao).toLocaleDateString('pt-BR'),
      nome: dbPasta.nome_pasta,
      ...dbPasta.dados_json
    }));
  },

  // ==========================================
  // 2. BUSCAR ESPECÍFICA (Trava dupla de segurança)
  // ==========================================
  async buscarAuditoriaPorId(id: string, empresaId: string) {
    const { data, error } = await supabase
      .from('auditorias')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresaId) // Garante que o usuário logado é dono dessa auditoria
      .single();

    if (error) throw new Error('Auditoria não encontrada ou acesso negado.');

    return {
      id: data.id,
      data: new Date(data.data_criacao).toLocaleDateString('pt-BR'),
      nome: data.nome_pasta,
      ...data.dados_json
    };
  },

  // ==========================================
  // 3. SALVAR NOVA (Vinculada à empresa ativa)
  // ==========================================
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

  // ==========================================
  // 4. ATUALIZAR NOME (Trava dupla)
  // ==========================================
  async atualizarNomePasta(id: string, novoNome: string, empresaId: string) {
    const { error } = await supabase
      .from('auditorias')
      .update({ nome_pasta: novoNome })
      .eq('id', id)
      .eq('empresa_id', empresaId); // Ninguém altera nome de pasta dos outros

    if (error) throw new Error(error.message);
  },

  // ==========================================
  // 5. EXCLUIR (Trava dupla)
  // ==========================================
  async excluirAuditoria(id: string, empresaId: string) {
    const { error } = await supabase
      .from('auditorias')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId); // Ninguém apaga pasta dos outros

    if (error) throw new Error(error.message);
  }
};