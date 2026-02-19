import { useState, useMemo } from 'react';
import logoImg from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, Grid, Map as MapIcon, Building2, Pencil, Layers, Upload, History, Check, X, Trash2, RefreshCw, FileText } from 'lucide-react';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';
import { Toggle } from '@/components/ui/toggle';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useUnidades, useDeleteUnidadesBatch } from '@/hooks/useUnidades';
import { useBlocos } from '@/hooks/useBlocos';
import { useEmpreendimento } from '@/hooks/useEmpreendimentos';
import { UNIDADE_STATUS_LABELS, UNIDADE_STATUS_COLORS, type Unidade } from '@/types/empreendimentos.types';
import { MapaInterativo } from '@/components/mapa/MapaInterativo';
import { UnidadeForm } from './UnidadeForm';
import { UnidadeBulkForm } from './UnidadeBulkForm';
import { BlocoForm } from './BlocoForm';
import { ImportarUnidadesDialog } from './ImportarUnidadesDialog';
import { VendaHistoricaDialog } from './VendaHistoricaDialog';
import { AlterarStatusLoteDialog } from './AlterarStatusLoteDialog';
import { AlterarTipologiaLoteDialog } from './AlterarTipologiaLoteDialog';
import { cn } from '@/lib/utils';
import { buildUnitLabel, type LabelFormatElement } from '@/lib/mapaUtils';
import { ordenarUnidadesPorBlocoENumero } from '@/lib/unidadeUtils';
import { toast } from 'sonner';

interface UnidadesTabProps {
  empreendimentoId: string;
}

