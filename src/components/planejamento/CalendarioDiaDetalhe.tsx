import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarDays,
  Pencil,
  Check,
  X,
  MoreHorizontal,
  Copy,
  Trash2,
  Plus,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  PlanejamentoItemWithRelations,
  PlanejamentoFase,
  PlanejamentoStatus,
} from '@/types/planejamento.types';
import { ConverterTarefaDialog } from './ConverterTarefaDialog';
import { getEmpreendimentoColor } from '@/utils/empreendimentoColors';

interface Props {
  selectedDate: Date;
  items: PlanejamentoItemWithRelations[];
  fases: PlanejamentoFase[];
  statusList: PlanejamentoStatus[];
  responsaveis: { id: string; full_name: string }[];
  readOnly?: boolean;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddClick: () => void;
}

function EditableItemCard({
  item,
  fases,
  statusList,
  responsaveis,
  readOnly,
  onUpdate,
  onDelete,
  onDuplicate,
  onConvert,
}: {
  item: PlanejamentoItemWithRelations;
  fases: PlanejamentoFase[];
  statusList: PlanejamentoStatus[];
  responsaveis: { id: string; full_name: string }[];
  readOnly?: boolean;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onConvert: (item: PlanejamentoItemWithRelations) => void;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [datePickerField, setDatePickerField] = useState<string | null>(null);

  const faseColor = item.fase?.cor || '#6b7280';
  const isAtrasada =
    !item.status?.is_final && item.data_fim && parseISO(item.data_fim) < new Date();

  const startEditName = () => {
    if (readOnly) return;
    setEditingField('item');
    setEditValue(item.item);
  };

  const saveEdit = () => {
    if (editValue.trim() && editValue.trim() !== item.item) {
      onUpdate(item.id, { item: editValue.trim() });
    }
    setEditingField(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    if (!date) return;
    onUpdate(item.id, { [field]: format(date, 'yyyy-MM-dd') });
    setDatePickerField(null);
  };

  const sortedFases = [...fases].sort((a, b) => a.nome.localeCompare(b.nome));
  const sortedStatus = [...statusList].sort((a, b) => a.nome.localeCompare(b.nome));
  const sortedResponsaveis = [...responsaveis].sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div
      className="p-3 rounded-lg border bg-card transition-colors hover:bg-muted/30 group"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: faseColor,
      }}
    >
      {/* Name */}
      <div className="flex items-start justify-between gap-2">
        {editingField === 'item' ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="text-sm h-7"
            />
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveEdit}>
              <Check className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEdit}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <p
            className={cn(
              'font-medium text-sm flex-1',
              !readOnly && 'cursor-pointer hover:text-primary transition-colors'
            )}
            onClick={startEditName}
            title={!readOnly ? 'Clique para editar' : undefined}
          >
            {item.item}
            {!readOnly && (
              <Pencil className="h-3 w-3 inline ml-1.5 opacity-0 group-hover:opacity-50 transition-opacity" />
            )}
          </p>
        )}

        {!readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(item.id)}>
                <Copy className="h-3.5 w-3.5 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onConvert(item)}>
                <Zap className="h-3.5 w-3.5 mr-2" />
                Converter em Atividade
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(item.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Dates */}
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        {readOnly ? (
          <span>
            {item.data_inicio && format(parseISO(item.data_inicio), 'dd/MM')}
            {' - '}
            {item.data_fim && format(parseISO(item.data_fim), 'dd/MM')}
          </span>
        ) : (
          <>
            <Popover
              open={datePickerField === 'data_inicio'}
              onOpenChange={(o) => setDatePickerField(o ? 'data_inicio' : null)}
            >
              <PopoverTrigger asChild>
                <button className="hover:text-primary transition-colors underline-offset-2 hover:underline">
                  {item.data_inicio ? format(parseISO(item.data_inicio), 'dd/MM') : '—'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={item.data_inicio ? parseISO(item.data_inicio) : undefined}
                  onSelect={(d) => handleDateChange('data_inicio', d)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span>-</span>
            <Popover
              open={datePickerField === 'data_fim'}
              onOpenChange={(o) => setDatePickerField(o ? 'data_fim' : null)}
            >
              <PopoverTrigger asChild>
                <button className="hover:text-primary transition-colors underline-offset-2 hover:underline">
                  {item.data_fim ? format(parseISO(item.data_fim), 'dd/MM') : '—'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={item.data_fim ? parseISO(item.data_fim) : undefined}
                  onSelect={(d) => handleDateChange('data_fim', d)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      {/* Phase & Status */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {readOnly ? (
          <>
            {item.fase && (
              <Badge variant="outline" className="text-xs" style={{ borderColor: faseColor, color: faseColor }}>
                {item.fase.nome}
              </Badge>
            )}
            {item.status && (
              <Badge variant="secondary" className="text-xs">
                {item.status.nome}
              </Badge>
            )}
          </>
        ) : (
          <>
            <Select
              value={item.fase_id}
              onValueChange={(v) => onUpdate(item.id, { fase_id: v })}
            >
              <SelectTrigger className="h-6 text-xs w-auto min-w-0 border-0 p-0 px-1.5 gap-1 bg-transparent hover:bg-muted/50 transition-colors rounded">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: faseColor }}
                  />
                  <span style={{ color: faseColor }}>{item.fase?.nome || 'Fase'}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {sortedFases.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: f.cor }} />
                      {f.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={item.status_id}
              onValueChange={(v) => onUpdate(item.id, { status_id: v })}
            >
              <SelectTrigger className="h-6 text-xs w-auto min-w-0 border-0 p-0 px-1.5 gap-1 bg-muted/50 hover:bg-muted transition-colors rounded">
                <span>{item.status?.nome || 'Status'}</span>
              </SelectTrigger>
              <SelectContent>
                {sortedStatus.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.cor }} />
                      {s.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {isAtrasada && (
          <Badge variant="destructive" className="text-xs">
            Atrasada
          </Badge>
        )}
      </div>

      {/* Responsavel */}
      {!readOnly ? (
        <div className="mt-2">
          <Select
            value={item.responsavel_tecnico_id || ''}
            onValueChange={(v) => onUpdate(item.id, { responsavel_tecnico_id: v || null })}
          >
            <SelectTrigger className="h-6 text-xs w-auto min-w-0 border-0 p-0 px-1.5 gap-1 bg-transparent hover:bg-muted/50 transition-colors rounded text-muted-foreground">
              <span>{item.responsavel?.full_name || 'Sem responsável'}</span>
            </SelectTrigger>
            <SelectContent>
              {sortedResponsaveis.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        item.responsavel && (
          <p className="mt-2 text-xs text-muted-foreground">{item.responsavel.full_name}</p>
        )
      )}
    </div>
  );
}

export function CalendarioDiaDetalhe({
  selectedDate,
  items,
  fases,
  statusList,
  responsaveis,
  readOnly,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddClick,
}: Props) {
  const [converterItem, setConverterItem] = useState<PlanejamentoItemWithRelations | null>(null);
  const [collapsedEmpreendimentos, setCollapsedEmpreendimentos] = useState<Set<string>>(new Set());

  const groupedItems = useMemo(() => {
    const grouped = new Map<string, { nome: string; cor: string; items: PlanejamentoItemWithRelations[] }>();
    const empIds = [...new Set(items.map((item) => item.empreendimento?.id).filter(Boolean))] as string[];

    items.forEach((item) => {
      const empId = item.empreendimento?.id || 'sem-empreendimento';
      const empNome = item.empreendimento?.nome || 'Sem empreendimento';
      const cor = empId !== 'sem-empreendimento'
        ? getEmpreendimentoColor(empId, empIds)
        : 'hsl(var(--muted-foreground))';

      if (!grouped.has(empId)) {
        grouped.set(empId, { nome: empNome, cor, items: [] });
      }
      grouped.get(empId)!.items.push(item);
    });

    return Array.from(grouped.entries());
  }, [items]);

  const toggleEmpreendimento = (empId: string) => {
    setCollapsedEmpreendimentos((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </CardTitle>
            {!readOnly && (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onAddClick}>
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {items.length} tarefa{items.length !== 1 ? 's' : ''} ativa{items.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent className="pt-0 flex-1 overflow-hidden">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma tarefa neste dia</p>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs gap-1"
                  onClick={onAddClick}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Criar tarefa
                </Button>
              )}
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto pr-2">
              <div className="space-y-4">
                {groupedItems.map(([empId, group]) => {
                  const isCollapsed = collapsedEmpreendimentos.has(empId);

                  return (
                    <div key={empId} className="rounded-lg border border-border/60">
                      <button
                        type="button"
                        onClick={() => toggleEmpreendimento(empId)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: group.cor }} />
                          <span className="text-xs font-semibold text-foreground uppercase tracking-wide truncate">
                            {group.nome}
                          </span>
                          <Badge variant="secondary" className="text-xs h-5">
                            {group.items.length}
                          </Badge>
                        </div>
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {!isCollapsed && (
                        <div className="space-y-3 p-3 pt-0 border-t border-border/50">
                          {group.items.map((item) => (
                            <EditableItemCard
                              key={item.id}
                              item={item}
                              fases={fases}
                              statusList={statusList}
                              responsaveis={responsaveis}
                              readOnly={readOnly}
                              onUpdate={onUpdate}
                              onDelete={onDelete}
                              onDuplicate={onDuplicate}
                              onConvert={setConverterItem}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Converter dialog */}
      {converterItem && (
        <ConverterTarefaDialog
          open={!!converterItem}
          onOpenChange={(open) => { if (!open) setConverterItem(null); }}
          item={converterItem}
          empreendimentoId={converterItem.empreendimento_id}
        />
      )}
    </>
  );
}
