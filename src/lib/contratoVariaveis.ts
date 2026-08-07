import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { valorExtenso } from '@/lib/numeroExtenso';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { asBlob } from 'html-docx-js-typescript';

/** Escapa caracteres HTML especiais — os valores de variáveis são sempre texto puro (nunca markup). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function resolveVariaveis(html: string, valores: Record<string, string>): string {
  return html.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, chave) => {
    const v = valores[chave];
    return v !== undefined && v !== null && v !== '' ? escapeHtml(String(v)) : `[${chave}]`;
  });
}

/**
 * Parágrafos vazios (linhas em branco feitas com Enter no editor) saem como
 * <p></p> e colapsam para altura zero ao renderizar/rasterizar — a linha em branco
 * some no PDF. Troca por <p><br></p> (preservando atributos) para manterem a altura.
 */
export function normalizarQuebras(html: string): string {
  return html.replace(/<p([^>]*)>(?:\s|&nbsp;)*<\/p>/gi, '<p$1><br></p>');
}

/**
 * Trechos condicionais: {{#se chave}}...{{/se}}. O conteúdo interno só aparece se a
 * variável tiver valor; senão é removido. Quando o trecho ocupa um parágrafo/heading/
 * item inteiro, o elemento é removido junto (não deixa linha em branco). Roda ANTES de
 * resolveVariaveis. Não suporta aninhamento.
 */
