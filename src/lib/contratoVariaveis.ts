import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function resolveVariaveis(html: string, valores: Record<string, string>): string {
  return html.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, chave) => {
    const v = valores[chave];
    return v !== undefined && v !== null && v !== '' ? String(v) : `[${chave}]`;
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

/** Gera PDF a partir de um elemento HTML (renderiza como imagem paginada). */
export async function gerarPdfDeHtml(element: HTMLElement, filename: string): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const imgW = pdfW;
  const imgH = (canvas.height * imgW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
  heightLeft -= pdfH;
  while (heightLeft > 0) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pdfH;
  }
  const blob = pdf.output('blob');
  // download local também
  pdf.save(filename);
  return blob;
}
