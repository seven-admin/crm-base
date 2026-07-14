import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

/** Extrai as chaves {{...}} usadas em um HTML */
export function extrairVariaveis(html: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([\w.-]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) set.add(m[1]);
  return Array.from(set);
}

const fmtMoeda = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
    out.valor_contrato = fmtMoeda(Number(opts.valorContrato));
  }

  return out;
}

function addImagePaginado(pdf: jsPDF, canvas: HTMLCanvasElement, pdfW: number, pdfH: number, isFirstPageOverall: boolean) {
  const imgData = canvas.toDataURL('image/png');
  const imgW = pdfW;
  const imgH = (canvas.height * imgW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;
  if (!isFirstPageOverall) pdf.addPage();
  pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
  heightLeft -= pdfH;
  while (heightLeft > 0) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pdfH;
  }
}

/**
 * Gera PDF a partir de um elemento HTML. Respeita as quebras de página manuais
 * (inseridas via botão "PG" do editor, marcadas com style page-break-before)
 * renderizando cada segmento separadamente — em vez de fatiar o conteúdo inteiro
 * como uma única imagem por altura fixa, o que cortava parágrafos/linhas ao meio.
 */
export async function gerarPdfDeHtml(element: HTMLElement, filename: string): Promise<Blob> {
  const clone = element.cloneNode(true) as HTMLElement;
  const isBreakMarker = (n: ChildNode): n is HTMLElement =>
    n instanceof HTMLElement && n.style.pageBreakBefore === 'always';

  const segments: HTMLElement[] = [];
  let current = document.createElement('div');
  current.className = clone.className;
  Array.from(clone.childNodes).forEach((child) => {
    if (isBreakMarker(child)) {
      segments.push(current);
      current = document.createElement('div');
      current.className = clone.className;
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

  try {
    let renderedAny = false;
    for (const seg of segments) {
      if (!seg.hasChildNodes()) continue;
      stage.innerHTML = '';
      stage.appendChild(seg);
      const canvas = await html2canvas(stage, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      addImagePaginado(pdf, canvas, pdfW, pdfH, !renderedAny);
      renderedAny = true;
    }
    if (!renderedAny) {
      // fallback: nenhum segmento tinha conteúdo (ex: elemento vazio) — captura como estava antes
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      addImagePaginado(pdf, canvas, pdfW, pdfH, true);
    }
  } finally {
    document.body.removeChild(stage);
  }

  const blob = pdf.output('blob');
  // download local também
  pdf.save(filename);
  return blob;
}
