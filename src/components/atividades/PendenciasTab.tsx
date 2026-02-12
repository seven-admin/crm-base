import { useMemo } from 'react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, Users, MapPin, Headphones, CheckCircle, AlertTriangle, Video, Handshake, PenTool, PackageCheck, GraduationCap, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Atividade, AtividadeTipo } from '@/types/atividades.types';
import { ATIVIDADE_TIPO_LABELS } from '@/types/atividades.types';

const TIPO_ICONS: Record<AtividadeTipo, typeof Phone> = {
  ligacao: Phone,
  meeting: Video,
  reuniao: Users,
  visita: MapPin,
  atendimento: Headphones,
  fechamento: Handshake,
  assinatura: PenTool,
  acompanhamento: PackageCheck,
  treinamento: GraduationCap,
  administrativa: Briefcase,
};

interface PendenciasTabProps {
  atividades: Atividade[];
  isLoading: boolean;
  onAtividadeClick: (id: string) => void;
  onConcluir: (atividade: Atividade) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

export function PendenciasTab({ 
  atividades, 
  isLoading, 
  onAtividadeClick, 
  onConcluir,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll
}: PendenciasTabProps) {
  const atividadesOrdenadas = useMemo(() => {
    return [...atividades].sort((a, b) => {
      const dateA = new Date(a.data_fim).getTime();
      const dateB = new Date(b.data_fim).getTime();
      return dateA - dateB;
    });
  }, [atividades]);

  const handleConcluirClick = (e: React.MouseEvent, atividade: Atividade) => {
    e.stopPropagation();
    onConcluir(atividade);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (atividades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-primary mb-4" />
        <h3 className="text-lg font-medium text-foreground">Tudo em dia!</h3>
        <p className="text-muted-foreground mt-1">
          Não há atividades vencidas ou atrasadas no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="flex items-center justify-between gap-2 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">
            {atividades.length} pendência{atividades.length !== 1 ? 's' : ''}
          </span>
        </div>
        {selectedIds.size > 0 && (
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selecionada{selectedIds.size !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-2">
        {atividadesOrdenadas.map((atividade) => {
          const TipoIcon = TIPO_ICONS[atividade.tipo];
          const dataFim = new Date(`${atividade.data_fim}T00:00:00`);
          const diasVencida = differenceInDays(new Date(), dataFim);
          const tempoVencida = formatDistanceToNow(dataFim, { addSuffix: true, locale: ptBR });

          return (
            <div
              key={atividade.id}
              className={cn(
                'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/30',
                selectedIds.has(atividade.id) && 'bg-primary/5 border-primary/30',
                !selectedIds.has(atividade.id) && diasVencida > 7 && 'bg-destructive/10 border-destructive/30',
                !selectedIds.has(atividade.id) && diasVencida > 3 && diasVencida <= 7 && 'bg-destructive/5 border-destructive/20',
                !selectedIds.has(atividade.id) && diasVencida <= 3 && 'bg-warning/5 border-warning/20'
              )}
              onClick={() => onAtividadeClick(atividade.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.has(atividade.id)}
                  onCheckedChange={() => onToggleSelect(atividade.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge variant="outline" className="text-xs gap-1">
                      <TipoIcon className="h-3 w-3" />
                      {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      {tempoVencida}
                    </Badge>
                  </div>
                  <h4 className="font-normal text-sm truncate">{atividade.titulo}</h4>
                  {atividade.cliente?.nome && (
                    <p className="text-xs text-muted-foreground truncate">{atividade.cliente.nome}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0"
                  onClick={(e) => handleConcluirClick(e, atividade)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={atividades.length > 0 && selectedIds.size === atividades.length}
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Selecionar todas"
                />
              </TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Corretor</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Vencida há</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {atividadesOrdenadas.map((atividade) => {
              const TipoIcon = TIPO_ICONS[atividade.tipo];
              const dataFim = new Date(`${atividade.data_fim}T00:00:00`);
              const diasVencida = differenceInDays(new Date(), dataFim);
              const tempoVencida = formatDistanceToNow(dataFim, { addSuffix: true, locale: ptBR });

              return (
                <TableRow
                  key={atividade.id}
                  className={cn(
                    'cursor-pointer',
                    selectedIds.has(atividade.id) && 'bg-primary/5 hover:bg-primary/10',
                    !selectedIds.has(atividade.id) && diasVencida > 7 && 'bg-destructive/10 hover:bg-destructive/15',
                    !selectedIds.has(atividade.id) && diasVencida > 3 && diasVencida <= 7 && 'bg-destructive/5 hover:bg-destructive/10',
                    !selectedIds.has(atividade.id) && diasVencida <= 3 && 'bg-warning/5 hover:bg-warning/10'
                  )}
                  onClick={() => onAtividadeClick(atividade.id)}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(atividade.id)}
                      onCheckedChange={() => onToggleSelect(atividade.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <TipoIcon className="h-3 w-3" />
                      {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {atividade.titulo}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {atividade.cliente?.nome || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {atividade.corretor?.nome_completo || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {atividade.gestor?.full_name || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="text-xs">
                      {tempoVencida}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleConcluirClick(e, atividade)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