export function resolverCondicionais(html: string, valores: Record<string, string>): string {
  const NULO = '@@__SE_VAZIO__@@'; // sentinela para marcar trechos removidos
  let out = html.replace(/\{\{#se\s+([\w.-]+)\}\}([\s\S]*?)\{\{\/se\}\}/gi, (_m, chave: string, inner: string) => {
    const v = valores[chave];
    return v !== undefined && v !== null && String(v).trim() !== '' ? inner : NULO;
  });
  // Elemento que ficou apenas com o marcador -> remove o elemento inteiro (sem deixar linha em branco).
  out = out.replace(/<(p|h[1-6]|li)\b[^>]*>(?:\s|&nbsp;|<br\s*\/?>|@@__SE_VAZIO__@@)*<\/\1>/gi, (m) => (m.includes(NULO) ? '' : m));
  // Marcadores inline restantes -> somem.
  out = out.split(NULO).join('');
  return out;
}

/** Extrai as chaves {{...}} usadas em um HTML */
export function extrairVariaveis(html: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([\w.-]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) set.add(m[1]);
  return Array.from(set);
}

const fmtMoeda = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Chaves preenchidas automaticamente a partir do banco (cliente/empreendimento/
// unidade/valor) por resolverValoresAutomaticos. As demais são de preenchimento
// manual no assistente de geração. Fonte única de verdade — se resolver ganhar
// uma nova chave, adicione aqui também.
export const VARIAVEIS_AUTOMATICAS = [
  'data_atual',
  'nome_cliente', 'cpf_cliente', 'rg_cliente', 'email_cliente', 'telefone_cliente', 'endereco_cliente',
  'empreendimento',
  'unidade_numero', 'unidade_bloco', 'unidade_tipologia',
  'valor_contrato', 'valor_contrato_extenso', 'valor_contrato_completo',
] as const;

export function isVariavelAutomatica(chave: string): boolean {
  return (VARIAVEIS_AUTOMATICAS as readonly string[]).includes(chave);
}

/** Resolve valores automáticos com base nas fontes conhecidas. */
export async function resolverValoresAutomaticos(opts: {
  clienteId?: string | null;
  empreendimentoId?: string | null;
  unidadeId?: string | null;
  valorContrato?: number | null;
}): Promise<Record<string, string>> {
  const out: Record<string, string> = {
    data_atual: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
  };

  if (opts.clienteId) {
    const { data: c } = await supabase
      .from('seven_clientes')
      .select('nome, cpf, rg, email, telefone, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep')
      .eq('id', opts.clienteId)
      .maybeSingle();
    if (c) {
      out.nome_cliente = c.nome ?? '';
      out.cpf_cliente = c.cpf ?? '';
      out.rg_cliente = c.rg ?? '';
      out.email_cliente = c.email ?? '';
      out.telefone_cliente = c.telefone ?? '';
      const end = [
        c.endereco_logradouro,
        c.endereco_numero,
        c.endereco_bairro,
        c.endereco_cidade && c.endereco_uf ? `${c.endereco_cidade}/${c.endereco_uf}` : c.endereco_cidade,
        c.endereco_cep,
      ].filter(Boolean).join(', ');
      out.endereco_cliente = end;
    }
  }

  if (opts.empreendimentoId) {
    const { data: e } = await supabase
      .from('seven_empreendimentos')
      .select('nome')
      .eq('id', opts.empreendimentoId)
      .maybeSingle();
    if (e) out.empreendimento = e.nome ?? '';
  }

  if (opts.unidadeId) {
    const { data: u } = await supabase
      .from('seven_unidades')
      .select('numero, bloco:seven_blocos(nome), tipologia:seven_tipologias(nome)')
      .eq('id', opts.unidadeId)
      .maybeSingle();
    if (u) {
      out.unidade_numero = (u as any).numero ?? '';
      out.unidade_bloco = (u as any).bloco?.nome ?? '';
      out.unidade_tipologia = (u as any).tipologia?.nome ?? '';
    }
  }

  if (opts.valorContrato != null) {
    const n = Number(opts.valorContrato);
    out.valor_contrato = fmtMoeda(n);                              // R$ 1.234.567,89
    out.valor_contrato_extenso = valorExtenso(n);                 // um milhão... reais e oitenta e nove centavos
    out.valor_contrato_completo = `${fmtMoeda(n)} (${valorExtenso(n)})`;
  }

  return out;
}

/** Carrega uma imagem (URL pública) já pronta para o jsPDF, com dimensões naturais. */
function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${url}`));
    img.src = url;
  });
}

/** Adiciona a imagem como uma página A4 inteira, centralizada e preservando proporção. */
function addImagemPaginaInteira(pdf: jsPDF, img: HTMLImageElement, pdfW: number, pdfH: number) {
  pdf.addPage();
  let w = pdfW;
  let h = (img.naturalHeight / img.naturalWidth) * w;
  if (h > pdfH) { h = pdfH; w = (img.naturalWidth / img.naturalHeight) * h; }
  pdf.addImage(img, 'PNG', (pdfW - w) / 2, (pdfH - h) / 2, w, h);
}

/** Desenha a imagem cobrindo a página inteira (estilo "cover"), como papel timbrado. */
function desenharFundoPagina(pdf: jsPDF, img: HTMLImageElement, pdfW: number, pdfH: number) {
  const imgR = img.naturalWidth / img.naturalHeight;
  const pageR = pdfW / pdfH;
  let w: number, h: number;
  if (imgR > pageR) { h = pdfH; w = h * imgR; } else { w = pdfW; h = w / imgR; }
  pdf.addImage(img, 'PNG', (pdfW - w) / 2, (pdfH - h) / 2, w, h);
}

/**
 * Paginação com FUNDO: o conteúdo é rasterizado com fundo transparente e sobreposto,
 * página a página, sobre a imagem de fundo (papel timbrado). Cada fatia é recortada
 * para a altura útil via canvas auxiliar (sem retângulos brancos, que esconderiam o fundo).
 */
function addConteudoComFundo(
  pdf: jsPDF, canvas: HTMLCanvasElement, pdfW: number, pdfH: number,
  isFirstPageOverall: boolean, m: Margens, desenharFundo: () => void,
) {
  const imgW = pdfW - m.esquerda - m.direita;
  const usableHmm = pdfH - m.topo - m.baixo;
  const pxPerMm = canvas.width / imgW;
  const sliceHpx = Math.max(1, Math.floor(usableHmm * pxPerMm));

  let sy = 0;
  let primeiraFatia = true;
  while (sy < canvas.height - 0.5) {
    if (!isFirstPageOverall || !primeiraFatia) pdf.addPage();
    primeiraFatia = false;
    desenharFundo();
    const hpx = Math.min(sliceHpx, canvas.height - sy);
    const sub = document.createElement('canvas');
    sub.width = canvas.width;
    sub.height = hpx;
    sub.getContext('2d')!.drawImage(canvas, 0, sy, canvas.width, hpx, 0, 0, canvas.width, hpx);
    pdf.addImage(sub.toDataURL('image/png'), 'PNG', m.esquerda, m.topo, imgW, hpx / pxPerMm);
    sy += hpx;
  }
}

export interface Margens {
  topo: number;
  direita: number;
  baixo: number;
  esquerda: number;
}

const MARGENS_ZERO: Margens = { topo: 0, direita: 0, baixo: 0, esquerda: 0 };

/**
 * Adiciona a imagem do conteúdo respeitando as margens: a imagem é escalada para
 * a largura útil (página - margens laterais) e deslocada a cada página pela altura
 * útil; o que "vaza" para as margens é coberto por retângulos brancos, criando as
 * margens superior/inferior sem cortar linhas ao meio.
 */
function addImagePaginado(pdf: jsPDF, canvas: HTMLCanvasElement, pdfW: number, pdfH: number, isFirstPageOverall: boolean, m: Margens) {
  const imgData = canvas.toDataURL('image/png');
  const imgW = pdfW - m.esquerda - m.direita;
  const imgH = (canvas.height * imgW) / canvas.width;
  const usableH = pdfH - m.topo - m.baixo;

  let offset = 0; // mm da imagem já exibidos
  let primeiraFatia = true;
  while (offset < imgH - 0.5) {
    if (!isFirstPageOverall || !primeiraFatia) pdf.addPage();
    primeiraFatia = false;
    pdf.addImage(imgData, 'PNG', m.esquerda, m.topo - offset, imgW, imgH);
    // Cobre o que vazou para as margens com branco.
    pdf.setFillColor(255, 255, 255);
    if (m.topo > 0) pdf.rect(0, 0, pdfW, m.topo, 'F');
    if (m.baixo > 0) pdf.rect(0, pdfH - m.baixo, pdfW, m.baixo, 'F');
    if (m.esquerda > 0) pdf.rect(0, 0, m.esquerda, pdfH, 'F');
    if (m.direita > 0) pdf.rect(pdfW - m.direita, 0, m.direita, pdfH, 'F');
    offset += usableH;
  }
}

/**
 * Gera PDF a partir de um elemento HTML. Respeita as quebras de página manuais
 * (inseridas via botão "PG" do editor, marcadas com style page-break-before)
 * renderizando cada segmento separadamente — em vez de fatiar o conteúdo inteiro
 * como uma única imagem por altura fixa, o que cortava parágrafos/linhas ao meio.
 */
export interface GerarPdfOptions {
  /** Margens da página em mm. Padrão 20mm em todos os lados. */
  margens?: Partial<Margens>;
  /** Cabeçalho impresso na margem superior de cada página (texto já com variáveis resolvidas). */
  cabecalho?: string;
  /** Rodapé impresso na margem inferior de cada página (texto já com variáveis resolvidas). */
  rodape?: string;
  /** Numeração automática "Página X de Y" no rodapé. */
  numerarPaginas?: boolean;
  /** Marca d'água sobreposta em todas as páginas. */
  marcaDagua?: { url: string; opacidade: number };
  /** Imagem de fundo de página inteira (papel timbrado), atrás do texto em todas as páginas. */
  fundoPagina?: string;
  /** Imagens anexadas como páginas inteiras ao final (ex.: planta e garagem da unidade). */
  imagensFinais?: string[];
}

export async function gerarPdfDeHtml(element: HTMLElement, filename: string, options?: GerarPdfOptions): Promise<Blob> {
  const clone = element.cloneNode(true) as HTMLElement;
  const isBreakMarker = (n: ChildNode): n is HTMLElement =>
    n instanceof HTMLElement && n.style.pageBreakBefore === 'always';

  // Mantém a tipografia (classe prose etc.) mas remove o "chrome" do card de preview
  // (borda arredondada, sombra, fundo e padding do container), que senão seria
  // rasterizado como uma caixa dentro da página. As margens agora vêm do jsPDF.
  const makeSegment = () => {
    const d = document.createElement('div');
    d.className = clone.className;
    d.style.cssText = 'border:none;border-radius:0;box-shadow:none;padding:0;margin:0;background:#fff;max-width:none;width:100%';
    return d;
  };

  const segments: HTMLElement[] = [];
  let current = makeSegment();
  Array.from(clone.childNodes).forEach((child) => {
    if (isBreakMarker(child)) {
      segments.push(current);
      current = makeSegment();
      return;
    }
    current.appendChild(child);
  });
  segments.push(current);

  const stage = document.createElement('div');
  stage.style.position = 'fixed';
  stage.style.left = '-99999px';
  stage.style.top = '0';
  stage.style.width = `${element.clientWidth}px`;
  stage.style.background = '#ffffff';
  document.body.appendChild(stage);

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const m: Margens = { ...MARGENS_ZERO, topo: 20, direita: 20, baixo: 20, esquerda: 20, ...options?.margens };

  // Com papel timbrado: conteúdo transparente sobre a imagem de fundo desenhada por página.
  const fundoImg = options?.fundoPagina ? await carregarImagem(options.fundoPagina).catch(() => null) : null;
  const bgColor = fundoImg ? null : '#ffffff';
  const desenharFundo = fundoImg ? () => desenharFundoPagina(pdf, fundoImg, pdfW, pdfH) : undefined;

  try {
    let renderedAny = false;
    for (const seg of segments) {
      if (!seg.hasChildNodes()) continue;
      stage.innerHTML = '';
      stage.appendChild(seg);
      const canvas = await html2canvas(stage, { scale: 2, backgroundColor: bgColor, useCORS: true });
      if (desenharFundo) addConteudoComFundo(pdf, canvas, pdfW, pdfH, !renderedAny, m, desenharFundo);
      else addImagePaginado(pdf, canvas, pdfW, pdfH, !renderedAny, m);
      renderedAny = true;
    }
    if (!renderedAny) {
      // fallback: nenhum segmento tinha conteúdo (ex: elemento vazio) — captura como estava antes
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: bgColor, useCORS: true });
      if (desenharFundo) addConteudoComFundo(pdf, canvas, pdfW, pdfH, true, m, desenharFundo);
      else addImagePaginado(pdf, canvas, pdfW, pdfH, true, m);
    }
  } finally {
    document.body.removeChild(stage);
  }

  // Cabeçalho/rodapé/numeração nas páginas de conteúdo (antes de anexar imagens finais).
  const paginasConteudo = pdf.getNumberOfPages();
  if (options?.cabecalho || options?.rodape || options?.numerarPaginas) {
    pdf.setFontSize(7.5);
    pdf.setTextColor(110, 110, 110);
    for (let p = 1; p <= paginasConteudo; p++) {
      pdf.setPage(p);
      if (options.cabecalho) {
        pdf.text(options.cabecalho, pdfW / 2, Math.max(6, m.topo / 2), { align: 'center', maxWidth: pdfW - m.esquerda - m.direita });
      }
      const rodapeY = pdfH - Math.max(6, m.baixo / 2);
      if (options.rodape) {
        pdf.text(options.rodape, m.esquerda, rodapeY, { maxWidth: pdfW - m.esquerda - m.direita });
      }
      if (options.numerarPaginas) {
        pdf.text(`Página ${p} de ${paginasConteudo}`, pdfW - m.direita, rodapeY, { align: 'right' });
      }
    }
    pdf.setTextColor(0, 0, 0);
  }

  // Páginas de imagem ao final (planta/garagem da unidade).
  for (const url of options?.imagensFinais ?? []) {
    try {
      const img = await carregarImagem(url);
      addImagemPaginaInteira(pdf, img, pdfW, pdfH);
    } catch (e) {
      console.error(e); // não interrompe a geração por uma imagem que falhou
    }
  }

  // Marca d'água em todas as páginas (60% da largura, centralizada, com opacidade).
  if (options?.marcaDagua?.url) {
    try {
      const mark = await carregarImagem(options.marcaDagua.url);
      let w = pdfW * 0.6;
      let h = (mark.naturalHeight / mark.naturalWidth) * w;
      if (h > pdfH * 0.6) { h = pdfH * 0.6; w = (mark.naturalWidth / mark.naturalHeight) * h; }
      const x = (pdfW - w) / 2;
      const y = (pdfH - h) / 2;
      const gs = new (pdf as any).GState({ opacity: options.marcaDagua.opacidade });
      const total = pdf.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        pdf.setPage(p);
        (pdf as any).saveGraphicsState();
        pdf.setGState(gs);
        pdf.addImage(mark, 'PNG', x, y, w, h);
        (pdf as any).restoreGraphicsState();
      }
    } catch (e) {
      console.error(e);
    }
  }

  const blob = pdf.output('blob');
  // download local também
  pdf.save(filename);
  return blob;
}

/**
 * Gera um .docx REAL (OOXML) a partir do HTML do contrato, editável no Word e no Google Docs,
 * com texto selecionável e imagens embutidas. O fundo (papel timbrado) entra como background CSS.
 */
export async function gerarDocDeHtml(
  html: string,
  filename: string,
  opts?: { titulo?: string; fundoUrl?: string },
): Promise<Blob> {
  const style = `
    @page { size: A4; margin: 2cm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000;${
      opts?.fundoUrl ? ` background-image: url('${opts.fundoUrl}'); background-size: cover; background-repeat: no-repeat;` : ''
    } }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #000; padding: 4px; }
    h1, h2, h3 { font-family: 'Times New Roman', serif; }
  `;
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8">`
    + `<title>${opts?.titulo ?? 'Contrato'}</title><style>${style}</style></head>`
    + `<body>${html}</body></html>`;

  const out = await asBlob(doc, { orientation: 'portrait', margins: { top: 720, right: 720, bottom: 720, left: 720 } });
  const blob = out instanceof Blob
    ? out
    : new Blob([out as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return blob;
}
