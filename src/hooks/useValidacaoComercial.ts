import { useMemo } from 'react';
import { useConfiguracaoComercial, ConfiguracaoComercial } from './useConfiguracaoComercial';

export interface ValidacaoComercialResult {
  isLoading: boolean;
  config: ConfiguracaoComercial | null;
  validarEntrada: (percentualEntrada: number) => {
    valido: boolean;
    mensagem?: string;
    minimo: number;
  };
  validarParcelasMensais: (quantidade: number) => {
    valido: boolean;
    mensagem?: string;
    maximo: number;
  };
  validarParcelasEntrada: (quantidade: number) => {
    valido: boolean;
    mensagem?: string;
    maximo: number;
  };
  validarParcelasAnuais: (quantidade: number) => {
    valido: boolean;
    mensagem?: string;
    maximo: number;
  };
  getResumoLimites: () => {
    entrada_minima: number;
    max_parcelas_entrada: number;
    max_parcelas_mensais: number;
    limite_parcelas_anuais: number;
    desconto_avista: number;
    taxa_juros_anual: number;
    indice_reajuste: string;
  } | null;
}

export function useValidacaoComercial(empreendimentoId: string | undefined): ValidacaoComercialResult {
  const { data: config, isLoading } = useConfiguracaoComercial(empreendimentoId);

  const validacoes = useMemo(() => {
    const validarEntrada = (percentualEntrada: number) => {
      const minimo = config?.entrada_minima ?? 0;
      if (minimo > 0 && percentualEntrada < minimo) {
        return {
          valido: false,
          mensagem: `Entrada mínima de ${minimo}% não atingida (atual: ${percentualEntrada.toFixed(1)}%)`,
          minimo,
        };
      }
      return { valido: true, minimo };
    };

    const validarParcelasMensais = (quantidade: number) => {
      const maximo = config?.max_parcelas_mensais ?? 0;
      if (maximo > 0 && quantidade > maximo) {
        return {
          valido: false,
          mensagem: `Máximo de ${maximo} parcelas mensais excedido (atual: ${quantidade})`,
          maximo,
        };
      }
      return { valido: true, maximo };
    };

    const validarParcelasEntrada = (quantidade: number) => {
      const maximo = config?.max_parcelas_entrada ?? 0;
      if (maximo > 0 && quantidade > maximo) {
        return {
          valido: false,
          mensagem: `Máximo de ${maximo} parcelas de entrada excedido (atual: ${quantidade})`,
          maximo,
        };
      }
      return { valido: true, maximo };
    };

    const validarParcelasAnuais = (quantidade: number) => {
      const maximo = config?.limite_parcelas_anuais ?? 0;
      if (maximo > 0 && quantidade > maximo) {
        return {
          valido: false,
          mensagem: `Máximo de ${maximo} parcelas anuais excedido (atual: ${quantidade})`,
          maximo,
        };
      }
      return { valido: true, maximo };
    };

    const getResumoLimites = () => {
      if (!config) return null;
      return {
        entrada_minima: config.entrada_minima ?? 0,
        max_parcelas_entrada: config.max_parcelas_entrada ?? 0,
        max_parcelas_mensais: config.max_parcelas_mensais ?? 0,
        limite_parcelas_anuais: config.limite_parcelas_anuais ?? 0,
        desconto_avista: config.desconto_avista ?? 0,
        taxa_juros_anual: config.taxa_juros_anual ?? 0,
        indice_reajuste: config.indice_reajuste ?? 'INCC',
      };
    };

    return {
      validarEntrada,
      validarParcelasMensais,
      validarParcelasEntrada,
      validarParcelasAnuais,
      getResumoLimites,
    };
  }, [config]);

  return {
    isLoading,
    config,
    ...validacoes,
  };
}

// Função utilitária para usar sem hook (em validações síncronas)
export function validarCondicoesVsConfiguracao(
  condicoes: Array<{ tipo_parcela_codigo: string; quantidade: number; valor: number }>,
  valorTotal: number,
  config: ConfiguracaoComercial | null
): Array<{ tipo: 'erro' | 'aviso'; mensagem: string }> {
  const alertas: Array<{ tipo: 'erro' | 'aviso'; mensagem: string }> = [];

  if (!config) return alertas;

  // Calcular totais por tipo
  let totalEntrada = 0;
  let totalParcelasMensais = 0;
  let totalParcelasEntrada = 0;
  let totalParcelasAnuais = 0;

  condicoes.forEach((c) => {
    const subtotal = c.quantidade * c.valor;

    if (c.tipo_parcela_codigo === 'entrada' || c.tipo_parcela_codigo === 'sinal') {
      totalEntrada += subtotal;
      totalParcelasEntrada += c.quantidade;
    } else if (c.tipo_parcela_codigo === 'mensal' || c.tipo_parcela_codigo === 'mensal_serie') {
      totalParcelasMensais += c.quantidade;
    } else if (c.tipo_parcela_codigo === 'anual' || c.tipo_parcela_codigo === 'anual_serie') {
      totalParcelasAnuais += c.quantidade;
    }
  });

  // Validar entrada mínima
  if (config.entrada_minima && config.entrada_minima > 0 && valorTotal > 0) {
    const percentualEntrada = (totalEntrada / valorTotal) * 100;
    if (percentualEntrada < config.entrada_minima) {
      alertas.push({
        tipo: 'aviso',
        mensagem: `Entrada de ${percentualEntrada.toFixed(1)}% está abaixo do mínimo de ${config.entrada_minima}%`,
      });
    }
  }

  // Validar máximo de parcelas de entrada
  if (config.max_parcelas_entrada && totalParcelasEntrada > config.max_parcelas_entrada) {
    alertas.push({
      tipo: 'aviso',
      mensagem: `${totalParcelasEntrada} parcelas de entrada excedem o máximo de ${config.max_parcelas_entrada}`,
    });
  }

  // Validar máximo de parcelas mensais
  if (config.max_parcelas_mensais && totalParcelasMensais > config.max_parcelas_mensais) {
    alertas.push({
      tipo: 'aviso',
      mensagem: `${totalParcelasMensais} parcelas mensais excedem o máximo de ${config.max_parcelas_mensais}`,
    });
  }

  // Validar máximo de parcelas anuais
  if (config.limite_parcelas_anuais && totalParcelasAnuais > config.limite_parcelas_anuais) {
    alertas.push({
      tipo: 'aviso',
      mensagem: `${totalParcelasAnuais} parcelas anuais excedem o máximo de ${config.limite_parcelas_anuais}`,
    });
  }

  return alertas;
}