export function UnidadesTab({ empreendimentoId }: UnidadesTabProps) {
  const { data: empreendimento } = useEmpreendimento(empreendimentoId);
  const { data: unidades, isLoading } = useUnidades(empreendimentoId);
  const { data: blocos } = useBlocos(empreendimentoId);
  const deleteUnidadesBatch = useDeleteUnidadesBatch();

  const [unidadeFormOpen, setUnidadeFormOpen] = useState(false);
  const [bulkFormOpen, setBulkFormOpen] = useState(false);
  const [blocoFormOpen, setBlocoFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [vendaHistoricaOpen, setVendaHistoricaOpen] = useState(false);
  const [statusLoteOpen, setStatusLoteOpen] = useState(false);
  const [tipologiaLoteOpen, setTipologiaLoteOpen] = useState(false);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  
  // Estado para seleção de unidades
  const [selectionMode, setSelectionMode] = useState<'venda' | 'delete' | 'status' | 'tipologia' | false>(false);
  const [selectedUnidadeIds, setSelectedUnidadeIds] = useState<Set<string>>(new Set());

  const tiposComMapa = ['loteamento', 'condominio'];
  const usaMapa = empreendimento && tiposComMapa.includes(empreendimento.tipo);
  const [viewMode, setViewMode] = useState<'grid' | 'mapa'>(usaMapa ? 'mapa' : 'grid');

  const isLoteamento = empreendimento?.tipo === 'loteamento' || empreendimento?.tipo === 'condominio';
  const agrupamentoLabel = isLoteamento ? 'Quadra' : 'Bloco';
  const unidadeLabel = isLoteamento ? 'Lote' : 'Unidade';

  const unidadesByBloco = useMemo(() => {
    if (!unidades) return {};
    
    // Agrupar unidades por bloco
    const grouped = unidades.reduce((acc, unidade) => {
      const blocoId = unidade.bloco_id || 'sem-bloco';
      if (!acc[blocoId]) acc[blocoId] = [];
      acc[blocoId].push(unidade);
      return acc;
    }, {} as Record<string, Unidade[]>);
    
    // Ordenar unidades dentro de cada bloco por número
    Object.values(grouped).forEach(blocoUnidades => {
      blocoUnidades.sort((a, b) => {
        const numA = parseInt(a.numero);
        const numB = parseInt(b.numero);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true });
      });
    });
    
    return grouped;
  }, [unidades]);

  // Ordenar blocos/quadras por nome
  const sortedBlocoEntries = useMemo(() => {
    return Object.entries(unidadesByBloco).sort((a, b) => {
      const blocoA = blocos?.find(bl => bl.id === a[0]);
      const blocoB = blocos?.find(bl => bl.id === b[0]);
      const nomeA = blocoA?.nome || 'zzz'; // 'sem-bloco' vai pro final
      const nomeB = blocoB?.nome || 'zzz';
      return nomeA.localeCompare(nomeB, 'pt-BR', { numeric: true });
    });
  }, [unidadesByBloco, blocos]);

  // Formato do label para as unidades (mesmo do mapa)
  const labelFormato = (empreendimento?.mapa_label_formato as LabelFormatElement[] | undefined) 
    || ['bloco', 'tipologia', 'numero'];

  // Unidades selecionadas (apenas disponíveis)
  const unidadesSelecionadas = useMemo(() => {
    if (!unidades) return [];
    return unidades.filter(u => selectedUnidadeIds.has(u.id));
  }, [unidades, selectedUnidadeIds]);

  // Unidades disponíveis para seleção
  const unidadesDisponiveis = useMemo(() => {
    if (!unidades) return [];
    return unidades.filter(u => u.status === 'disponivel');
  }, [unidades]);

  const handleEditUnidade = (unidade: Unidade) => {
    if (selectionMode) return;
    setSelectedUnidade(unidade);
    setUnidadeFormOpen(true);
  };

  const handleNewUnidade = () => {
    setSelectedUnidade(null);
    setUnidadeFormOpen(true);
  };

  const handleToggleSelection = (unidadeId: string, status: string) => {
    // Para venda histórica: apenas unidades disponíveis
    // Para exclusão e status: todas as unidades
    if (selectionMode === 'venda' && status !== 'disponivel') return;
    
    setSelectedUnidadeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unidadeId)) {
        newSet.delete(unidadeId);
      } else {
        newSet.add(unidadeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectionMode === 'venda') {
      setSelectedUnidadeIds(new Set(unidadesDisponiveis.map(u => u.id)));
    } else {
      // Para delete e status: selecionar todas
      setSelectedUnidadeIds(new Set(unidades?.map(u => u.id) || []));
    }
  };

  const handleDeselectAll = () => {
    setSelectedUnidadeIds(new Set());
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedUnidadeIds(new Set());
  };

  const handleVendaHistoricaSuccess = () => {
    handleExitSelectionMode();
  };

  const handleExportarDisponiveis = async () => {
    if (!unidades || !empreendimento) return;
    
    const disponiveis = unidades.filter(u => u.status === 'disponivel');
    if (disponiveis.length === 0) {
      toast.warning('Nenhuma unidade disponível para exportar.');
      return;
    }

    // Ordenação: Bloco/Quadra → Andar → Número
    const ordenadas = [...disponiveis].sort((a, b) => {
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
    const dataGeracao = format(new Date(), 'dd/MM/yyyy HH:mm:ss');

    const formatarMoeda = (valor: number | null | undefined) => {
      if (valor == null) return '-';
      return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
    };

    // Separadores de linha via div (evita artefatos de border-bottom/border-top no html2canvas)
    const rowSep = `<tr><td colspan="6" style="padding:0; height:1px; background:#cccccc; font-size:0; line-height:0;"></td></tr>`;

    const tdBase = "padding: 3px 6px; font-family: 'Courier New', Courier, monospace; font-size: 7.5pt; white-space: nowrap; line-height: 1.4; vertical-align: middle; background:#ffffff;";

    const linhasHtml = ordenadas.map((u) =>
      `${rowSep}<tr style="background:#ffffff;">` +
      `<td style="${tdBase} text-align:center;">${u.numero}</td>` +
      `<td style="${tdBase}">${u.bloco?.nome || '-'}</td>` +
      `<td style="${tdBase} text-align:center;">${u.andar != null ? u.andar + 'º' : '-'}</td>` +
      `<td style="${tdBase}">${u.tipologia?.nome || '-'}</td>` +
      `<td style="${tdBase} text-align:center;">${u.area_privativa != null ? Number(u.area_privativa).toLocaleString('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2}) : '-'}</td>` +
      `<td style="${tdBase} text-align:right;">${formatarMoeda(u.valor)}</td>` +
      `</tr>`
    ).join('');

    const htmlContent = `
      <div style="font-family: 'Helvetica', 'Arial', sans-serif; color: #333; box-sizing: border-box; padding-right: 30px;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 2px solid #aaaaaa;">
          <div>
            <div style="font-size: 12pt; font-weight: bold; line-height: 1.3;">CRM 360 – Seven Group 360</div>
            <div style="font-size: 8pt; color: #777;">Plataforma de Gestão Integrada</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12pt; font-weight: bold;">Unidades Disponíveis</div>
            <div style="font-size: 10pt; color: #555;">${empreendimento.nome}</div>
            <div style="font-size: 8pt; color: #777;">Gerado em ${dataGeracao}</div>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
          <thead>
            <tr style="background: #e5e5e5;">
              <th style="padding: 4px 6px; text-align: center; font-weight: bold; font-size: 8pt; line-height: 1.4; vertical-align: middle; border-bottom: 2px solid #555555;">${unidLabel}</th>
              <th style="padding: 4px 6px; text-align: left;   font-weight: bold; font-size: 8pt; line-height: 1.4; vertical-align: middle; border-bottom: 2px solid #555555;">${blocoLabel}</th>
              <th style="padding: 4px 6px; text-align: center; font-weight: bold; font-size: 8pt; line-height: 1.4; vertical-align: middle; border-bottom: 2px solid #555555;">Andar</th>
              <th style="padding: 4px 6px; text-align: left;   font-weight: bold; font-size: 8pt; line-height: 1.4; vertical-align: middle; border-bottom: 2px solid #555555;">Tipologia</th>
              <th style="padding: 4px 6px; text-align: center; font-weight: bold; font-size: 8pt; line-height: 1.4; vertical-align: middle; border-bottom: 2px solid #555555;">Área (m²)</th>
              <th style="padding: 4px 6px; text-align: right;  font-weight: bold; font-size: 8pt; line-height: 1.4; vertical-align: middle; border-bottom: 2px solid #555555;">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>${linhasHtml}</tbody>
        </table>
        <p style="margin: 12px 0 0; font-size: 9pt; color: #555; text-align: right; white-space: nowrap;">
          Total de unidades disponíveis: <strong>${ordenadas.length}</strong>
        </p>
        <div style="height: 20px;"></div>
      </div>
    `;

    const container = document.createElement('div');
    container.style.width = '680px';
    container.style.background = 'white';
    container.innerHTML = htmlContent;

    const nomeEmpreendimento = empreendimento.nome.replace(/[^a-zA-Z0-9À-ÿ ]/g, '').replace(/ /g, '_');
    const dataHoje = format(new Date(), 'dd-MM-yyyy');

    try {
      await (html2pdf() as any).set({
        margin: 15,
        filename: `Unidades_Disponiveis_${nomeEmpreendimento}_${dataHoje}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', width: 660, windowWidth: 660 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }).from(container).save();
      toast.success(`${disponiveis.length} unidade(s) exportada(s) em PDF com sucesso.`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o PDF.');
    }
  };

  const handleDeleteSelected = () => {
    deleteUnidadesBatch.mutate(
      { ids: Array.from(selectedUnidadeIds), empreendimentoId },
      { onSuccess: handleExitSelectionMode }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold">{isLoteamento ? 'Lotes' : 'Unidades'}</h3>
            <p className="text-sm text-muted-foreground">
              {unidades?.length || 0} {isLoteamento ? 'lotes' : 'unidades'} cadastrad{isLoteamento ? 'os' : 'as'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectionMode ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedUnidadeIds.size} selecionado(s)
                </span>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Selecionar Todos
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  Limpar
                </Button>
                {selectionMode === 'venda' && (
                  <Button
                    size="sm"
                    onClick={() => setVendaHistoricaOpen(true)}
                    disabled={selectedUnidadeIds.size === 0}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Registrar Venda ({selectedUnidadeIds.size})
                  </Button>
                )}
                {selectionMode === 'status' && (
                  <Button
                    size="sm"
                    onClick={() => setStatusLoteOpen(true)}
                    disabled={selectedUnidadeIds.size === 0}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Alterar Status ({selectedUnidadeIds.size})
                  </Button>
                )}
                {selectionMode === 'tipologia' && (
                  <Button
                    size="sm"
                    onClick={() => setTipologiaLoteOpen(true)}
                    disabled={selectedUnidadeIds.size === 0}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Alterar Tipologia ({selectedUnidadeIds.size})
                  </Button>
                )}
                {selectionMode === 'delete' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={selectedUnidadeIds.size === 0 || deleteUnidadesBatch.isPending}
                      >
                        {deleteUnidadesBatch.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir ({selectedUnidadeIds.size})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão em lote</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir {selectedUnidadeIds.size} unidade(s)?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelected}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button variant="ghost" size="sm" onClick={handleExitSelectionMode}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                {usaMapa && (
                  <div className="flex items-center border rounded-lg p-1">
                    <Toggle pressed={viewMode === 'grid'} onPressedChange={() => setViewMode('grid')} size="sm">
                      <Grid className="h-4 w-4" />
                    </Toggle>
                    <Toggle pressed={viewMode === 'mapa'} onPressedChange={() => setViewMode('mapa')} size="sm">
                      <MapIcon className="h-4 w-4" />
                    </Toggle>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={handleExportarDisponiveis}>
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar Disponíveis (PDF)
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectionMode('tipologia')}>
                  <Layers className="h-4 w-4 mr-2" />
                  Alterar Tipologia
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectionMode('status')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Alterar Status
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectionMode('delete')}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir em Lote
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectionMode('venda')}>
                  <History className="h-4 w-4 mr-2" />
                  Venda Histórica
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBlocoFormOpen(true)}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Nov{isLoteamento ? 'a' : 'o'} {agrupamentoLabel}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBulkFormOpen(true)}>
                  <Layers className="h-4 w-4 mr-2" />
                  Adicionar em Lote
                </Button>
                <Button size="sm" onClick={handleNewUnidade}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nov{isLoteamento ? 'o' : 'a'} {unidadeLabel}
                </Button>
              </>
            )}
          </div>
        </div>

        {selectionMode && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            {selectionMode === 'venda' 
              ? <>Clique nas unidades <strong>disponíveis</strong> (verde) para selecioná-las para registro de venda histórica.</>
              : selectionMode === 'status'
              ? <>Clique nas unidades cujo <strong>status</strong> deseja alterar.</>
              : selectionMode === 'tipologia'
              ? <>Clique nas unidades cuja <strong>tipologia</strong> deseja alterar.</>
              : <>Clique nas unidades que deseja <strong>excluir</strong>. Esta ação é permanente.</>
            }
          </div>
        )}

        {viewMode === 'mapa' && usaMapa && !selectionMode ? (
          <div className="min-h-[500px]">
            <MapaInterativo empreendimentoId={empreendimentoId} />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-6 mb-6">
              {Object.entries(UNIDADE_STATUS_LABELS).map(([status, label]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn('w-4 h-4 rounded', UNIDADE_STATUS_COLORS[status as keyof typeof UNIDADE_STATUS_COLORS])} />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>

            {unidades && unidades.length > 0 ? (
              <div className="space-y-6">
                {sortedBlocoEntries.map(([blocoId, blocoUnidades]) => {
                  const bloco = blocos?.find(b => b.id === blocoId);
                  const isPredioOuComercial = empreendimento?.tipo === 'predio' || empreendimento?.tipo === 'comercial';

                  // Sub-agrupar por andar para prédios/comerciais
                  // Cores pastel para cards (local, sem alterar o type global)
                  const CARD_STATUS_COLORS: Record<string, string> = {
                    disponivel: 'bg-emerald-100',
                    reservada: 'bg-yellow-100',
                    negociacao: 'bg-blue-100',
                    contrato: 'bg-purple-100',
                    vendida: 'bg-red-100',
                    bloqueada: 'bg-gray-200',
                  };

                  const renderUnidadeButton = (unidade: Unidade) => {
                    const isSelected = selectedUnidadeIds.has(unidade.id);
                    const isDisponivel = unidade.status === 'disponivel';
                    const label = buildUnitLabel(unidade, labelFormato);
                    const tipologiaNome = unidade.tipologia?.nome;
                    const areaPrivativa = unidade.area_privativa ?? unidade.tipologia?.area_privativa;
                    
                    return (
                      <button
                        key={unidade.id}
                        onClick={() => {
                          if (selectionMode) {
                            handleToggleSelection(unidade.id, unidade.status);
                          } else {
                            handleEditUnidade(unidade);
                          }
                        }}
                        className={cn(
                          'relative group h-auto min-w-[5rem] p-2 rounded-lg flex flex-col items-center justify-center text-slate-800 transition-all',
                          CARD_STATUS_COLORS[unidade.status] || 'bg-gray-200',
                          selectionMode === 'venda' && isDisponivel && 'cursor-pointer ring-offset-2 hover:ring-2 ring-primary',
                          selectionMode === 'venda' && !isDisponivel && 'opacity-50 cursor-not-allowed',
                          selectionMode === 'delete' && 'cursor-pointer ring-offset-2 hover:ring-2 ring-destructive',
                          selectionMode === 'status' && 'cursor-pointer ring-offset-2 hover:ring-2 ring-primary',
                          selectionMode === 'tipologia' && 'cursor-pointer ring-offset-2 hover:ring-2 ring-primary',
                          isSelected && selectionMode === 'venda' && 'ring-2 ring-primary ring-offset-2',
                          isSelected && selectionMode === 'delete' && 'ring-2 ring-destructive ring-offset-2',
                          isSelected && selectionMode === 'status' && 'ring-2 ring-primary ring-offset-2',
                          isSelected && selectionMode === 'tipologia' && 'ring-2 ring-primary ring-offset-2',
                          !selectionMode && 'cursor-pointer hover:opacity-80'
                        )}
                        title={`${label} - ${UNIDADE_STATUS_LABELS[unidade.status]}${tipologiaNome ? ` | ${tipologiaNome}` : ''}${areaPrivativa ? ` | ${areaPrivativa}m²` : ''}`}
                        disabled={selectionMode === 'venda' && !isDisponivel}
                      >
                        <span className="text-xs font-semibold leading-tight">{label}</span>
                        {tipologiaNome && (
                          <span className="text-[10px] leading-tight text-slate-600 mt-0.5 truncate max-w-full">{tipologiaNome}</span>
                        )}
                        {areaPrivativa && (
                          <span className="text-[10px] leading-tight text-slate-500 mt-0.5">{areaPrivativa}m²</span>
                        )}
                        {selectionMode && isSelected && (
                          <div className={cn(
                            "absolute -top-1 -right-1 rounded-full p-0.5",
                            selectionMode === 'delete' ? 'bg-destructive' : 'bg-primary'
                          )}>
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                        {!selectionMode && (
                          <Pencil className="absolute top-0.5 right-0.5 h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                        )}
                      </button>
                    );
                  };

                  return (
                    <div key={blocoId}>
                      <h4 className="font-medium mb-3">
                        {bloco?.nome || `Sem ${agrupamentoLabel}`}
                      </h4>
                      {isPredioOuComercial ? (
                        // Agrupar por andar para prédios/comerciais
                        (() => {
                          const andares = new Map<number, Unidade[]>();
                          blocoUnidades?.forEach(u => {
                            const andar = u.andar ?? 0;
                            if (!andares.has(andar)) andares.set(andar, []);
                            andares.get(andar)!.push(u);
                          });
                          const sortedAndares = Array.from(andares.entries()).sort((a, b) => a[0] - b[0]);
                          
                          return (
                            <div className="space-y-4 ml-4">
                              {sortedAndares.map(([andar, units]) => (
                                <div key={andar}>
                                  <h5 className="text-sm font-medium text-muted-foreground mb-2">
                                    Andar {andar || 'Térreo'}
                                  </h5>
                                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                                    {units.map(renderUnidadeButton)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                          {blocoUnidades?.map(renderUnidadeButton)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum{isLoteamento ? ' lote' : 'a unidade'} cadastrad{isLoteamento ? 'o' : 'a'}
              </p>
            )}
          </>
        )}

        <UnidadeForm 
          open={unidadeFormOpen} 
          onOpenChange={setUnidadeFormOpen} 
          empreendimentoId={empreendimentoId} 
          unidade={selectedUnidade}
          tipoEmpreendimento={empreendimento?.tipo}
        />
        <UnidadeBulkForm
          open={bulkFormOpen}
          onOpenChange={setBulkFormOpen}
          empreendimentoId={empreendimentoId}
          tipoEmpreendimento={empreendimento?.tipo || 'predio'}
        />
        <BlocoForm 
          open={blocoFormOpen} 
          onOpenChange={setBlocoFormOpen} 
          empreendimentoId={empreendimentoId}
          tipoEmpreendimento={empreendimento?.tipo}
        />
        <ImportarUnidadesDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          empreendimentoId={empreendimentoId}
          tipoEmpreendimento={empreendimento?.tipo}
        />
        <VendaHistoricaDialog
          open={vendaHistoricaOpen}
          onOpenChange={setVendaHistoricaOpen}
          empreendimentoId={empreendimentoId}
          unidadesSelecionadas={unidadesSelecionadas}
          onSuccess={handleVendaHistoricaSuccess}
        />
        <AlterarStatusLoteDialog
          open={statusLoteOpen}
          onOpenChange={setStatusLoteOpen}
          empreendimentoId={empreendimentoId}
          selectedCount={selectedUnidadeIds.size}
          selectedIds={Array.from(selectedUnidadeIds)}
          onSuccess={handleExitSelectionMode}
        />
        <AlterarTipologiaLoteDialog
          open={tipologiaLoteOpen}
          onOpenChange={setTipologiaLoteOpen}
          empreendimentoId={empreendimentoId}
          selectedCount={selectedUnidadeIds.size}
          selectedIds={Array.from(selectedUnidadeIds)}
          onSuccess={handleExitSelectionMode}
        />
      </CardContent>
    </Card>
  );
}