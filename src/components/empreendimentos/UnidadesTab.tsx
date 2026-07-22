import { useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, Grid, Map as MapIcon, Building2, Pencil, Layers, Upload, History, Check, X, Trash2, RefreshCw, FileText, MoreHorizontal, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { useTipologias } from '@/hooks/useTipologias';
import { UNIDADE_STATUS_LABELS, UNIDADE_STATUS_COLORS, type Unidade } from '@/types/empreendimentos.types';
import { MapaInterativo } from '@/components/mapa/MapaInterativo';
import { UnidadeForm } from './UnidadeForm';
import { UnidadeBulkForm } from './UnidadeBulkForm';
import { BlocoForm } from './BlocoForm';
import { ImportarUnidadesDialog } from './ImportarUnidadesDialog';

import { AlterarStatusLoteDialog } from './AlterarStatusLoteDialog';
import { AlterarTipologiaLoteDialog } from './AlterarTipologiaLoteDialog';
import { cn } from '@/lib/utils';
import { buildUnitLabel, type LabelFormatElement } from '@/lib/mapaUtils';
import { ordenarUnidadesPorBlocoENumero } from '@/lib/unidadeUtils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { exportUnidadesPdf, type ExportUnidadesEscopo } from '@/lib/exportUnidadesDisponiveisPdf';


const TIPOLOGIA_COLORS = [
  'bg-indigo-400', 'bg-pink-400', 'bg-teal-400',
  'bg-orange-400', 'bg-cyan-400', 'bg-rose-400',
  'bg-lime-400', 'bg-violet-400', 'bg-amber-400', 'bg-sky-400'
];

interface UnidadesTabProps {
  empreendimentoId: string;
}

export function UnidadesTab({ empreendimentoId }: UnidadesTabProps) {
  const { data: empreendimento } = useEmpreendimento(empreendimentoId);
  const { data: unidades, isLoading } = useUnidades(empreendimentoId);
  const { data: blocos } = useBlocos(empreendimentoId);
  const { data: tipologias } = useTipologias(empreendimentoId);
  const deleteUnidadesBatch = useDeleteUnidadesBatch();

  const [unidadeFormOpen, setUnidadeFormOpen] = useState(false);
  const [bulkFormOpen, setBulkFormOpen] = useState(false);
  const [blocoFormOpen, setBlocoFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [vendaHistoricaOpen, setVendaHistoricaOpen] = useState(false);
  const [statusLoteOpen, setStatusLoteOpen] = useState(false);
  const [tipologiaLoteOpen, setTipologiaLoteOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [legendaTipologiasOpen, setLegendaTipologiasOpen] = useState(false);
  
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

  // Mapa tipologia_id -> cor
  const tipologiaColorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (tipologias) {
      tipologias.forEach((tip, index) => {
        map.set(tip.id, TIPOLOGIA_COLORS[index % TIPOLOGIA_COLORS.length]);
      });
    }
    return map;
  }, [tipologias]);

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

  const handleExportarPdf = async (escopo: ExportUnidadesEscopo) => {
    if (!unidades || !empreendimento) return;
    setIsExportingPdf(true);
    try {
      const unitsToExport = escopo === 'completo'
        ? unidades
        : unidades.filter((unit) => unit.status === 'disponivel');
      await exportUnidadesPdf({
        empreendimento: {
          nome: empreendimento.nome,
          texto_rodape_relatorio: empreendimento.texto_rodape_relatorio ?? null,
        },
        unidades: unitsToExport.map((unit) => ({
          id: unit.id,
          numero: unit.numero,
          andar: unit.andar,
          area_privativa: unit.area_privativa,
          valor: unit.valor,
          status: unit.status,
          bloco: unit.bloco ? { nome: unit.bloco.nome } : null,
          tipologia: unit.tipologia ? { nome: unit.tipologia.nome } : null,
        })),
        isLoteamento,
        escopo,
        marca: 'seven',
      });
    } finally {
      setIsExportingPdf(false);
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      Mais ações
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleExportarPdf('completo')} disabled={isExportingPdf || !unidades?.length}>
                      {isExportingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                      Exportar lista completa (PDF)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportarPdf('disponiveis')} disabled={isExportingPdf || unidadesDisponiveis.length === 0}>
                      <FileText className="h-4 w-4 mr-2" />
                      Exportar disponíveis (PDF)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBulkFormOpen(true)}>
                      <Layers className="h-4 w-4 mr-2" />
                      Adicionar em Lote
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBlocoFormOpen(true)}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Nov{isLoteamento ? 'a' : 'o'} {agrupamentoLabel}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectionMode('tipologia')}>
                      <Layers className="h-4 w-4 mr-2" />
                      Alterar Tipologia
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectionMode('status')}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Alterar Status
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectionMode('venda')}>
                      <History className="h-4 w-4 mr-2" />
                      Venda Histórica
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setSelectionMode('delete')}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir em Lote
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

            {tipologias && tipologias.length > 0 && (
              <Collapsible open={legendaTipologiasOpen} onOpenChange={setLegendaTipologiasOpen} className="mb-6">
                <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                  Tipologias ({tipologias.length})
                  <ChevronDown className={cn('h-4 w-4 transition-transform', legendaTipologiasOpen && 'rotate-180')} />
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-wrap gap-4 pt-3">
                  {tipologias.map((tip) => (
                    <div key={tip.id} className="flex items-center gap-1.5">
                      <div className={cn('w-2.5 h-2.5 rounded-full', tipologiaColorMap.get(tip.id))} />
                      <span className="text-sm">{tip.nome}</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {unidades && unidades.length > 0 ? (
              <div className="space-y-6">
                {sortedBlocoEntries.map(([blocoId, blocoUnidades]) => {
                  const bloco = blocos?.find(b => b.id === blocoId);
                  const isPredioOuComercial = empreendimento?.tipo === 'predio' || empreendimento?.tipo === 'comercial';

                  // Sub-agrupar por andar para prédios/comerciais
                  // Tinta leve + contorno fino na cor do status (mesmas cores da legenda/UNIDADE_STATUS_COLORS)
                  const CARD_STATUS_COLORS: Record<string, string> = {
                    disponivel: 'bg-emerald-500/10 border border-emerald-500/30',
                    reservada: 'bg-yellow-500/10 border border-yellow-500/30',
                    negociacao: 'bg-blue-500/10 border border-blue-500/30',
                    contrato: 'bg-purple-500/10 border border-purple-500/30',
                    vendida: 'bg-red-500/10 border border-red-500/30',
                    bloqueada: 'bg-gray-500/10 border border-gray-500/30',
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
                        {unidade.tipologia_id && tipologiaColorMap.has(unidade.tipologia_id) && (
                          <div className={cn('absolute top-1.5 right-1.5 w-2 h-2 rounded-full', tipologiaColorMap.get(unidade.tipologia_id))} />
                        )}
                        <span className="text-xs font-semibold leading-tight">{label}</span>
                        {tipologiaNome && (
                          <span className="text-[10px] leading-tight text-slate-600 mt-0.5 truncate max-w-full">{tipologiaNome}</span>
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
