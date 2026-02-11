import type { TemplateCondicaoPagamento, ContratoCondicaoPagamento } from '@/types/condicoesPagamento.types';
import { 
  valorExtenso, 
  formatarValorMonetario, 
  formatarDataExtenso, 
  quantidadePorExtenso,
  numeroExtenso 
} from './numeroExtenso';

type CondicaoPagamento = TemplateCondicaoPagamento | ContratoCondicaoPagamento;

const INDICE_TEXTOS: Record<string, string> = {
  'INCC': 'INCC – Índice Nacional de Custo da Construção',
  'IPCA': 'IPCA – Índice Nacional de Preços ao Consumidor Amplo',
  'IGP-M': 'IGP-M – Índice Geral de Preços do Mercado',
  'CUB': 'CUB – Custo Unitário Básico da Construção Civil',
};

function getIndiceTexto(indice: string): string {
  return INDICE_TEXTOS[indice] || indice;
}

function getIndiceAbreviado(indice: string): string {
  // Retorna apenas a sigla
  return indice || 'INCC';
}

function gerarTextoCorrecao(condicao: CondicaoPagamento): string {
  if (!condicao.com_correcao) {
    return 'sem correção monetária';
  }
  
  const indiceTexto = getIndiceTexto(condicao.indice_correcao);
  return `corrigida monetariamente pelo ${indiceTexto}, ou outro índice oficial que venha a substituí-lo`;
}

function gerarTextoCorrecaoResumido(condicao: CondicaoPagamento): string {
  if (!condicao.com_correcao) {
    return 'sem correção monetária';
  }
  
  const indice = getIndiceAbreviado(condicao.indice_correcao);
  return `corrigida monetariamente pelo ${indice}`;
}

function gerarTextoVeiculo(condicao: CondicaoPagamento): string {
  const partes: string[] = [];
  
  if (condicao.bem_marca) partes.push(condicao.bem_marca);
  if (condicao.bem_modelo) partes.push(condicao.bem_modelo);
  if (condicao.bem_ano) partes.push(`ano/modelo ${condicao.bem_ano}`);
  if (condicao.bem_placa) partes.push(`placa ${condicao.bem_placa}`);
  if (condicao.bem_cor) partes.push(`cor ${condicao.bem_cor}`);
  
  let texto = partes.join(', ');
  
  if (condicao.bem_valor_avaliado) {
    texto += `, avaliado pelo valor de ${formatarValorMonetario(condicao.bem_valor_avaliado)} (${valorExtenso(condicao.bem_valor_avaliado)})`;
  }
  
  return texto;
}

function gerarTextoImovel(condicao: CondicaoPagamento): string {
  const partes: string[] = [];
  
  if (condicao.bem_descricao) partes.push(condicao.bem_descricao);
  if (condicao.bem_endereco) partes.push(`localizado em ${condicao.bem_endereco}`);
  if (condicao.bem_matricula && condicao.bem_cartorio) {
    partes.push(`registrado sob matrícula nº ${condicao.bem_matricula} no ${condicao.bem_cartorio}`);
  }
  if (condicao.bem_area_m2) partes.push(`com área de ${condicao.bem_area_m2}m²`);
  
  let texto = partes.join(', ');
  
  if (condicao.bem_valor_avaliado) {
    texto += `, avaliado pelo valor de ${formatarValorMonetario(condicao.bem_valor_avaliado)} (${valorExtenso(condicao.bem_valor_avaliado)})`;
  }
  
  return texto;
}

function gerarTextoFormaPagamento(condicao: CondicaoPagamento): string {
  switch (condicao.forma_pagamento) {
    case 'boleto':
      return 'por meio de boleto bancário';
    case 'ted':
      return 'por meio de transferência bancária (TED)';
    case 'pix':
      return 'por meio de PIX';
    case 'cheque':
      return 'por meio de cheque';
    case 'nota_fiscal':
      return 'mediante emissão de Nota Fiscal';
    default:
      return '';
  }
}

