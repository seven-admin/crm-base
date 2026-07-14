import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

import nexaLogoAsset from '@/assets/nexa-logo.png';
import nexaSymbolAsset from '@/assets/nexa-symbol.png';
import { supabase } from '@/integrations/supabase/client';

export interface ExportUnidadeInput {
  id: string;
  numero: string;
  andar?: number | null;
  area_privativa?: number | null;
  valor?: number | null;
  bloco?: { nome?: string | null } | null;
  tipologia?: { nome?: string | null } | null;
}

export interface ExportEmpreendimentoInput {
  nome: string;
  texto_rodape_relatorio?: string | null;
}

export interface ExportUnidadesDisponiveisPdfOptions {
  empreendimento: ExportEmpreendimentoInput;
  unidades: ExportUnidadeInput[];
  isLoteamento?: boolean;
}

export async function exportUnidadesDisponiveisPdf({
  empreendimento,
  unidades,
  isLoteamento = false,
}: ExportUnidadesDisponiveisPdfOptions) {
  if (!unidades || unidades.length === 0) {
    toast.warning('Nenhuma unidade disponível para exportar.');
    return;
  }

  const ordenadas = [...unidades].sort((a, b) => {
    const blocoA = a.bloco?.nome || '';
    const blocoB = b.bloco?.nome || '';
    const blocoCompare = blocoA.localeCompare(blocoB, 'pt-BR', { numeric: true });
    if (blocoCompare !== 0) return blocoCompare;
    const andarCompare = (a.andar ?? 0) - (b.andar ?? 0);
    if (andarCompare !== 0) return andarCompare;
    return a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true });
  });

  const blocoLabel = isLoteamento ? 'Quadra' : 'Bloco';
  const unidLabel = isLoteamento ? 'Lote' : 'Número';
  const dataGeracao = format(new Date(), 'dd/MM/yyyy HH:mm');
  const nomeEmpreendimento = empreendimento.nome
    .replace(/[^a-zA-Z0-9À-ÿ ]/g, '')
    .replace(/ /g, '_');
  const dataHoje = format(new Date(), 'dd-MM-yyyy');

  const formatarMoeda = (valor: number | null | undefined) => {
    if (valor == null) return '-';
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  const fetchAsDataURL = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  let logoBase64 = '';
  let symbolBase64 = '';
  try {
    [logoBase64, symbolBase64] = await Promise.all([
      fetchAsDataURL(nexaLogoAsset),
      fetchAsDataURL(nexaSymbolAsset),
    ]);
  } catch (err) {
    console.warn('Falha ao pré-carregar imagens da marca:', err);
  }

  const unidadeIds = ordenadas.map((u) => u.id);
  const boxesPorUnidade = new Map<string, string[]>();
  if (unidadeIds.length > 0) {
    const { data: boxesData } = await supabase
      .from('seven_boxes')
      .select('numero, tipo, unidade_id')
      .in('unidade_id', unidadeIds)
      .eq('is_active', true);
    (boxesData || []).forEach((b: any) => {
      if (!b.unidade_id) return;
      const arr = boxesPorUnidade.get(b.unidade_id) || [];
      arr.push(`${b.numero}`);
      boxesPorUnidade.set(b.unidade_id, arr);
    });
  }

  const body = ordenadas.map((u) => {
    const boxNumeros = boxesPorUnidade.get(u.id)?.join(', ') || '-';
    return [
      u.numero,
      u.bloco?.nome || '-',
      u.andar != null ? `${u.andar}º` : '-',
      u.tipologia?.nome || '-',
      boxNumeros,
      u.area_privativa != null
        ? Number(u.area_privativa).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '-',
      formatarMoeda(u.valor ?? null),
    ];
  });

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;

  const drawPageChrome = () => {
    if (symbolBase64) {
      try {
        const anyDoc = doc as any;
        anyDoc.saveGraphicsState();
        anyDoc.setGState(new anyDoc.GState({ opacity: 0.06 }));
        const wmSize = 110;
        doc.addImage(
          symbolBase64,
          'PNG',
          (pageWidth - wmSize) / 2,
          (pageHeight - wmSize) / 2,
          wmSize,
          wmSize,
        );
        anyDoc.restoreGraphicsState();
      } catch {
        // silencioso
      }
    }

    const logoH = 8;
    const logoW = logoH * 3.98;
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', marginX, 8, logoW, logoH);
      } catch {
        /* noop */
      }
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(empreendimento.nome, marginX, 8 + logoH + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('Unidades Disponíveis', pageWidth - marginX, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Gerado em ${dataGeracao}`, pageWidth - marginX, 17, { align: 'right' });

    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(marginX, 25, pageWidth - marginX, 25);
  };

  autoTable(doc, {
    startY: 30,
    margin: { top: 30, right: marginX, bottom: 18, left: marginX },
    head: [[unidLabel, blocoLabel, 'Andar', 'Tipologia', 'Box', 'Área (m²)', 'Valor (R$)']],
    body,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 1.2, bottom: 1.2, left: 2, right: 2 },
      lineWidth: 0,
      textColor: [40, 40, 40],
      overflow: 'linebreak',
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: undefined as any,
      textColor: [17, 17, 17],
      lineWidth: { top: 0, right: 0, bottom: 0.2, left: 0 },
      lineColor: [180, 180, 180],
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 42 },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 42, halign: 'right' },
    },
    didDrawPage: () => {
      drawPageChrome();
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 30;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Total de unidades disponíveis: ${ordenadas.length}`,
    pageWidth - marginX,
    finalY + 6,
    { align: 'right' },
  );

  const rodapeTexto = empreendimento.texto_rodape_relatorio;
  if (rodapeTexto) {
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    const linhas = doc.splitTextToSize(rodapeTexto, pageWidth - marginX * 2);
    doc.text(linhas, marginX, finalY + 14);
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 6, {
      align: 'right',
    });
  }

  try {
    doc.save(`Unidades_Disponiveis_${nomeEmpreendimento}_${dataHoje}.pdf`);
    toast.success(`${ordenadas.length} unidade(s) exportada(s) em PDF com sucesso.`);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    toast.error('Erro ao gerar o PDF.');
  }
}
