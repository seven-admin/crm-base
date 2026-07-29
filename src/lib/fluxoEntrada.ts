import type { ConfigVendaPlano } from '@/types/empreendimentos.types';

export interface FluxoEntrada {
  ato: number;
  mensalUnit: number;
  reforcoUnit: number;
  financiamento: number;
  financiamentoPct: number;
  total: number;
}

/** Percentuais padrão do fluxo de entrada quando o empreendimento não tem config. */
export const PLANO_PADRAO: ConfigVendaPlano = {
  ato_pct: 10,
  mensais_pct: 20,
  mensais_qtd: 60,
  reforcos_pct: 10,
  reforcos_qtd: 5,
};

/**
 * Deriva o fluxo de entrada a partir do valor total da unidade. Nada é armazenado
 * no banco — tudo sai daqui. Financiamento é o resto (100 − ato − mensais − reforços).
 *
 * Verificado com a tabela AXIS (apto 401, valor R$ 719.520,47; plano 10/20/10, 60x/5x):
 *   ato = 71.952,05 · mensalUnit = 2.398,40 · reforcoUnit = 14.390,41 · financiamento = 431.712,28
 */
export function calcularFluxo(valor: number, plano: ConfigVendaPlano): FluxoEntrada {
  const total = valor || 0;
  const financiamentoPct = 100 - plano.ato_pct - plano.mensais_pct - plano.reforcos_pct;
  const mensaisTotal = (total * plano.mensais_pct) / 100;
  const reforcosTotal = (total * plano.reforcos_pct) / 100;
  return {
    ato: (total * plano.ato_pct) / 100,
    mensalUnit: plano.mensais_qtd > 0 ? mensaisTotal / plano.mensais_qtd : 0,
    reforcoUnit: plano.reforcos_qtd > 0 ? reforcosTotal / plano.reforcos_qtd : 0,
    financiamento: (total * financiamentoPct) / 100,
    financiamentoPct,
    total,
  };
}
