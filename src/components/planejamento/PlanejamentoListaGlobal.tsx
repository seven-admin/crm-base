import { useState, useMemo, useCallback, useRef, useEffect, Fragment } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronRight, Plus, Trash2, Copy, MessageSquare, Loader2, MoreHorizontal, Zap, Building2, Search } from 'lucide-react';
import { format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePlanejamentoGlobal, type PlanejamentoGlobalFilters } from '@/hooks/usePlanejamentoGlobal';
import { usePlanejamentoItens } from '@/hooks/usePlanejamentoItens';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { usePlanejamentoStatus } from '@/hooks/usePlanejamentoStatus';
import { useFuncionariosSeven } from '@/hooks/useFuncionariosSeven';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';
import { ResponsaveisEditor } from './ResponsaveisEditor';
import { ConverterTarefaDialog } from './ConverterTarefaDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmpreendimentoColor } from '@/utils/empreendimentoColors';

interface Props {
  filters: PlanejamentoGlobalFilters;
  onFiltersChange: (filters: PlanejamentoGlobalFilters) => void;
}

export function PlanejamentoListaGlobal({ filters, onFiltersChange }: Props) {
  const [localEmpreendimentoId, setLocalEmpreendimentoId] = useState<string | undefined>(undefined);
  const [busca, setBusca] = useState('');
  const localFilters = { ...filters, empreendimento_id: localEmpreendimentoId };
  const { itens, isLoading } = usePlanejamentoGlobal(localFilters);
  const { updateItem, deleteItem, duplicateItem, createItem } = usePlanejamentoItens();
  const { statusList } = usePlanejamentoStatus();
  const { fases } = usePlanejamentoFases(localEmpreendimentoId);
  const { data: funcionarios } = useFuncionariosSeven();
  const { data: empreendimentos } = useEmpreendimentosSelect();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [converterItem, setConverterItem] = useState<PlanejamentoItemWithRelations | null>(null);
  const [newItemGroupId, setNewItemGroupId] = useState<string | null>(null);
  const [newItemValue, setNewItemValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItens = useMemo(() => {
    if (!itens) return [];
    if (!busca.trim()) return itens;
    const lower = busca.toLowerCase();
    return itens.filter(i => i.item.toLowerCase().includes(lower));
  }, [itens, busca]);

  // Group by empreendimento (global) or by fase (specific empreendimento)
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; color?: string; items: PlanejamentoItemWithRelations[] }>();
    
    if (localEmpreendimentoId) {
      // Group by fase
      filteredItens.forEach(item => {
        const key = item.fase_id || 'sem-fase';
        const label = item.fase?.nome || 'Sem fase';
        const color = item.fase?.cor;
        if (!map.has(key)) map.set(key, { label, color, items: [] });
        map.get(key)!.items.push(item);
      });
    } else {
      // Group by empreendimento — assign colors from shared palette
      const allEmpIds = [...new Set(filteredItens.map(i => i.empreendimento?.id).filter(Boolean))] as string[];
      filteredItens.forEach(item => {
        const key = item.empreendimento?.id || 'sem-empreendimento';
        const label = item.empreendimento?.nome || 'Sem empreendimento';
        const color = key !== 'sem-empreendimento' ? getEmpreendimentoColor(key, allEmpIds) : '#94a3b8';
        if (!map.has(key)) map.set(key, { label, color, items: [] });
        map.get(key)!.items.push(item);
      });
    }
    return map;
  }, [filteredItens, localEmpreendimentoId]);

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCellClick = (id: string, field: string, value: string | null) => {
    setEditingCell({ id, field });
    setEditValue(value || '');
  };

  const handleSave = useCallback(() => {
    if (!editingCell) return;
    updateItem.mutate({ id: editingCell.id, [editingCell.field]: editValue || null });
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, updateItem]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    else if (e.key === 'Escape') { setEditingCell(null); setEditValue(''); }
  };

  const handleSelectChange = (id: string, field: string, value: string) => {
    updateItem.mutate({ id, [field]: value });
  };

  const handleDateChange = (id: string, field: string, date: Date | undefined) => {
    const item = filteredItens.find(i => i.id === id);
    if (!item) return;
    const newDateStr = date ? format(date, 'yyyy-MM-dd') : null;
    const dataInicio = field === 'data_inicio' ? newDateStr : item.data_inicio;
    const dataFim = field === 'data_fim' ? newDateStr : item.data_fim;
    if (dataInicio && dataFim && dataFim < dataInicio) {
      toast.error('A data de fim deve ser igual ou posterior à data de início');
      return;
    }
    updateItem.mutate({ id, [field]: newDateStr });
  };

  const handleCreateItem = (groupId: string) => {
    if (!newItemValue.trim()) return;
    const defaultStatus = statusList?.find(s => s.ordem === 1);
    if (!defaultStatus) return;

    let empreendimentoId = localEmpreendimentoId || groupId;
    let faseId = localEmpreendimentoId ? groupId : fases?.[0]?.id;
    
    if (!faseId) {
      toast.error('Nenhuma fase disponível');
      return;
    }

    createItem.mutate({
      empreendimento_id: empreendimentoId,
      fase_id: faseId,
      status_id: defaultStatus.id,
      item: newItemValue.trim(),
    });
    setNewItemValue('');
    setNewItemGroupId(null);
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  if (isLoading) return <Skeleton className="h-[600px]" />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={localEmpreendimentoId || 'all'}
              onValueChange={(v) => setLocalEmpreendimentoId(v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[220px]">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Todos os empreendimentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os empreendimentos</SelectItem>
                {empreendimentos?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="text-sm text-muted-foreground ml-auto">
              {filteredItens.length} tarefa{filteredItens.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={filteredItens.length > 0 && selectedIds.size === filteredItens.length}
                  onCheckedChange={() => {
                    if (selectedIds.size === filteredItens.length) setSelectedIds(new Set());
                    else setSelectedIds(new Set(filteredItens.map(i => i.id)));
                  }}
                />
              </TableHead>
              <TableHead className="w-[280px]">Item/Tarefa</TableHead>
              {!localEmpreendimentoId && <TableHead className="w-[140px]">Fase</TableHead>}
              <TableHead className="w-[160px]">Responsáveis</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[100px]">Início</TableHead>
              <TableHead className="w-[100px]">Fim</TableHead>
              <TableHead className="w-[50px]">Obs</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.size === 0 && (
              <TableRow>
                <TableCell colSpan={localEmpreendimentoId ? 8 : 9} className="text-center py-12 text-muted-foreground">
                  Nenhuma tarefa encontrada
                </TableCell>
              </TableRow>
            )}
            {Array.from(grouped.entries()).map(([groupId, group]) => {
              const isCollapsed = collapsedGroups.has(groupId);
              return (
                <Fragment key={groupId}>
                  {/* Group header row */}
                  <TableRow
                    className="bg-muted/30 hover:bg-muted/40 cursor-pointer"
                    onClick={() => toggleGroup(groupId)}
                  >
                    <TableCell className="py-2" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={group.items.length > 0 && group.items.every(i => selectedIds.has(i.id))}
                        onCheckedChange={() => {
                          const allSel = group.items.every(i => selectedIds.has(i.id));
                          setSelectedIds(prev => {
                            const next = new Set(prev);
                            group.items.forEach(i => allSel ? next.delete(i.id) : next.add(i.id));
                            return next;
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell colSpan={localEmpreendimentoId ? 7 : 8} className="py-2">
                      <div className="flex items-center gap-2 font-medium">
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {group.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />}
                        <span>{group.label}</span>
                        <Badge variant="secondary" className="ml-2">{group.items.length}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-2"></TableCell>
                  </TableRow>

                  {/* Items */}
                  {!isCollapsed && (
                    <>
                      {group.items.map(item => (
                        <ListaItemRow
                          key={item.id}
                          item={item}
                          statusList={statusList || []}
                          fases={fases || []}
                          funcionarios={funcionarios || []}
                          editingCell={editingCell}
                          editValue={editValue}
                          inputRef={inputRef}
                          isSelected={selectedIds.has(item.id)}
                          showFaseColumn={!localEmpreendimentoId}
                          onToggleSelect={() => toggleSelectItem(item.id)}
                          onCellClick={handleCellClick}
                          onEditValueChange={setEditValue}
                          onKeyDown={handleKeyDown}
                          onBlur={handleSave}
                          onSelectChange={handleSelectChange}
                          onDateChange={handleDateChange}
                          onDelete={() => deleteItem.mutate(item.id)}
                          onDuplicate={() => duplicateItem.mutate(item.id)}
                          onConvert={() => setConverterItem(item)}
                        />
                      ))}
                      {/* Add task row */}
                      <TableRow className="hover:bg-muted/20">
                        <TableCell className="py-1"></TableCell>
                        <TableCell className="py-1" colSpan={localEmpreendimentoId ? 7 : 8}>
                          {newItemGroupId === groupId ? (
                            <Input
                              value={newItemValue}
                              onChange={(e) => setNewItemValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateItem(groupId);
                                else if (e.key === 'Escape') { setNewItemGroupId(null); setNewItemValue(''); }
                              }}
                              onBlur={() => {
                                if (newItemValue.trim()) handleCreateItem(groupId);
                                else setNewItemGroupId(null);
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
                              onClick={() => setNewItemGroupId(groupId)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar tarefa
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="py-1"></TableCell>
                      </TableRow>
                    </>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Floating selection bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selectedIds.size} item(ns) selecionado(s)</span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              selectedIds.forEach(id => deleteItem.mutate(id));
              setSelectedIds(new Set());
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Converter dialog */}
      {converterItem && (
        <ConverterTarefaDialog
          open={!!converterItem}
          onOpenChange={(open) => { if (!open) setConverterItem(null); }}
          item={converterItem}
          empreendimentoId={converterItem.empreendimento_id}
        />
      )}
    </div>
  );
}

// Individual row component
interface ListaItemRowProps {
  item: PlanejamentoItemWithRelations;
  statusList: { id: string; nome: string; cor: string }[];
  fases: { id: string; nome: string; cor: string }[];
  funcionarios: { id: string; full_name: string }[];
  editingCell: { id: string; field: string } | null;
  editValue: string;
  inputRef: React.RefObject<HTMLInputElement>;
  isSelected: boolean;
  showFaseColumn: boolean;
  onToggleSelect: () => void;
  onCellClick: (id: string, field: string, value: string | null) => void;
  onEditValueChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  onSelectChange: (id: string, field: string, value: string) => void;
  onDateChange: (id: string, field: string, date: Date | undefined) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onConvert: () => void;
}

function ListaItemRow({
  item, statusList, fases, funcionarios, editingCell, editValue, inputRef,
  isSelected, showFaseColumn, onToggleSelect, onCellClick, onEditValueChange,
  onKeyDown, onBlur, onSelectChange, onDateChange, onDelete, onDuplicate, onConvert,
}: ListaItemRowProps) {
  const isEditingItem = editingCell?.id === item.id && editingCell?.field === 'item';
  const [obsOpen, setObsOpen] = useState(false);
  const [localObs, setLocalObs] = useState(item.obs || '');

  useEffect(() => {
    if (!obsOpen) setLocalObs(item.obs || '');
  }, [item.obs, obsOpen]);

  return (
    <TableRow className={cn("hover:bg-muted/20", isSelected && "bg-primary/5")}>
      <TableCell className="py-1">
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
      </TableCell>

      {/* Item name */}
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
            className="px-2 py-1 rounded cursor-pointer min-h-[32px] flex items-center hover:bg-muted/50"
            onClick={() => onCellClick(item.id, 'item', item.item)}
          >
            {item.item}
          </div>
        )}
      </TableCell>

      {/* Fase column (only in global view) */}
      {showFaseColumn && (
        <TableCell className="py-1">
          <Badge variant="outline" className="text-xs" style={{ borderColor: item.fase?.cor, color: item.fase?.cor }}>
            {item.fase?.nome || 'Sem fase'}
          </Badge>
        </TableCell>
      )}

      {/* Responsáveis */}
      <TableCell className="py-1">
        <ResponsaveisEditor itemId={item.id} funcionarios={funcionarios} readOnly={false} />
      </TableCell>

      {/* Status */}
      <TableCell className="py-1">
        <Select value={item.status_id} onValueChange={(v) => onSelectChange(item.id, 'status_id', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusList.map(s => (
              <SelectItem key={s.id} value={s.id}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.cor }} />
                  {s.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Data Início */}
      <TableCell className="py-1">
        <InlineDatePicker
          value={item.data_inicio}
          onChange={(d) => onDateChange(item.id, 'data_inicio', d)}
          maxDate={item.data_fim ? parseISO(item.data_fim) : undefined}
        />
      </TableCell>

      {/* Data Fim */}
      <TableCell className="py-1">
        <InlineDatePicker
          value={item.data_fim}
          onChange={(d) => onDateChange(item.id, 'data_fim', d)}
          minDate={item.data_inicio ? parseISO(item.data_inicio) : undefined}
        />
      </TableCell>

      {/* Obs */}
      <TableCell className="py-1">
        <Popover
          open={obsOpen}
          onOpenChange={(open) => {
            if (!open && localObs !== (item.obs || '')) onSelectChange(item.id, 'obs', localObs);
            setObsOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className={cn("h-8 w-8", item.obs && "text-primary")}>
              <MessageSquare className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-2">
              <p className="text-sm font-medium">Observações</p>
              <Textarea value={localObs} onChange={(e) => setLocalObs(e.target.value)} placeholder="Digite observações..." rows={4} />
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onConvert}>
              <Zap className="h-4 w-4 mr-2" />
              Converter em Atividade/Marketing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function InlineDatePicker({ value, onChange, minDate, maxDate }: {
  value: string | null;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? parseISO(value) : undefined;

  const isDateDisabled = (day: Date) => {
    const d = startOfDay(day);
    if (minDate && isBefore(d, startOfDay(minDate))) return true;
    if (maxDate && isAfter(d, startOfDay(maxDate))) return true;
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={cn("h-8 w-full justify-start text-left font-normal px-2", !date && "text-muted-foreground")}>
          {date ? format(date, 'dd/MM/yy') : '-'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => { onChange(d); setOpen(false); }}
          disabled={isDateDisabled}
          locale={ptBR}
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
