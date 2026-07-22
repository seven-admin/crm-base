import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable, { type CellHookData } from 'jspdf-autotable';
import { toast } from 'sonner';

import nexaLogoAsset from '@/assets/nexa-logo.png';
import spaceGroteskRegularAsset from '@/assets/fonts/SpaceGrotesk-Regular.ttf';
import spaceGroteskBoldAsset from '@/assets/fonts/SpaceGrotesk-Bold.ttf';
import { supabase } from '@/integrations/supabase/client';
import type { UnidadeStatus } from '@/types/empreendimentos.types';

export interface ExportUnidadeInput {
  id: string;
  numero: string;
  andar?: number | null;
  area_privativa?: number | null;
  valor?: number | null;
  status?: UnidadeStatus | null;
  bloco?: { nome?: string | null } | null;
  tipologia?: { nome?: string | null } | null;
}

export interface ExportEmpreendimentoInput {
  nome: string;
  texto_rodape_relatorio?: string | null;
}

export type ExportUnidadesEscopo = 'disponiveis' | 'completo';
export interface ExportUnidadesDisponiveisPdfOptions {
  empreendimento: ExportEmpreendimentoInput;
  unidades: ExportUnidadeInput[];
  isLoteamento?: boolean;
  escopo?: ExportUnidadesEscopo;
  download?: boolean;
  /** Uso interno em testes de renderização fora do navegador. */
  logoDataUrl?: string;
  /** Uso interno em testes de renderização fora do navegador. */
  fontRegularDataUrl?: string;
  /** Uso interno em testes de renderização fora do navegador. */
  fontBoldDataUrl?: string;
  /** Uso interno em testes de renderização fora do navegador. */
  boxesPorUnidade?: Record<string, string[]>;
}

const STATUS_CONFIG: Record<UnidadeStatus, { label: string; color: [number, number, number]; background: [number, number, number] }> = {
  disponivel: { label: 'Disponível', color: [20, 112, 74], background: [226, 244, 235] },
  reservada: { label: 'Reservada', color: [157, 96, 0], background: [253, 242, 211] },
  negociacao: { label: 'Negociação', color: [32, 91, 164], background: [226, 237, 250] },
  contrato: { label: 'Contrato', color: [79, 70, 170], background: [235, 232, 252] },
  vendida: { label: 'Vendida', color: [172, 50, 70], background: [251, 230, 235] },
  bloqueada: { label: 'Bloqueada', color: [82, 88, 96], background: [234, 236, 239] },
};

const STATUS_ORDER: UnidadeStatus[] = ['disponivel', 'reservada', 'negociacao', 'contrato', 'vendida', 'bloqueada'];
const BRAND_ORANGE: [number, number, number] = [255, 116, 23];
const INK: [number, number, number] = [32, 26, 23];

const formatCurrency = (value: number | null | undefined) => (
  value == null
    ? '-'
    : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
);

const formatDecimal = (value: number | null | undefined) => (
  value == null
    ? '-'
    : Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
);

