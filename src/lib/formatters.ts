/**
 * Utilitários centralizados para formatação de valores monetários
 * Padrão: R$ (Real Brasileiro) com exatamente 2 casas decimais
 */

/**
 * Converte valor em reais para centavos (inteiro)
 * Evita problemas de arredondamento com ponto flutuante
 */
export function toCents(valor: number): number {
  return Math.round(valor * 100);
}

/**
 * Converte centavos (inteiro) para valor em reais
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Arredonda valor para 2 casas decimais (padrão monetário)
 * Alias para compatibilidade
 */
export function round2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Arredonda valor para 2 casas decimais (padrão monetário)
 */
export function arredondarMoeda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Formata valor como moeda brasileira (R$) com exatamente 2 casas decimais
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Formata valor compacto para dashboards (ex: R$ 1,2M)
 */
export function formatarMoedaCompacta(valor: number): string {
  if (valor >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(1)}M`;
  }
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

/**
 * Formata valor para exibição em inputs (sem símbolo de moeda)
 * Usa ponto como separador de milhares e vírgula para decimais
 */
export function formatarValorInput(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata percentual com casas decimais configuráveis
 */
export function formatarPercentual(valor: number, casas: number = 2): string {
  return `${valor.toFixed(casas)}%`;
}

/**
 * Parse de valor monetário em string para number
 * Aceita formatos: "1.234,56" ou "1234.56"
 */
export function parseMoeda(valor: string): number {
  // Remove R$ e espaços
  let cleaned = valor.replace(/R\$\s?/g, '').trim();
  
  // Se tem vírgula como decimal (formato brasileiro)
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  
  return parseFloat(cleaned) || 0;
}

/**
 * Parse de valor de input de moeda (apenas dígitos) para number
 * Usado pelo CurrencyInput - converte centavos para reais
 */
export function parseCurrencyInput(value: string): number {
  const numericValue = value.replace(/\D/g, '');
  return numericValue ? Number(numericValue) / 100 : 0;
}
