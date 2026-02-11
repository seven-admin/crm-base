import { useState, useMemo, useCallback, useRef, useEffect, Fragment } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Plus, Trash2, Copy, MessageSquare, CalendarIcon, Loader2, Edit2 } from 'lucide-react';
import { format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePlanejamentoItens } from '@/hooks/usePlanejamentoItens';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { usePlanejamentoStatus } from '@/hooks/usePlanejamentoStatus';
import { useFuncionariosSeven } from '@/hooks/useFuncionariosSeven';
import type { PlanejamentoItemWithRelations, PlanejamentoFase } from '@/types/planejamento.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ResponsaveisEditor } from './ResponsaveisEditor';
import { EditarEmLoteDialog } from './EditarEmLoteDialog';
import { ExcluirEmLoteDialog } from './ExcluirEmLoteDialog';

interface Props {
  empreendimentoId: string;
  readOnly?: boolean;
}

export function PlanejamentoPlanilha({ empreendimentoId, readOnly = false }: Props) {
  const { itens, isLoading, createItem, updateItem, deleteItem, duplicateItem, refetch } = usePlanejamentoItens({ empreendimento_id: empreendimentoId });
  const { fases, isLoading: loadingFases } = usePlanejamentoFases();
  const { statusList, isLoading: loadingStatus } = usePlanejamentoStatus();
  const { data: funcionarios } = useFuncionariosSeven();

  const [collapsedFases, setCollapsedFases] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newItemFaseId, setNewItemFaseId] = useState<string | null>(null);
  const [newItemValue, setNewItemValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editEmLoteOpen, setEditEmLoteOpen] = useState(false);
  const [excluirEmLoteOpen, setExcluirEmLoteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Agrupar itens por fase
  const itensByFase = useMemo(() => {
    if (!itens || !fases) return {};
    const grouped: Record<string, PlanejamentoItemWithRelations[]> = {};
    fases.forEach(fase => {
      grouped[fase.id] = itens
        .filter(item => item.fase_id === fase.id)
        .sort((a, b) => a.ordem - b.ordem);
    });
    return grouped;
  }, [itens, fases]);

  // Itens sem data
  const itensSemData = useMemo(() => {
    return itens?.filter(item => !item.data_inicio && !item.data_fim) || [];
  }, [itens]);

  const toggleFase = (faseId: string) => {
    setCollapsedFases(prev => {
      const next = new Set(prev);
      if (next.has(faseId)) {
        next.delete(faseId);
      } else {
        next.add(faseId);
      }
      return next;
    });
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!itens) return;
    if (selectedIds.size === itens.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(itens.map(i => i.id)));
    }
  };

  const toggleSelectFase = (faseId: string) => {
    const faseItems = itensByFase[faseId] || [];
    const allSelected = faseItems.every(i => selectedIds.has(i.id));
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        faseItems.forEach(i => next.delete(i.id));
      } else {
        faseItems.forEach(i => next.add(i.id));
      }
      return next;
    });
  };

  const handleCellClick = (id: string, field: string, value: string | null) => {
    if (readOnly) return;
    setEditingCell({ id, field });
    setEditValue(value || '');
  };

  const handleSave = useCallback(() => {
    if (!editingCell) return;
    
    const fieldValue = editingCell.field === 'data_inicio' || editingCell.field === 'data_fim'
      ? (editValue || null)
      : editValue;

    updateItem.mutate({ 
      id: editingCell.id, 
      [editingCell.field]: fieldValue 
    });
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, updateItem]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleSelectChange = (id: string, field: string, value: string) => {
    updateItem.mutate({ id, [field]: value });
  };

  const handleDateChange = (id: string, field: string, date: Date | undefined) => {
    // Buscar item atual para validação
    const item = itens?.find(i => i.id === id);
    if (!item) return;

    const newDateStr = date ? format(date, 'yyyy-MM-dd') : null;
    
    // Montar datas para validação
    const dataInicio = field === 'data_inicio' ? newDateStr : item.data_inicio;
    const dataFim = field === 'data_fim' ? newDateStr : item.data_fim;
    
    // Validar constraint: data_fim >= data_inicio
    if (dataInicio && dataFim && dataFim < dataInicio) {
      toast.error('A data de fim deve ser igual ou posterior à data de início');
      return;
    }

    updateItem.mutate({ id, [field]: newDateStr });
  };

  const handleCreateItem = (faseId: string) => {
    if (!newItemValue.trim()) return;
    
    const defaultStatus = statusList?.find(s => s.ordem === 1);
    if (!defaultStatus) return;

    createItem.mutate({
      empreendimento_id: empreendimentoId,
      fase_id: faseId,
      status_id: defaultStatus.id,
      item: newItemValue.trim(),
      ordem: (itensByFase[faseId]?.length || 0) + 1
    });

    setNewItemValue('');
    setNewItemFaseId(null);
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  if (isLoading || loadingFases || loadingStatus) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {!readOnly && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={itens && itens.length > 0 && selectedIds.size === itens.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="w-[280px]">Item/Tarefa</TableHead>
              <TableHead className="w-[180px]">Responsáveis</TableHead>
              <TableHead className="w-[160px]">Status</TableHead>
              <TableHead className="w-[120px]">Início</TableHead>
              <TableHead className="w-[120px]">Fim</TableHead>
              <TableHead className="w-[50px]">Obs</TableHead>
              {!readOnly && <TableHead className="w-[80px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fases?.map((fase) => (
              <Fragment key={fase.id}>
                {/* Linha da Fase */}
                <TableRow 
                  className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                  onClick={() => toggleFase(fase.id)}
                >
                  {!readOnly && (
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={itensByFase[fase.id]?.length > 0 && itensByFase[fase.id]?.every(i => selectedIds.has(i.id))}
                        onCheckedChange={() => toggleSelectFase(fase.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2 font-medium">
                      {collapsedFases.has(fase.id) ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: fase.cor }}
                      />
                      <span>{fase.nome}</span>
                      <Badge variant="secondary" className="ml-2">
                        {itensByFase[fase.id]?.length || 0}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-2"></TableCell>
                  <TableCell className="py-2"></TableCell>
                  <TableCell className="py-2"></TableCell>
                  <TableCell className="py-2"></TableCell>
                  <TableCell className="py-2"></TableCell>
                  {!readOnly && <TableCell className="py-2"></TableCell>}
                </TableRow>

                {/* Itens da Fase */}
                {!collapsedFases.has(fase.id) && (
                  <>
                    {itensByFase[fase.id]?.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        statusList={statusList || []}
                        funcionarios={funcionarios || []}
                        editingCell={editingCell}
                        editValue={editValue}
                        inputRef={inputRef}
                        readOnly={readOnly}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={() => toggleSelectItem(item.id)}
                        onCellClick={handleCellClick}
                        onEditValueChange={setEditValue}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        onSelectChange={handleSelectChange}
                        onDateChange={handleDateChange}
                        onDelete={() => deleteItem.mutate(item.id)}
                        onDuplicate={() => duplicateItem.mutate(item.id)}
                      />
                    ))}

                    {/* Linha para novo item */}
                    {!readOnly && (
                      <TableRow className="hover:bg-muted/20">
                        <TableCell className="py-1"></TableCell>
                        <TableCell className="py-1">
                          {newItemFaseId === fase.id ? (
                            <Input
                              value={newItemValue}
                              onChange={(e) => setNewItemValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCreateItem(fase.id);
                                } else if (e.key === 'Escape') {
                                  setNewItemFaseId(null);
                                  setNewItemValue('');
                                }
                              }}
                              onBlur={() => {
                                if (newItemValue.trim()) {
                                  handleCreateItem(fase.id);
                                } else {
                                  setNewItemFaseId(null);
                                }
                              }}
                              placeholder="Digite o nome da tarefa..."
                              className="h-8"
                              autoFocus
                            />
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground h-8"
                              onClick={() => setNewItemFaseId(fase.id)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar tarefa
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="py-1"></TableCell>
                        <TableCell className="py-1"></TableCell>
                        <TableCell className="py-1"></TableCell>
                        <TableCell className="py-1"></TableCell>
                        <TableCell className="py-1"></TableCell>
                        <TableCell className="py-1"></TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Seção de itens sem data */}
      {itensSemData.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Sem data definida ({itensSemData.length} {itensSemData.length === 1 ? 'item' : 'itens'})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="border rounded-lg p-4 space-y-2 bg-muted/20">
              {itensSemData.map(item => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: item.fase?.cor }}
                  />
                  <span className="flex-1">{item.item}</span>
                  <span className="text-muted-foreground text-xs">{item.fase?.nome}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Barra flutuante de seleção */}
      {!readOnly && selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
          <span className="text-sm font-medium">
            {selectedIds.size} item(ns) selecionado(s)
          </span>
          <Button size="sm" onClick={() => setEditEmLoteOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Editar em Lote
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setExcluirEmLoteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Dialog de edição em lote */}
      <EditarEmLoteDialog
        open={editEmLoteOpen}
        onOpenChange={setEditEmLoteOpen}
        selectedIds={selectedIds}
        empreendimentoId={empreendimentoId}
        onSuccess={() => {
          setSelectedIds(new Set());
          refetch();
        }}
      />

      {/* Dialog de exclusão em lote */}
      <ExcluirEmLoteDialog
        open={excluirEmLoteOpen}
        onOpenChange={setExcluirEmLoteOpen}
        selectedIds={selectedIds}
        items={itens || []}
        empreendimentoId={empreendimentoId}
        onSuccess={() => {
          setSelectedIds(new Set());
          refetch();
        }}
      />
    </div>
  );
}

// Componente de linha de item separado para melhor organização
interface ItemRowProps {
  item: PlanejamentoItemWithRelations;
  statusList: { id: string; nome: string; cor: string }[];
  funcionarios: { id: string; full_name: string }[];
  editingCell: { id: string; field: string } | null;
  editValue: string;
  inputRef: React.RefObject<HTMLInputElement>;
  readOnly: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onCellClick: (id: string, field: string, value: string | null) => void;
  onEditValueChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  onSelectChange: (id: string, field: string, value: string) => void;
  onDateChange: (id: string, field: string, date: Date | undefined) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function ItemRow({
  item,
  statusList,
  funcionarios,
  editingCell,
  editValue,
  inputRef,
  readOnly,
  isSelected,
  onToggleSelect,
  onCellClick,
  onEditValueChange,
  onKeyDown,
  onBlur,
  onSelectChange,
  onDateChange,
  onDelete,
  onDuplicate
}: ItemRowProps) {
  const isEditingItem = editingCell?.id === item.id && editingCell?.field === 'item';
  const [obsOpen, setObsOpen] = useState(false);
  const [localObs, setLocalObs] = useState(item.obs || '');

  // Sincronizar localObs quando o item mudar e o popover estiver fechado
  useEffect(() => {
    if (!obsOpen) {
      setLocalObs(item.obs || '');
    }
  }, [item.obs, obsOpen]);

  return (
    <TableRow className={cn("hover:bg-muted/20", isSelected && "bg-primary/5")}>
      {/* Checkbox de seleção */}
      {!readOnly && (
        <TableCell className="py-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
          />
        </TableCell>
      )}

      {/* Item/Tarefa */}
      <TableCell className="py-1">
        {isEditingItem ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            className="h-8"
          />
        ) : (
          <div
            className={cn(
              "px-2 py-1 rounded cursor-pointer min-h-[32px] flex items-center",
              !readOnly && "hover:bg-muted/50"
            )}
            onClick={() => onCellClick(item.id, 'item', item.item)}
          >
            {item.item}
          </div>
        )}
      </TableCell>

      {/* Responsáveis */}
      <TableCell className="py-1">
        <ResponsaveisEditor
          itemId={item.id}
          funcionarios={funcionarios}
          readOnly={readOnly}
        />
      </TableCell>
      {/* Status */}
      <TableCell className="py-1">
        {readOnly ? (
          <Badge 
            style={{ 
              backgroundColor: item.status?.cor + '20',
              color: item.status?.cor,
              borderColor: item.status?.cor
            }}
            variant="outline"
          >
            {item.status?.nome}
          </Badge>
        ) : (
          <Select
            value={item.status_id}
            onValueChange={(v) => onSelectChange(item.id, 'status_id', v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusList.map(status => (
                <SelectItem key={status.id} value={status.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: status.cor }}
                    />
                    {status.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </TableCell>

      {/* Data Início */}
      <TableCell className="py-1">
        <DatePickerCell
          value={item.data_inicio}
          onChange={(date) => onDateChange(item.id, 'data_inicio', date)}
          readOnly={readOnly}
          maxDate={item.data_fim ? parseISO(item.data_fim) : undefined}
        />
      </TableCell>

      {/* Data Fim */}
      <TableCell className="py-1">
        <DatePickerCell
          value={item.data_fim}
          onChange={(date) => onDateChange(item.id, 'data_fim', date)}
          readOnly={readOnly}
          minDate={item.data_inicio ? parseISO(item.data_inicio) : undefined}
        />
      </TableCell>

      {/* Observações */}
      <TableCell className="py-1">
        <Popover 
          open={obsOpen} 
          onOpenChange={(open) => {
            // Salvar ao fechar se houve alteração
            if (!open && localObs !== (item.obs || '')) {
              onSelectChange(item.id, 'obs', localObs);
            }
            setObsOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8", item.obs && "text-primary")}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-2">
              <p className="text-sm font-medium">Observações</p>
              {readOnly ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.obs || 'Sem observações'}
                </p>
              ) : (
                <Textarea
                  value={localObs}
                  onChange={(e) => setLocalObs(e.target.value)}
                  placeholder="Digite observações..."
                  rows={4}
                />
              )}
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>

      {/* Ações */}
      {!readOnly && (
        <TableCell className="py-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onDuplicate}
              title="Duplicar"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
              title="Remover"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

// Componente de DatePicker inline
interface DatePickerCellProps {
  value: string | null;
  onChange: (date: Date | undefined) => void;
  readOnly: boolean;
  minDate?: Date;
  maxDate?: Date;
}

function DatePickerCell({ value, onChange, readOnly, minDate, maxDate }: DatePickerCellProps) {
  const [open, setOpen] = useState(false);
  const date = value ? parseISO(value) : undefined;

  // Função para desabilitar datas fora do range permitido
  const isDateDisabled = (day: Date) => {
    const dayStart = startOfDay(day);
    if (minDate && isBefore(dayStart, startOfDay(minDate))) {
      return true;
    }
    if (maxDate && isAfter(dayStart, startOfDay(maxDate))) {
      return true;
    }
    return false;
  };

  if (readOnly) {
    return (
      <span className="text-sm">
        {date ? format(date, 'dd/MM/yy') : '-'}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 w-full justify-start text-left font-normal px-2",
            !date && "text-muted-foreground"
          )}
        >
          {date ? format(date, 'dd/MM/yy') : '-'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          disabled={isDateDisabled}
          locale={ptBR}
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