// Gerar texto para entrada
function gerarTextoEntrada(condicao: CondicaoPagamento): string {
  const valor = condicao.valor || 0;
  const valorFormatado = formatarValorMonetario(valor);
  const valorExtensoTexto = valorExtenso(valor);
  
  let texto = `ENTRADA: ${valorFormatado} (${valorExtensoTexto})`;
  
  if (condicao.forma_quitacao === 'veiculo') {
    texto += `, quitada mediante dação em pagamento do veículo ${gerarTextoVeiculo(condicao)}`;
  } else if (condicao.forma_quitacao === 'imovel') {
    texto += `, quitada mediante dação em pagamento do imóvel ${gerarTextoImovel(condicao)}`;
  } else if (condicao.forma_quitacao === 'outro_bem') {
    texto += `, quitada mediante dação em pagamento de ${condicao.bem_descricao || 'bem'}`;
    if (condicao.bem_valor_avaliado) {
      texto += `, avaliado em ${formatarValorMonetario(condicao.bem_valor_avaliado)}`;
    }
  }
  
  if (condicao.data_vencimento) {
    texto += `, com vencimento em ${formatarDataExtenso(condicao.data_vencimento)}`;
  } else if (condicao.evento_vencimento === 'assinatura') {
    texto += `, no ato da assinatura deste instrumento`;
  }
  
  if (condicao.observacao_texto) {
    texto += `. ${condicao.observacao_texto}`;
  }
  
  return texto;
}

// Gerar texto para parcela mensal individual
function gerarTextoMensalIndividual(condicao: CondicaoPagamento): string {
  const valor = condicao.valor || 0;
  const valorFormatado = formatarValorMonetario(valor);
  const valorExtensoTexto = valorExtenso(valor);
  const quantidade = condicao.quantidade || 1;
  
  let texto = '';
  
  if (condicao.tipo_parcela_codigo === 'mensal_fixa') {
    texto = quantidadePorExtenso(quantidade, 'parcela mensal', 'parcelas mensais');
    texto += ` no valor de ${valorFormatado} (${valorExtensoTexto})`;
    
    if (condicao.data_vencimento) {
      texto += `, com vencimento em ${formatarDataExtenso(condicao.data_vencimento)}`;
    }
    
    texto += `, ${gerarTextoCorrecao(condicao)}`;
  } else if (condicao.tipo_parcela_codigo === 'mensal_serie') {
    texto = quantidadePorExtenso(quantidade, 'parcela mensal', 'parcelas mensais');
    texto += `, iguais e sucessivas, no valor de ${valorFormatado} (${valorExtensoTexto}) cada`;
    
    if (condicao.data_vencimento) {
      texto += `, com vencimento da primeira em ${formatarDataExtenso(condicao.data_vencimento)}`;
      texto += `, vencendo-se as demais no mesmo dia dos meses subsequentes`;
    }
    
    if (condicao.parcelas_sem_correcao > 0 && condicao.com_correcao) {
      texto += `, sendo ${quantidadePorExtenso(condicao.parcelas_sem_correcao, 'a primeira parcela', 'as primeiras parcelas')} sem correção monetária e as demais ${gerarTextoCorrecaoResumido(condicao)}`;
    } else {
      texto += `, todas ${gerarTextoCorrecao(condicao)}`;
    }
  }
  
  return texto;
}

// Gerar texto para intermediária individual (para sub-items)
function gerarTextoIntermediariaItem(condicao: CondicaoPagamento): string {
  const valor = condicao.valor || 0;
  const valorFormatado = formatarValorMonetario(valor);
  const valorExtensoTexto = valorExtenso(valor);
  
  let texto = `${valorFormatado} (${valorExtensoTexto})`;
  
  if (condicao.data_vencimento) {
    texto += `, com vencimento em ${formatarDataExtenso(condicao.data_vencimento)}`;
  }
  
  return texto;
}

// Gerar texto para residual
function gerarTextoResidual(condicao: CondicaoPagamento): string {
  const valor = condicao.valor || 0;
  const valorFormatado = formatarValorMonetario(valor);
  const valorExtensoTexto = valorExtenso(valor);
  
  let texto = `PARCELA RESIDUAL FINAL: ${valorFormatado} (${valorExtensoTexto})`;
  
  if (condicao.evento_vencimento === 'habite_se') {
    texto += ` a ser paga em parcela única, no ato da entrega do Habite-se da referida unidade`;
  } else if (condicao.evento_vencimento === 'entrega_chaves') {
    texto += ` a ser paga em parcela única, no ato da entrega das chaves`;
  } else if (condicao.data_vencimento) {
    texto += `, com vencimento em ${formatarDataExtenso(condicao.data_vencimento)}`;
  }
  
  if (condicao.com_correcao) {
    texto += `, ${gerarTextoCorrecao(condicao)}`;
  }
  
  if (condicao.observacao_texto) {
    texto += `. ${condicao.observacao_texto}`;
  }
  
  return texto;
}

