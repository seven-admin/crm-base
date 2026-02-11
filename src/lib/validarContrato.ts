import type { Contrato } from '@/types/contratos.types';

export interface PendenciaValidacao {
  campo: string;
  mensagem: string;
  tipo: 'erro' | 'aviso';
}

export interface ResultadoValidacao {
  valido: boolean;
  pendencias: PendenciaValidacao[];
}

export function validarContratoCompleto(contrato: Contrato): ResultadoValidacao {
  const pendencias: PendenciaValidacao[] = [];

  // ============ DADOS DO CLIENTE ============
  if (!contrato.cliente?.nome) {
    pendencias.push({
      campo: 'cliente.nome',
      mensagem: 'Nome do cliente não informado',
      tipo: 'erro'
    });
  }

  if (!contrato.cliente?.cpf) {
    pendencias.push({
      campo: 'cliente.cpf',
      mensagem: 'CPF do cliente não informado',
      tipo: 'erro'
    });
  }

  if (!contrato.cliente?.email) {
    pendencias.push({
      campo: 'cliente.email',
      mensagem: 'E-mail do cliente não informado',
      tipo: 'aviso'
    });
  }

  if (!contrato.cliente?.rg) {
    pendencias.push({
      campo: 'cliente.rg',
      mensagem: 'RG do cliente não informado',
      tipo: 'aviso'
    });
  }

  // Endereço do cliente
  if (!contrato.cliente?.endereco_logradouro || !contrato.cliente?.endereco_cidade) {
    pendencias.push({
      campo: 'cliente.endereco',
      mensagem: 'Endereço do cliente incompleto',
      tipo: 'aviso'
    });
  }

  // ============ UNIDADES ============
  if (!contrato.unidades?.length) {
    pendencias.push({
      campo: 'unidades',
      mensagem: 'Nenhuma unidade vinculada ao contrato',
      tipo: 'erro'
    });
  }

  // ============ VALOR ============
  if (!contrato.valor_contrato || contrato.valor_contrato <= 0) {
    pendencias.push({
      campo: 'valor_contrato',
      mensagem: 'Valor do contrato não informado',
      tipo: 'erro'
    });
  }

  // ============ TEMPLATE/CONTEÚDO ============
  if (!contrato.conteudo_html) {
    pendencias.push({
      campo: 'conteudo_html',
      mensagem: 'Conteúdo do contrato vazio - selecione um template',
      tipo: 'erro'
    });
  }

  // ============ VARIÁVEIS NÃO SUBSTITUÍDAS ============
  if (contrato.conteudo_html) {
    const variaveisNaoSubstituidas = contrato.conteudo_html.match(/\{\{[^}]+\}\}/g);
    if (variaveisNaoSubstituidas?.length) {
      const variaveisUnicas = [...new Set(variaveisNaoSubstituidas)];
      pendencias.push({
        campo: 'variaveis',
        mensagem: `Variáveis não preenchidas: ${variaveisUnicas.slice(0, 5).join(', ')}${variaveisUnicas.length > 5 ? ` e mais ${variaveisUnicas.length - 5}` : ''}`,
        tipo: 'aviso'
      });
    }
  }

  // ============ TEMPLATE ============
  if (!contrato.template_id && !contrato.conteudo_html) {
    pendencias.push({
      campo: 'template',
      mensagem: 'Template do contrato não definido',
      tipo: 'erro'
    });
  }

  // ============ EMPREENDIMENTO ============
  if (!contrato.empreendimento_id) {
    pendencias.push({
      campo: 'empreendimento',
      mensagem: 'Empreendimento não vinculado',
      tipo: 'erro'
    });
  }

  return {
    valido: pendencias.filter(p => p.tipo === 'erro').length === 0,
    pendencias
  };
}

// Função para verificar apenas erros críticos (bloqueia envio)
export function temErrosCriticos(contrato: Contrato): boolean {
  const resultado = validarContratoCompleto(contrato);
  return resultado.pendencias.some(p => p.tipo === 'erro');
}

// Função para contar pendências
export function contarPendencias(contrato: Contrato): { erros: number; avisos: number } {
  const resultado = validarContratoCompleto(contrato);
  return {
    erros: resultado.pendencias.filter(p => p.tipo === 'erro').length,
    avisos: resultado.pendencias.filter(p => p.tipo === 'aviso').length
  };
}
