import { useMemo } from 'react';
import { Negociacao } from '@/types/negociacoes.types';

export interface ValidacaoFichaProposta {
  fichaCompleta: boolean;
  pendencias: string[];
  percentualCompleto: number;
  podesolicitarReserva: boolean;
}

export function useValidacaoFichaProposta(negociacao: Negociacao | null): ValidacaoFichaProposta {
  return useMemo(() => {
    if (!negociacao) {
      return {
        fichaCompleta: false,
        pendencias: ['Negociação não encontrada'],
        percentualCompleto: 0,
        podesolicitarReserva: false,
      };
    }

    const pendencias: string[] = [];
    const totalChecks = 6;
    let completedChecks = 0;

    // 1. Cliente vinculado
    if (!negociacao.cliente_id) {
      pendencias.push('Cliente não vinculado');
    } else {
      completedChecks++;
      
      // 1.1 Verificar dados do cliente
      const cliente = negociacao.cliente;
      if (cliente) {
        if (!cliente.cpf) pendencias.push('CPF do cliente não preenchido');
        if (!cliente.email) pendencias.push('E-mail do cliente não preenchido');
        if (!cliente.estado_civil) pendencias.push('Estado civil do cliente não preenchido');
      }
    }

    // 2. Empreendimento selecionado
    if (!negociacao.empreendimento_id) {
      pendencias.push('Empreendimento não selecionado');
    } else {
      completedChecks++;
    }

    // 3. Unidades selecionadas
    if (!negociacao.unidades || negociacao.unidades.length === 0) {
      pendencias.push('Nenhuma unidade selecionada');
    } else {
      completedChecks++;
    }

    // 4. Valor total definido
    if (!negociacao.valor_negociacao || negociacao.valor_negociacao <= 0) {
      pendencias.push('Valor total não definido');
    } else {
      completedChecks++;
    }

    // 5. Corretor vinculado (opcional mas importante)
    if (!negociacao.corretor_id) {
      pendencias.push('Corretor não vinculado');
    } else {
      completedChecks++;
    }

    // 6. Condições de pagamento (verificar via contagem - assumimos existência)
    // Por enquanto assumimos completo se tem valor
    if (negociacao.valor_negociacao && negociacao.valor_negociacao > 0) {
      completedChecks++;
    } else {
      pendencias.push('Condições de pagamento não definidas');
    }

    const fichaCompleta = pendencias.length === 0;
    const percentualCompleto = Math.round((completedChecks / totalChecks) * 100);
    
    // Só pode solicitar reserva se ficha estiver completa
    const podesolicitarReserva = fichaCompleta;

    return {
      fichaCompleta,
      pendencias,
      percentualCompleto,
      podesolicitarReserva,
    };
  }, [negociacao]);
}

// Hook simples para verificar ficha sem detalhes
export function useFichaCompleta(negociacao: Negociacao | null): boolean {
  const validacao = useValidacaoFichaProposta(negociacao);
  return validacao.fichaCompleta;
}
