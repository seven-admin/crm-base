import { useMemo, useState } from 'react';
import { format, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Check, ExternalLink, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Ticket } from '@/types/marketing.types';
import { CATEGORIA_LABELS, PRIORIDADE_LABELS, PRIORIDADE_COLORS } from '@/types/marketing.types';
import type { TicketEtapa } from '@/hooks/useTicketEtapas';

interface TicketsListaTabProps {
  tickets: Ticket[];
  etapas: TicketEtapa[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onAlterarEtapa: (ticketId: string, novaEtapaId: string) => void;
  superAdminIds?: Set<string>;
}

// Helper para verificar se ticket está atrasado
function isTicketOverdue(ticket: Ticket, etapasFinaisIds: Set<string>): boolean {
  if (!ticket.data_previsao) return false;
  if (['concluido', 'arquivado'].includes(ticket.status)) return false;
  if (ticket.ticket_etapa_id && etapasFinaisIds.has(ticket.ticket_etapa_id)) return false;
  return isBefore(new Date(ticket.data_previsao), startOfDay(new Date()));
}

// Helper para cor de fundo baseado na cor hex
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TicketsListaTab({
  tickets,
  etapas,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onAlterarEtapa,
  superAdminIds,
}: TicketsListaTabProps) {
  const navigate = useNavigate();
  
  // Set de etapas finais
  const etapasFinaisIds = useMemo(() => 
    new Set(etapas.filter(e => e.is_final).map(e => e.id)),
    [etapas]
  );
  
  // Mapa de etapas para lookup rápido
  const etapasMap = useMemo(() => 
    new Map(etapas.map(e => [e.id, e])),
    [etapas]
  );
  
  // Ordenar tickets: atrasados primeiro, depois por data de previsão
  const ticketsOrdenados = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const aAtrasado = isTicketOverdue(a, etapasFinaisIds);
      const bAtrasado = isTicketOverdue(b, etapasFinaisIds);
      
      // Atrasados primeiro
      if (aAtrasado && !bAtrasado) return -1;
      if (!aAtrasado && bAtrasado) return 1;
      
      // Depois por data de previsão (mais próxima primeiro)
      if (a.data_previsao && b.data_previsao) {
        return new Date(a.data_previsao).getTime() - new Date(b.data_previsao).getTime();
      }
      if (a.data_previsao) return -1;
      if (b.data_previsao) return 1;
      
      return 0;
    });
  }, [tickets, etapasFinaisIds]);

  const allSelected = tickets.length > 0 && selectedIds.size === tickets.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Check className="h-12 w-12 mb-4 opacity-50" />
        <p>Nenhum ticket encontrado</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead className="w-24">Código</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="w-32">Categoria</TableHead>
            <TableHead className="w-40">Etapa</TableHead>
            <TableHead className="w-28">Previsão</TableHead>
            <TableHead className="w-32">Prioridade</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ticketsOrdenados.map((ticket) => {
            const isSelected = selectedIds.has(ticket.id);
            const atrasado = isTicketOverdue(ticket, etapasFinaisIds);
            const etapaAtual = ticket.ticket_etapa_id ? etapasMap.get(ticket.ticket_etapa_id) : null;
            const isSuperAdmin = superAdminIds?.has(ticket.created_by || '');
            
            return (
              <TableRow
                key={ticket.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  isSuperAdmin && 'bg-amber-50 dark:bg-amber-950/30 border-l-4 border-l-amber-400',
                  atrasado && !isSuperAdmin && 'bg-destructive/5 hover:bg-destructive/10',
                  isSelected && 'bg-primary/5'
                )}
                onClick={(e) => {
                  // Não navegar se clicou em checkbox ou select
                  if ((e.target as HTMLElement).closest('[role="checkbox"], [role="combobox"], button')) return;
                  navigate(`/marketing/${ticket.id}`);
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(ticket.id)}
                    aria-label={`Selecionar ${ticket.codigo}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {ticket.codigo}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {atrasado && (
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <span className="truncate max-w-xs">{ticket.titulo}</span>
                    {isSuperAdmin && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>Criada por Super Admin</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {ticket.is_interno && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Interno
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {CATEGORIA_LABELS[ticket.categoria]}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={ticket.ticket_etapa_id || ''}
                    onValueChange={(value) => onAlterarEtapa(ticket.id, value)}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder="Sem etapa">
                        {etapaAtual && (
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: etapaAtual.cor || '#6b7280' }}
                            />
                            <span className="truncate">{etapaAtual.nome}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {etapas.map((etapa) => (
                        <SelectItem key={etapa.id} value={etapa.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: etapa.cor || '#6b7280' }}
                            />
                            {etapa.nome}
                            {etapa.is_final && (
                              <Check className="h-3 w-3 text-green-600 ml-1" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {ticket.data_previsao ? (
                    <span className={cn(
                      'text-xs',
                      atrasado && 'text-destructive font-medium'
                    )}>
                      {format(new Date(ticket.data_previsao), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className="text-xs"
                    style={{
                      backgroundColor: hexToRgba(PRIORIDADE_COLORS[ticket.prioridade] || '#6b7280', 0.15),
                      color: PRIORIDADE_COLORS[ticket.prioridade] || '#374151',
                    }}
                  >
                    {PRIORIDADE_LABELS[ticket.prioridade]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/marketing/${ticket.id}`);
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