// Gerar texto para corretagem
function gerarTextoCorretagem(condicao: CondicaoPagamento): string {
  const valor = condicao.valor || 0;
  const valorFormatado = formatarValorMonetario(valor);
  const valorExtensoTexto = valorExtenso(valor);
  
  let texto = `CORRETAGEM: Valor de ${valorFormatado} (${valorExtensoTexto})`;
  
  if (condicao.observacao_texto) {
    texto += `. ${condicao.observacao_texto}`;
  }
  
  return texto;
}

export function gerarTextoCondicoesPagamento(condicoes: CondicaoPagamento[]): string {
  if (!condicoes.length) return '';
  
  // Ordenar por ordem
  const ordenadas = [...condicoes].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  
  // Separar por grupos
  const entradas = ordenadas.filter(c => c.tipo_parcela_codigo === 'entrada');
  const mensais = ordenadas.filter(c => ['mensal_fixa', 'mensal_serie'].includes(c.tipo_parcela_codigo));
  const intermediarias = ordenadas.filter(c => c.tipo_parcela_codigo === 'intermediaria');
  const residuais = ordenadas.filter(c => c.tipo_parcela_codigo === 'residual');
  const corretagens = ordenadas.filter(c => c.tipo_parcela_codigo === 'corretagem');
  
  const linhas: string[] = [];
  const letras = 'abcdefghijklmnopqrstuvwxyz'.split('');
  let letraIndex = 0;
  
  // Introdução
  linhas.push('O saldo do preço, após a entrada ajustada, será pago pelo COMPRADOR à PROMITENTE VENDEDORA nas seguintes condições:\n');
  linhas.push('O COMPRADOR pagará:\n');
  
  // a) Entradas
  if (entradas.length > 0) {
    entradas.forEach((entrada, idx) => {
      const letra = letras[letraIndex] || (letraIndex + 1).toString();
      linhas.push(`${letra}) ${gerarTextoEntrada(entrada)};`);
      letraIndex++;
    });
  }
  
  // b) Parcelas mensais
  if (mensais.length > 0) {
    const letra = letras[letraIndex] || (letraIndex + 1).toString();
    letraIndex++;
    
    // Gerar cada linha mensal
    mensais.forEach((mensal, idx) => {
      const textoMensal = gerarTextoMensalIndividual(mensal);
      if (idx === 0) {
        linhas.push(`${letra}) ${textoMensal};`);
      } else {
        linhas.push(`${textoMensal};`);
      }
    });
    
    // Texto sobre forma de pagamento
    const condicoesDinheiro = mensais.filter(c => c.forma_quitacao === 'dinheiro' || !c.forma_quitacao);
    if (condicoesDinheiro.length > 0) {
      linhas.push(`\nTodas as parcelas previstas neste item "${letra}" deverão ser pagas por meio de boleto bancário exclusivamente pela PROMITENTE VENDEDORA, valendo os respectivos comprovantes como prova regular da quitação.`);
    }
  }
  
  // c) Intermediárias
  if (intermediarias.length > 0) {
    const letra = letras[letraIndex] || (letraIndex + 1).toString();
    letraIndex++;
    
    if (intermediarias.length === 1) {
      // Parcela única intermediária
      const inter = intermediarias[0];
      const valor = inter.valor || 0;
      const valorFormatado = formatarValorMonetario(valor);
      const valorExtensoTexto = valorExtenso(valor);
      
      let texto = `${letra}) Parcela intermediária ("balão") no valor de ${valorFormatado} (${valorExtensoTexto})`;
      
      if (inter.data_vencimento) {
        texto += `, com vencimento em ${formatarDataExtenso(inter.data_vencimento)}`;
      }
      
      texto += `, ${gerarTextoCorrecao(inter)}.`;
      linhas.push(texto);
    } else {
      // Múltiplas intermediárias - agrupar
      const totalIntermediarias = intermediarias.length;
      const cabecalho = `${letra}) ${quantidadePorExtenso(totalIntermediarias, 'parcela intermediária', 'parcelas intermediárias')} ("balões"), sendo:`;
      linhas.push(cabecalho);
      
      // Listar cada intermediária
      intermediarias.forEach((inter, idx) => {
        const textoItem = gerarTextoIntermediariaItem(inter);
        const isLast = idx === intermediarias.length - 1;
        
        if (isLast) {
          // Última parcela - adicionar texto de correção
          const temCorrecao = intermediarias.some(i => i.com_correcao);
          if (temCorrecao) {
            const indice = getIndiceAbreviado(intermediarias[0].indice_correcao);
            linhas.push(`${textoItem}, ambas corrigidas monetariamente pelo ${indice}, ou índice oficial que venha a substituí-lo.`);
          } else {
            linhas.push(`${textoItem}.`);
          }
        } else {
          linhas.push(`${textoItem};`);
        }
      });
    }
  }
  
  // d) Residuais
  if (residuais.length > 0) {
    residuais.forEach((residual) => {
      const letra = letras[letraIndex] || (letraIndex + 1).toString();
      linhas.push(`${letra}) ${gerarTextoResidual(residual)}.`);
      letraIndex++;
    });
  }
  
  // e) Corretagem (se houver)
  if (corretagens.length > 0) {
    corretagens.forEach((corretagem) => {
      const letra = letras[letraIndex] || (letraIndex + 1).toString();
      linhas.push(`${letra}) ${gerarTextoCorretagem(corretagem)}.`);
      letraIndex++;
    });
  }
  
  return linhas.join('\n\n');
}