async function fetchAsDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao carregar imagem (${response.status})`);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function exportUnidadesPdf({
  empreendimento,
  unidades,
  isLoteamento = false,
  escopo = 'disponiveis',
  download = true,
  logoDataUrl,
  fontRegularDataUrl,
  fontBoldDataUrl,
  boxesPorUnidade,
}: ExportUnidadesDisponiveisPdfOptions): Promise<Blob | null> {
  if (!unidades?.length) {
    toast.warning(escopo === 'completo' ? 'Nenhuma unidade ativa para exportar.' : 'Nenhuma unidade disponível para exportar.');
    return null;
  }

  const ordenadas = [...unidades].sort((a, b) => {
    const blocoCompare = (a.bloco?.nome || '').localeCompare(b.bloco?.nome || '', 'pt-BR', { numeric: true });
    if (blocoCompare !== 0) return blocoCompare;
    const andarCompare = (a.andar ?? 0) - (b.andar ?? 0);
    if (andarCompare !== 0) return andarCompare;
    return a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true });
  });

  const blocoLabel = isLoteamento ? 'Quadra' : 'Bloco';
  const unidadeLabel = isLoteamento ? 'Lote' : 'Unidade';
  const reportTitle = escopo === 'completo' ? `Relatório completo de ${isLoteamento ? 'lotes' : 'unidades'}` : `${isLoteamento ? 'Lotes' : 'Unidades'} disponíveis`;
  const generatedAt = format(new Date(), 'dd/MM/yyyy HH:mm');
  const safeName = empreendimento.nome.replace(/[^a-zA-Z0-9À-ÿ ]/g, '').replace(/ +/g, '_');
  const dateStamp = format(new Date(), 'dd-MM-yyyy');

  let logoBase64 = logoDataUrl ?? '';
  if (!logoBase64) {
    try {
      logoBase64 = await fetchAsDataURL(nexaLogoAsset);
    } catch (error) {
      console.warn('Falha ao pré-carregar a marca do PDF:', error);
    }
  }

  let regularFontBase64 = fontRegularDataUrl ?? '';
  let boldFontBase64 = fontBoldDataUrl ?? '';
  if (!regularFontBase64 || !boldFontBase64) {
    try {
      const [regularFont, boldFont] = await Promise.all([
        regularFontBase64 || fetchAsDataURL(spaceGroteskRegularAsset),
        boldFontBase64 || fetchAsDataURL(spaceGroteskBoldAsset),
      ]);
      regularFontBase64 = regularFont;
      boldFontBase64 = boldFont;
    } catch (error) {
      console.warn('Falha ao pré-carregar a fonte do PDF:', error);
    }
  }

  const boxesByUnit = new Map<string, string[]>(Object.entries(boxesPorUnidade ?? {}));
  if (!boxesPorUnidade) {
    const unitIds = ordenadas.map((unit) => unit.id);
    const { data: boxesData, error: boxesError } = await supabase
      .from('seven_boxes')
      .select('numero, unidade_id')
      .in('unidade_id', unitIds)
      .eq('is_active', true);
    if (boxesError) console.warn('Não foi possível carregar os boxes para o PDF:', boxesError);
    (boxesData ?? []).forEach((box) => {
      if (!box.unidade_id) return;
      const list = boxesByUnit.get(box.unidade_id) ?? [];
      list.push(String(box.numero));
      boxesByUnit.set(box.unidade_id, list);
    });
  }

  const includeStatus = escopo === 'completo';
  const body = ordenadas.map((unit) => {
    const row: Array<string> = [
      unit.numero,
      unit.bloco?.nome || '-',
      unit.andar != null ? `${unit.andar}º` : '-',
      unit.tipologia?.nome || '-',
      boxesByUnit.get(unit.id)?.join(', ') || '-',
      formatDecimal(unit.area_privativa),
      formatCurrency(unit.valor),
    ];
    if (includeStatus) row.push(unit.status ? STATUS_CONFIG[unit.status].label : '-');
    return row;
  });

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const fontName = regularFontBase64 ? 'SpaceGrotesk' : 'helvetica';
  if (regularFontBase64) {
    const regularFontData = regularFontBase64.slice(regularFontBase64.indexOf(',') + 1);
    const boldFontData = (boldFontBase64 || regularFontBase64).slice((boldFontBase64 || regularFontBase64).indexOf(',') + 1);
    doc.addFileToVFS('SpaceGrotesk-Regular.ttf', regularFontData);
    doc.addFileToVFS('SpaceGrotesk-Bold.ttf', boldFontData);
    doc.addFont('SpaceGrotesk-Regular.ttf', fontName, 'normal');
    doc.addFont('SpaceGrotesk-Bold.ttf', fontName, 'bold');
  }
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2;

  const drawHeader = (showSummary: boolean) => {
    if (logoBase64) {
      try {
        const properties = doc.getImageProperties(logoBase64);
        const aspectRatio = properties.width / properties.height;
        const maxLogoWidth = 32;
        const maxLogoHeight = 8;
        const logoWidth = Math.min(maxLogoWidth, maxLogoHeight * aspectRatio);
        const logoHeight = logoWidth / aspectRatio;
        doc.addImage(logoBase64, 'PNG', marginX, 10, logoWidth, logoHeight);
      } catch {
        // O relatório continua legível mesmo que o navegador não aceite a imagem.
      }
    }

    doc.setFont(fontName, 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...INK);
    doc.text(reportTitle, pageWidth - marginX, 13, { align: 'right' });
    doc.setFont(fontName, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(112, 106, 101);
    doc.text(`${empreendimento.nome}  ·  Gerado em ${generatedAt}`, pageWidth - marginX, 18, { align: 'right' });
    doc.setDrawColor(...BRAND_ORANGE);
    doc.setLineWidth(0.8);
    doc.line(marginX, 24, pageWidth - marginX, 24);

    if (!showSummary) return;

    const metrics = escopo === 'completo'
      ? [
          { label: 'Total ativo', value: ordenadas.length, color: INK },
          ...STATUS_ORDER.map((status) => ({
            label: STATUS_CONFIG[status].label,
            value: ordenadas.filter((unit) => unit.status === status).length,
            color: STATUS_CONFIG[status].color,
          })),
        ]
      : [
          { label: `${unidadeLabel}s disponíveis`, value: ordenadas.length, color: STATUS_CONFIG.disponivel.color },
          { label: 'Valor total', value: formatCurrency(ordenadas.reduce((sum, unit) => sum + (Number(unit.valor) || 0), 0)), color: INK },
          { label: 'Área média', value: `${formatDecimal(ordenadas.reduce((sum, unit) => sum + (Number(unit.area_privativa) || 0), 0) / ordenadas.length)} m²`, color: INK },
        ];
    const gap = 2;
    const metricWidth = (contentWidth - gap * (metrics.length - 1)) / metrics.length;
    metrics.forEach((metric, index) => {
      const x = marginX + index * (metricWidth + gap);
      doc.setFillColor(248, 245, 241);
      doc.roundedRect(x, 29, metricWidth, 14, 2, 2, 'F');
      doc.setFont(fontName, 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(120, 114, 109);
      doc.text(metric.label.toUpperCase(), x + 3, 34);
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...metric.color);
      doc.text(String(metric.value), x + 3, 40);
    });
  };

  autoTable(doc, {
    startY: 49,
    margin: { top: 31, right: marginX, bottom: 17, left: marginX },
    head: [[unidadeLabel, blocoLabel, 'Andar', 'Tipologia', 'Box', 'Área privativa', 'Valor', ...(includeStatus ? ['Status'] : [])]],
    body,
    theme: 'plain',
    styles: {
      font: fontName,
      fontSize: 8,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
      lineWidth: { bottom: 0.1 },
      lineColor: [231, 227, 222],
      textColor: [52, 47, 43],
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: INK,
      textColor: [255, 255, 255],
      lineWidth: 0,
      cellPadding: { top: 2.8, bottom: 2.8, left: 2.5, right: 2.5 },
    },
    alternateRowStyles: { fillColor: [250, 248, 245] },
    columnStyles: includeStatus
      ? {
          0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 32 },
          2: { cellWidth: 17, halign: 'center' },
          3: { cellWidth: 62 },
          4: { cellWidth: 30, halign: 'center' },
          5: { cellWidth: 30, halign: 'right' },
          6: { cellWidth: 48, halign: 'right' },
          7: { cellWidth: 34, halign: 'center', fontStyle: 'bold' },
        }
      : {
          0: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 36 },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 72 },
          4: { cellWidth: 34, halign: 'center' },
          5: { cellWidth: 32, halign: 'right' },
          6: { cellWidth: 59, halign: 'right' },
        },
    didParseCell: (data: CellHookData) => {
      if (!includeStatus || data.section !== 'body' || data.column.index !== 7) return;
      const unit = ordenadas[data.row.index];
      if (!unit?.status) return;
      data.cell.styles.textColor = STATUS_CONFIG[unit.status].color;
      data.cell.styles.fillColor = STATUS_CONFIG[unit.status].background;
    },
    willDrawPage: (data) => drawHeader(data.pageNumber === 1),
  });

  const tableDoc = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  let noteY = (tableDoc.lastAutoTable?.finalY ?? 49) + 8;
  const notes = empreendimento.texto_rodape_relatorio?.trim();
  if (notes) {
    const lines = doc.splitTextToSize(notes, contentWidth - 8) as string[];
    const noteHeight = Math.max(18, 11 + lines.length * 3.4);
    if (noteY + noteHeight > pageHeight - 17) {
      doc.addPage('a4', 'landscape');
      drawHeader(false);
      noteY = 32;
    }
    doc.setFillColor(248, 245, 241);
    doc.roundedRect(marginX, noteY, contentWidth, noteHeight, 2, 2, 'F');
    doc.setFont(fontName, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text('OBSERVAÇÕES DO RELATÓRIO', marginX + 4, noteY + 6);
    doc.setFont(fontName, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(92, 86, 81);
    doc.text(lines, marginX + 4, noteY + 11);
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(229, 225, 220);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);
    doc.setFont(fontName, 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(130, 124, 119);
    doc.text(escopo === 'completo' ? 'Uso administrativo · Inclui todas as unidades ativas' : 'Disponibilidade sujeita a alteração sem aviso prévio', marginX, pageHeight - 6);
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - marginX, pageHeight - 6, { align: 'right' });
  }

  const blob = doc.output('blob');
  if (download) {
    const prefix = escopo === 'completo' ? 'Unidades_Completas' : 'Unidades_Disponiveis';
    doc.save(`${prefix}_${safeName}_${dateStamp}.pdf`);
    toast.success(`${ordenadas.length} ${isLoteamento ? 'lote(s)' : 'unidade(s)'} exportado(s) em PDF.`);
  }
  return blob;
}

export async function exportUnidadesDisponiveisPdf(options: ExportUnidadesDisponiveisPdfOptions) {
  return exportUnidadesPdf({ ...options, escopo: options.escopo ?? 'disponiveis' });
}
