import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable, { type CellHookData } from 'jspdf-autotable';
import { toast } from 'sonner';

import nexaLogoAsset from '@/assets/nexa-logo.png';
import spaceGroteskRegularAsset from '@/assets/fonts/SpaceGrotesk-Regular.ttf';
import spaceGroteskBoldAsset from '@/assets/fonts/SpaceGrotesk-Bold.ttf';
import { supabase } from '@/integrations/supabase/client';
import type { ConfigVenda, UnidadeStatus } from '@/types/empreendimentos.types';
import { CONFIG_VENDA_RODAPE_DEFAULTS } from '@/types/empreendimentos.types';
import { calcularFluxo, PLANO_PADRAO } from '@/lib/fluxoEntrada';

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
  config_venda?: ConfigVenda | null;
  registro_incorporacao?: string | null;
  matricula_mae?: string | null;
}

export type ExportUnidadesEscopo = 'disponiveis' | 'completo';
export type ExportUnidadesModelo = 'simples' | 'tabela_vendas';
export interface ExportUnidadesDisponiveisPdfOptions {
  empreendimento: ExportEmpreendimentoInput;
  unidades: ExportUnidadeInput[];
  isLoteamento?: boolean;
  escopo?: ExportUnidadesEscopo;
  modelo?: ExportUnidadesModelo;
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
// Paleta da marca Nexa (violeta/índigo do símbolo + preto do wordmark). Sem laranja.
const NEXA_VIOLET: [number, number, number] = [79, 63, 224];
const INK: [number, number, number] = [16, 16, 20];
const SECTION_GRAY: [number, number, number] = [150, 156, 163];
const SECTION_GRAY_LIGHT: [number, number, number] = [237, 238, 240];

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
  modelo = 'simples',
  download = true,
  logoDataUrl,
  fontRegularDataUrl,
  fontBoldDataUrl,
  boxesPorUnidade,
}: ExportUnidadesDisponiveisPdfOptions): Promise<Blob | null> {
  const isTabelaVendas = modelo === 'tabela_vendas';
  // Folha comercial só faz sentido com unidades disponíveis.
  const unidadesFonte = isTabelaVendas ? unidades.filter((u) => u.status === 'disponivel') : unidades;
  if (!unidadesFonte?.length) {
    toast.warning(escopo === 'completo' ? 'Nenhuma unidade ativa para exportar.' : 'Nenhuma unidade disponível para exportar.');
    return null;
  }

  const plano = { ...PLANO_PADRAO, ...(empreendimento.config_venda?.plano ?? {}) };
  const rodapeCfg = empreendimento.config_venda?.rodape ?? {};

  const ordenadas = [...unidadesFonte].sort((a, b) => {
    const blocoCompare = (a.bloco?.nome || '').localeCompare(b.bloco?.nome || '', 'pt-BR', { numeric: true });
    if (blocoCompare !== 0) return blocoCompare;
    const andarCompare = (a.andar ?? 0) - (b.andar ?? 0);
    if (andarCompare !== 0) return andarCompare;
    return a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true });
  });

  const blocoLabel = isLoteamento ? 'Quadra' : 'Bloco';
  const unidadeLabel = isLoteamento ? 'Lote' : 'Unidade';
  const reportTitle = isTabelaVendas
    ? 'Tabela de vendas'
    : escopo === 'completo' ? `Relatório completo de ${isLoteamento ? 'lotes' : 'unidades'}` : `${isLoteamento ? 'Lotes' : 'Unidades'} disponíveis`;
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

  const includeStatus = escopo === 'completo' && !isTabelaVendas;
  // Fluxo de entrada só aparece quando explicitamente ativado na config do empreendimento.
  const showFluxo = isTabelaVendas && plano.fluxo_ativo === true;
  const fluxoBodyCols = showFluxo ? [5, 6, 7] : [];
  const valorTotalCol = isTabelaVendas ? (showFluxo ? 9 : 5) : -1;
  const mensaisLabel = `${plano.mensais_qtd}x mensais`;
  const reforcosLabel = `${plano.reforcos_qtd} reforços`;

  const body = ordenadas.map((unit) => {
    if (isTabelaVendas) {
      const base = [
        unit.andar != null ? `${unit.andar}º` : '-',
        unit.numero,
        boxesByUnit.get(unit.id)?.join(', ') || '-',
        unit.tipologia?.nome || '-',
        formatDecimal(unit.area_privativa),
      ];
      if (!showFluxo) return [...base, formatCurrency(unit.valor)];
      const f = calcularFluxo(Number(unit.valor) || 0, plano);
      return [
        ...base,
        formatCurrency(f.ato),
        formatCurrency(f.mensalUnit),
        formatCurrency(f.reforcoUnit),
        formatCurrency(f.financiamento),
        formatCurrency(f.total),
      ];
    }
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

  const tabelaVendasHeadBase = (extra: any[]) => [
    { content: 'Andar', rowSpan: 2 },
    { content: unidadeLabel, rowSpan: 2 },
    { content: 'Box', rowSpan: 2 },
    { content: 'Tipologia', rowSpan: 2 },
    { content: 'Área priv.', rowSpan: 2 },
    ...extra,
  ].map((c) => ({ ...c, content: String(c.content).toUpperCase() }));

  const head: any = showFluxo
    ? [
        tabelaVendasHeadBase([
          { content: 'Fluxo da entrada', colSpan: 3 },
          { content: 'Financiamento', rowSpan: 2 },
          { content: 'Valor total', rowSpan: 2 },
        ]),
        ['ATO', mensaisLabel, reforcosLabel].map((t) => t.toUpperCase()),
      ]
    : isTabelaVendas
      ? [tabelaVendasHeadBase([{ content: 'Valor total', rowSpan: 1 }]).map((c) => ({ content: c.content }))]
      : [[unidadeLabel, blocoLabel, 'Andar', 'Tipologia', 'Box', 'Área privativa', 'Valor', ...(includeStatus ? ['Status'] : [])]];

  // Larguras somam a contentWidth (273mm) para a tabela alinhar com o cabeçalho.
  const columnStyles: Record<number, Partial<Record<string, unknown>>> = showFluxo
    ? {
        0: { cellWidth: 14 },
        1: { cellWidth: 18 },
        2: { cellWidth: 18 },
        3: { cellWidth: 55 },
        4: { cellWidth: 22 },
        5: { cellWidth: 28 },
        6: { cellWidth: 28 },
        7: { cellWidth: 28 },
        8: { cellWidth: 31 },
        9: { cellWidth: 31 },
      }
    : isTabelaVendas
      ? {
          0: { cellWidth: 18 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 100 },
          4: { cellWidth: 30 },
          5: { cellWidth: 75 },
        }
    : includeStatus
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
        };

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
    const refLabel = isTabelaVendas && plano.ref_label ? `  ·  Ref: ${plano.ref_label}` : '';
    doc.text(`${empreendimento.nome}  ·  Gerado em ${generatedAt}${refLabel}`, pageWidth - marginX, 18, { align: 'right' });
    doc.setDrawColor(...NEXA_VIOLET);
    doc.setLineWidth(0.6);
    doc.line(marginX, 24, pageWidth - marginX, 24);

    if (isTabelaVendas || !showSummary) return;

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
    startY: isTabelaVendas ? 30 : 49,
    margin: { top: isTabelaVendas ? 28 : 31, right: marginX, bottom: 17, left: marginX },
    head,
    body,
    theme: 'plain',
    styles: isTabelaVendas
      ? {
          font: fontName,
          fontSize: 7,
          cellPadding: { top: 2.7, bottom: 2.7, left: 1.5, right: 1.5 },
          lineWidth: { bottom: 0.1 },
          lineColor: [236, 236, 241],
          textColor: [72, 72, 80],
          halign: 'center',
          valign: 'middle',
          overflow: 'linebreak',
        }
      : {
          font: fontName,
          fontSize: 8,
          cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
          lineWidth: { bottom: 0.1 },
          lineColor: [231, 227, 222],
          textColor: [52, 47, 43],
          valign: 'middle',
          overflow: 'linebreak',
        },
    headStyles: isTabelaVendas
      ? {
          fontStyle: 'bold',
          fillColor: [38, 38, 46],
          textColor: [255, 255, 255],
          fontSize: 6.6,
          halign: 'center',
          valign: 'middle',
          lineWidth: { right: 0.4, bottom: 0 },
          lineColor: [255, 255, 255],
          cellPadding: { top: 2.4, bottom: 2.4, left: 1.5, right: 1.5 },
        }
      : {
          fontStyle: 'bold',
          fillColor: INK,
          textColor: [255, 255, 255],
          lineWidth: 0,
          cellPadding: { top: 2.8, bottom: 2.8, left: 2.5, right: 2.5 },
        },
    alternateRowStyles: isTabelaVendas ? {} : { fillColor: [250, 248, 245] },
    columnStyles: columnStyles as any,
    didParseCell: (data: CellHookData) => {
      if (isTabelaVendas) {
        if (data.section === 'head') {
          if (data.cell.text[0] === 'FLUXO DA ENTRADA') data.cell.styles.fillColor = NEXA_VIOLET;
          return;
        }
        if (data.section === 'body') {
          const c = data.column.index;
          if (fluxoBodyCols.includes(c)) {
            data.cell.styles.fillColor = [244, 243, 253];
          } else if (c === valorTotalCol) {
            data.cell.styles.fillColor = [235, 232, 250];
            data.cell.styles.textColor = NEXA_VIOLET;
          }
        }
        return;
      }
      if (!includeStatus || data.section !== 'body' || data.column.index !== 7) return;
      const unit = ordenadas[data.row.index];
      if (!unit?.status) return;
      data.cell.styles.textColor = STATUS_CONFIG[unit.status].color;
      data.cell.styles.fillColor = STATUS_CONFIG[unit.status].background;
    },
    willDrawPage: (data) => drawHeader(data.pageNumber === 1),
  });

  const tableDoc = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  const bottomLimit = pageHeight - 17;
  let y = (tableDoc.lastAutoTable?.finalY ?? 49) + 8;
  const ensureSpace = (h: number) => {
    if (y + h > bottomLimit) {
      doc.addPage('a4', 'landscape');
      drawHeader(false);
      y = 32;
    }
  };

  if (isTabelaVendas) {
    const rodape = {
      reajustes: rodapeCfg.reajustes || CONFIG_VENDA_RODAPE_DEFAULTS.reajustes,
      vantagens: rodapeCfg.vantagens || CONFIG_VENDA_RODAPE_DEFAULTS.vantagens,
      garantias: rodapeCfg.garantias || CONFIG_VENDA_RODAPE_DEFAULTS.garantias,
    };
    const fmtData = (v?: string) => {
      if (!v) return '';
      const d = new Date(`${v}T00:00:00`);
      return Number.isNaN(d.getTime()) ? v : format(d, 'dd/MM/yyyy');
    };

    const sectionHeader = (title: string) => {
      ensureSpace(8);
      doc.setFillColor(...SECTION_GRAY);
      doc.rect(marginX, y, contentWidth, 6.2, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(title.toUpperCase(), pageWidth / 2, y + 4.3, { align: 'center' });
      y += 6.2 + 1.5;
    };
    const textBlock = (text: string) => {
      const lines = doc.splitTextToSize(text, contentWidth - 6) as string[];
      const h = lines.length * 3.5 + 3;
      ensureSpace(h);
      doc.setFillColor(...SECTION_GRAY_LIGHT);
      doc.rect(marginX, y, contentWidth, h, 'F');
      doc.setFont(fontName, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...INK);
      doc.text(lines, marginX + 3, y + 4);
      y += h + 1.5;
    };
    const boxRow = (items: { label: string; value: string }[]) => {
      const list = items.filter((it) => it.value);
      if (!list.length) return;
      ensureSpace(11);
      const gap = 2;
      const w = (contentWidth - gap * (list.length - 1)) / list.length;
      list.forEach((it, i) => {
        const x = marginX + i * (w + gap);
        doc.setFillColor(...SECTION_GRAY_LIGHT);
        doc.rect(x, y, w, 10, 'F');
        doc.setFont(fontName, 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(90, 94, 100);
        doc.text(it.label.toUpperCase(), x + 3, y + 4);
        doc.setFont(fontName, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...INK);
        doc.text(it.value, x + 3, y + 8);
      });
      y += 10 + 1.5;
    };

    // Contatos
    boxRow([
      { label: 'Gestão comercial', value: rodapeCfg.gestao_comercial ?? '' },
      { label: 'Especialista responsável', value: rodapeCfg.especialista ?? '' },
    ]);

    // Notas explicativas
    if (rodapeCfg.inicio_obra || rodapeCfg.previsao_entrega) {
      sectionHeader('Notas explicativas');
      boxRow([
        { label: 'Início de obra', value: fmtData(rodapeCfg.inicio_obra) },
        { label: 'Previsão de entrega', value: rodapeCfg.previsao_entrega ?? '' },
      ]);
    }

    sectionHeader('Regras de reajustes');
    textBlock(rodape.reajustes);

    sectionHeader('Vantagens do financiamento');
    textBlock(rodape.vantagens);

    sectionHeader('Garantia de entrega e segurança patrimonial');
    textBlock(rodape.garantias);
    const juridicos = [
      ['Certidão de aprovação', rodapeCfg.certidao_aprovacao],
      ['Licença de construção', rodapeCfg.licenca_construcao],
      ['Registro de incorporação', empreendimento.registro_incorporacao],
      ['Matrícula-mãe', empreendimento.matricula_mae],
      ['Patrimônio de afetação', rodapeCfg.patrimonio_afetacao],
    ].filter(([, v]) => v).map(([l, v]) => `${l}: ${v}`);
    if (juridicos.length) textBlock(juridicos.join('   ·   '));
  } else {
    const notes = empreendimento.texto_rodape_relatorio?.trim();
    if (notes) {
      const lines = doc.splitTextToSize(notes, contentWidth - 8) as string[];
      const noteHeight = Math.max(18, 11 + lines.length * 3.4);
      ensureSpace(noteHeight);
      doc.setFillColor(248, 245, 241);
      doc.roundedRect(marginX, y, contentWidth, noteHeight, 2, 2, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...INK);
      doc.text('OBSERVAÇÕES DO RELATÓRIO', marginX + 4, y + 6);
      doc.setFont(fontName, 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(92, 86, 81);
      doc.text(lines, marginX + 4, y + 11);
    }
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
    doc.text(`Gerado em ${generatedAt}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - marginX, pageHeight - 6, { align: 'right' });
  }

  const blob = doc.output('blob');
  if (download) {
    const prefix = isTabelaVendas ? 'Tabela_Vendas' : escopo === 'completo' ? 'Unidades_Completas' : 'Unidades_Disponiveis';
    doc.save(`${prefix}_${safeName}_${dateStamp}.pdf`);
    toast.success(`${ordenadas.length} ${isLoteamento ? 'lote(s)' : 'unidade(s)'} exportado(s) em PDF.`);
  }
  return blob;
}

export async function exportUnidadesDisponiveisPdf(options: ExportUnidadesDisponiveisPdfOptions) {
  return exportUnidadesPdf({ ...options, escopo: options.escopo ?? 'disponiveis' });
}
