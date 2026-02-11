// Conversão de números para extenso em português brasileiro

const unidades = [
  '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'
];

const dezenas = [
  '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'
];

const centenas = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 
  'seiscentos', 'setecentos', 'oitocentos', 'novecentos'
];

function extensoAte999(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  
  const c = Math.floor(n / 100);
  const resto = n % 100;
  
  let resultado = '';
  
  if (c > 0) {
    resultado = centenas[c];
    if (resto > 0) resultado += ' e ';
  }
  
  if (resto < 20) {
    resultado += unidades[resto];
  } else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    resultado += dezenas[d];
    if (u > 0) resultado += ' e ' + unidades[u];
  }
  
  return resultado;
}

export function numeroExtenso(n: number): string {
  if (n === 0) return 'zero';
  if (n < 0) return 'menos ' + numeroExtenso(-n);
  
  const bilhoes = Math.floor(n / 1000000000);
  const milhoes = Math.floor((n % 1000000000) / 1000000);
  const milhares = Math.floor((n % 1000000) / 1000);
  const resto = Math.floor(n % 1000);
  
  const partes: string[] = [];
  
  if (bilhoes > 0) {
    partes.push(extensoAte999(bilhoes) + (bilhoes === 1 ? ' bilhão' : ' bilhões'));
  }
  
  if (milhoes > 0) {
    partes.push(extensoAte999(milhoes) + (milhoes === 1 ? ' milhão' : ' milhões'));
  }
  
  if (milhares > 0) {
    if (milhares === 1) {
      partes.push('mil');
    } else {
      partes.push(extensoAte999(milhares) + ' mil');
    }
  }
  
  if (resto > 0) {
    partes.push(extensoAte999(resto));
  }
  
  if (partes.length === 0) return 'zero';
  
  // Juntar partes
  if (partes.length === 1) return partes[0];
  
  // Última parte com "e" se for menor que 100 ou terminar em 00
  const ultima = partes.pop()!;
  const penultima = partes.pop()!;
  
  // Determinar se usa "e" ou vírgula
  const usarE = resto < 100 || resto % 100 === 0;
  
  if (partes.length > 0) {
    return partes.join(', ') + ', ' + penultima + (usarE ? ' e ' : ', ') + ultima;
  }
  
  return penultima + (usarE ? ' e ' : ', ') + ultima;
}

export function valorExtenso(valor: number): string {
  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);
  
  let resultado = '';
  
  if (reais > 0) {
    resultado = numeroExtenso(reais) + (reais === 1 ? ' real' : ' reais');
  }
  
  if (centavos > 0) {
    if (resultado) resultado += ' e ';
    resultado += numeroExtenso(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  }
  
  if (!resultado) resultado = 'zero reais';
  
  return resultado;
}

export function formatarValorMonetario(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarDataExtenso(dataStr: string): string {
  const data = new Date(dataStr + 'T00:00:00');
  
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  
  const dia = data.getDate();
  const mes = meses[data.getMonth()];
  const ano = data.getFullYear();
  
  return `${dia} de ${mes} de ${ano}`;
}

export function quantidadePorExtenso(quantidade: number, singular: string, plural: string): string {
  const numExtenso = numeroExtenso(quantidade);
  const palavra = quantidade === 1 ? singular : plural;
  
  // Formatar como "01 (uma) parcela" ou "19 (dezenove) parcelas"
  const numFormatado = quantidade.toString().padStart(2, '0');
  
  return `${numFormatado} (${numExtenso}) ${palavra}`;
}