// Gerar texto simplificado para cada condição (usado na lista individual)
export function gerarTextoCondicaoIndividual(condicao: CondicaoPagamento, letra: string): string {
  const valor = condicao.valor || 0;
  const valorFormatado = formatarValorMonetario(valor);
  const valorExtensoTexto = valorExtenso(valor);
  
  let texto = `${letra}) `;
  
  switch (condicao.tipo_parcela_codigo) {
    case 'entrada':
      texto += gerarTextoEntrada(condicao);
      break;
      
    case 'mensal_fixa':
    case 'mensal_serie':
      texto += gerarTextoMensalIndividual(condicao);
      break;
      
    case 'intermediaria':
      if ((condicao.quantidade || 1) > 1) {
        texto += `${quantidadePorExtenso(condicao.quantidade, 'parcela intermediária', 'parcelas intermediárias')} ("balões")`;
        texto += ` no valor de ${valorFormatado} (${valorExtensoTexto}) cada`;
      } else {
        texto += `Parcela intermediária ("balão") no valor de ${valorFormatado} (${valorExtensoTexto})`;
      }
      
      if (condicao.data_vencimento) {
        texto += `, com vencimento em ${formatarDataExtenso(condicao.data_vencimento)}`;
      }
      
      texto += `, ${gerarTextoCorrecao(condicao)}`;
      break;
      
    case 'residual':
      texto += gerarTextoResidual(condicao);
      break;
      
    case 'corretagem':
      texto += gerarTextoCorretagem(condicao);
      break;
      
    default:
      texto += condicao.descricao || 'Condição de pagamento';
      texto += `: ${valorFormatado} (${valorExtensoTexto})`;
  }
  
  // Adicionar observação se houver e não for tipos que já tratam
  if (condicao.observacao_texto && !['entrada', 'residual', 'corretagem'].includes(condicao.tipo_parcela_codigo)) {
    texto += `. ${condicao.observacao_texto}`;
  }
  
  return texto;
}

// Calcular total das condições
export function calcularTotalCondicoes(condicoes: CondicaoPagamento[], valorTotal?: number): {
  totalFixo: number;
  totalPercentual: number;
  totalGeral: number;
  diferenca: number;
} {
  let totalFixo = 0;
  let totalPercentual = 0;
  
  condicoes.forEach(c => {
    const valor = c.valor || 0;
    const quantidade = c.quantidade || 1;
    
    if (c.valor_tipo === 'percentual' && valorTotal) {
      totalPercentual += (valor / 100) * valorTotal * quantidade;
    } else {
      totalFixo += valor * quantidade;
    }
  });
  
  const totalGeral = totalFixo + totalPercentual;
  const diferenca = valorTotal ? valorTotal - totalGeral : 0;
  
  return { totalFixo, totalPercentual, totalGeral, diferenca };
}
