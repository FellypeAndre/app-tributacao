export interface Divergencia {
  chave: string;
  colunaDivergente: string;
  valorPlanilha: string; // Valor que está no ERP atualmente (Incorreto)
  valorCorreto: string;  // Valor que veio da Contabilidade (Gabarito)
}

/**
 * Função inteligente para limpar os dados antes de comparar.
 * Ela entende que "18,00%", "18", e " 18.0 " são a mesma coisa.
 */
const normalizarValor = (valor: any): string => {
  if (valor === null || valor === undefined) return '';
  
  // 1. Converte para string, remove espaços nas bordas e deixa tudo maiúsculo
  let texto = String(valor).trim().toUpperCase();

  // 2. Se for vazio, retorna vazio rápido
  if (texto === '') return '';

  // 3. Remove o símbolo de porcentagem
  if (texto.includes('%')) {
    texto = texto.replace('%', '').trim();
  }

  // 4. Se parecer um número com vírgula (ex: 18,50 ou 0,00), troca para ponto
  if (/^[0-9]+,[0-9]+$/.test(texto) || /^[0-9]+,[0-9]+$/.test(texto.replace('-',''))) {
    texto = texto.replace(',', '.');
  }

  // 5. Tenta converter para número matemático para ignorar zeros desnecessários (ex: 18.00 vira 18)
  // Mas CUIDADO: Não podemos fazer isso com NCM, CEST ou CST (ex: CST "00" não pode virar "0", NCM "0102" não pode virar "102")
  // Então só tentamos converter se NÃO for um código que começa com zero, a menos que seja puramente '0.00'
  const ehNumero = !isNaN(Number(texto));
  const comecaComZero = texto.startsWith('0') && texto.length > 1 && !texto.startsWith('0.');
  
  if (ehNumero && !comecaComZero) {
    // Transforma 18.00 em 18, mas preserva a string
    return String(Number(texto));
  }

  return texto;
};

/**
 * Motor central de cruzamento de dados.
 */
export const executarComparacao = (
  planilhaContabilidade: any[], 
  planilhaERP: any[], 
  chavePrimaria: string
): Divergencia[] | null => {
  
  // 1. Verifica se a chave existe nas duas planilhas
  if (!planilhaContabilidade[0].hasOwnProperty(chavePrimaria) || !planilhaERP[0].hasOwnProperty(chavePrimaria)) {
    return null; // Retorna nulo para disparar o alerta na tela
  }

  const divergencias: Divergencia[] = [];

  // 2. Transforma a planilha do ERP em um "Dicionário" (Mapa) para busca super rápida (O(1))
  const mapaERP = new Map();
  planilhaERP.forEach(linha => {
    const valorChave = String(linha[chavePrimaria]).trim();
    if (valorChave) mapaERP.set(valorChave, linha);
  });

  // 3. Colunas que NÃO queremos comparar (são só descritivas ou irrelevantes para o imposto)
  const colunasIgnoradas = [chavePrimaria, 'DESCRICAO', 'CODIGO', 'STATUS', 'TIPO_PRODUTO'];

  // 4. Percorre a planilha da Contabilidade (O Gabarito)
  planilhaContabilidade.forEach(linhaContab => {
    const valorChave = String(linhaContab[chavePrimaria]).trim();
    
    // Se o código de barras não existir no ERP, ignoramos (não dá pra atualizar um produto que não existe)
    if (!valorChave || !mapaERP.has(valorChave)) return;

    const linhaERP = mapaERP.get(valorChave);

    // 5. Compara coluna por coluna
    Object.keys(linhaContab).forEach(coluna => {
      // Ignora colunas descritivas
      if (colunasIgnoradas.includes(coluna.toUpperCase())) return;

      // Só compara se a coluna existir no ERP (Graças ao seu SELECT com 'AS', os nomes devem bater)
      if (linhaERP.hasOwnProperty(coluna)) {
        
        const valorGabarito = normalizarValor(linhaContab[coluna]);
        const valorAtualERP = normalizarValor(linhaERP[coluna]);

        // SE HOUVER DIFERENÇA E O GABARITO NÃO ESTIVER VAZIO
        if (valorGabarito !== valorAtualERP && valorGabarito !== '') {
          divergencias.push({
            chave: valorChave,
            colunaDivergente: coluna.toUpperCase(),
            valorPlanilha: linhaERP[coluna] || 'VAZIO', // Mostra o valor original sujo na tela
            valorCorreto: linhaContab[coluna]           // Mostra o valor original da contab na tela
          });
        }
      }
    });
  });

  return divergencias;
};