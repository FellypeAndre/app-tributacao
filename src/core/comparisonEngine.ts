// src/core/comparisonEngine.ts

export interface Divergencia {
  idUnico: string;
  indiceB: number;
  produto: string;
  chave: string;
  colunaDivergente: string;
  valorSistema: any;
  valorContabilidade: any;
}

export function executarComparacao(
  planilhaA: any[], 
  planilhaB: any[], 
  chavePrimaria: string
): Divergencia[] {
  
  const relatorioDivergencias: Divergencia[] = [];
  const mapaContabilidade = new Map(planilhaA.map(item => [item[chavePrimaria], item]));
  const COLUNAS_IGNORADAS = ['DESCRICAO', 'DESCRIÇÃO', 'NOME', 'PRODUTO', 'EAN', 'CODIGO', 'CODIGO_BARRA'];

  planilhaB.forEach((itemB, indexB) => {
    const chaveItemAtual = itemB[chavePrimaria];
    const itemA = mapaContabilidade.get(chaveItemAtual);

    if (itemA) {
      Object.keys(itemB).forEach(coluna => {
        const colunaFormatada = coluna.toUpperCase().trim();
        if (!COLUNAS_IGNORADAS.includes(colunaFormatada)) {
          if (itemA[coluna] !== undefined && String(itemA[coluna]).trim() !== String(itemB[coluna]).trim()) {
            relatorioDivergencias.push({
              idUnico: `${chaveItemAtual}-${coluna}`,
              indiceB: indexB,
              produto: itemB['DESCRICAO'] || itemB['DESCRIÇÃO'] || chaveItemAtual,
              chave: chaveItemAtual,
              colunaDivergente: coluna,
              valorSistema: itemB[coluna],
              valorContabilidade: itemA[coluna]
            });
          }
        }
      });
    }
  });

  return relatorioDivergencias;
}