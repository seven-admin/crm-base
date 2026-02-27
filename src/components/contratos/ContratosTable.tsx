import { format, isPast, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, FileText, Send, CheckCircle, Building2, Trash2 } from 'lucide-react';
import type { Contrato, ContratoStatus, CONTRATO_STATUS_LABELS, CONTRATO_STATUS_COLORS } from '@/types/contratos.types';

const STATUS_LABELS: Record<ContratoStatus, string> = {
  em_geracao: 'Em Geração',
  enviado_assinatura: 'Enviado p/ Assinatura',
  assinado: 'Assinado',
  enviado_incorporador: 'Enviado ao Incorporador',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  cancelado: 'Cancelado'
};

const STATUS_COLORS: Record<ContratoStatus, string> = {
  em_geracao: 'bg-gray-500',
  enviado_assinatura: 'bg-blue-600',
  assinado: 'bg-emerald-500',
  enviado_incorporador: 'bg-amber-500',
  aprovado: 'bg-green-700',
  reprovado: 'bg-red-600',
  cancelado: 'bg-slate-600'
};

interface ContratosTableProps {
  contratos: Contrato[];
  isLoading: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onUpdateStatus?: (id: string, status: ContratoStatus, motivo?: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function ContratosTable({
  contratos,
  isLoading,
  onView,
  onEdit,
  onUpdateStatus,
  onDelete,
  canDelete = false,
}: ContratosTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (contratos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <FileText className="h-12 w-12 mb-2 opacity-50" />
        <p>Nenhum contrato encontrado</p>
      </div>
    );
  }

  const renderActions = (contrato: Contrato) => {
    const isStatusAtivo = ['em_geracao', 'enviado_assinatura', 'assinado', 'enviado_incorporador'].includes(contrato.status);
    
    // Se não tem ações de status E não pode excluir, não mostra menu
    if (!isStatusAtivo && !canDelete) {
      return null;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Ações de transição - só para status ativos */}
          {contrato.status === 'em_geracao' && (
            <>
              <DropdownMenuItem onClick={() => onEdit?.(contrato.id)}>
                <FileText className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus?.(contrato.id, 'enviado_assinatura')}>
                <Send className="mr-2 h-4 w-4" />
                Enviar p/ Assinatura
              </DropdownMenuItem>
            </>
          )}
          
          {contrato.status === 'enviado_assinatura' && (
            <DropdownMenuItem onClick={() => onUpdateStatus?.(contrato.id, 'assinado')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar como Assinado
            </DropdownMenuItem>
          )}
          
          {contrato.status === 'assinado' && (
            <DropdownMenuItem onClick={() => onUpdateStatus?.(contrato.id, 'enviado_incorporador')}>
              <Building2 className="mr-2 h-4 w-4" />
              Enviar ao Incorporador
            </DropdownMenuItem>
          )}
          
          {contrato.status === 'enviado_incorporador' && (
            <>
              <DropdownMenuItem onClick={() => onUpdateStatus?.(contrato.id, 'aprovado')}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Aprovar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus?.(contrato.id, 'reprovado')}>
                <CheckCircle className="mr-2 h-4 w-4 text-red-600" />
                Reprovar
              </DropdownMenuItem>
            </>
          )}
          
          {isStatusAtivo && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onUpdateStatus?.(contrato.id, 'cancelado')}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Cancelar Contrato
              </DropdownMenuItem>
            </>
          )}
          
          {/* Exclusão permanente - SEMPRE visível para super admin */}
          {canDelete && (
            <>
              {isStatusAtivo && <DropdownMenuSeparator />}
              <DropdownMenuItem 
                onClick={() => onDelete?.(contrato.id)}
                className="text-destructive font-medium"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Permanentemente
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {contratos.map((contrato) => {
          const unidadesList = contrato.unidades?.map(u => u.unidade?.numero).filter(Boolean) || [];
          const unidades = unidadesList.length <= 5 ? unidadesList.join(', ') : `${unidadesList.slice(0, 5).join(', ')} +${unidadesList.length - 5}`;
          
          return (
            <Card
              key={contrato.id} 
              className="p-4 cursor-pointer hover:bg-muted/50"
              onClick={() => onView?.(contrato.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{contrato.numero}</span>
                    <Badge className={`${STATUS_COLORS[contrato.status]} text-white`}>
                      {STATUS_LABELS[contrato.status]}
                    </Badge>
                  </div>
                  <p className="text-sm">{contrato.cliente?.nome || '-'}</p>
                  <p className="text-sm text-muted-foreground">{contrato.empreendimento?.nome || '-'}</p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  {renderActions(contrato)}
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t text-sm">
                <span className="text-muted-foreground">Unid: {unidades}</span>
                <span className="font-medium">{formatCurrency(contrato.valor_contrato)}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Empreendimento</TableHead>
              <TableHead className="hidden lg:table-cell">Unidade(s)</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Data</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contratos.map((contrato) => {
              const unidadesList = contrato.unidades?.map(u => u.unidade?.numero).filter(Boolean) || [];
              const unidades = unidadesList.length <= 5 ? unidadesList.join(', ') : `${unidadesList.slice(0, 5).join(', ')} +${unidadesList.length - 5}`;
              
              return (
                <TableRow 
                  key={contrato.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onView?.(contrato.id)}
                >
                  <TableCell className="font-medium">{contrato.numero}</TableCell>
                  <TableCell>{contrato.cliente?.nome || '-'}</TableCell>
                  <TableCell>{contrato.empreendimento?.nome || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[200px] truncate" title={unidadesList.join(', ')}>{unidades}</TableCell>
                  <TableCell>{formatCurrency(contrato.valor_contrato)}</TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_COLORS[contrato.status]} text-white`}>
                      {STATUS_LABELS[contrato.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {format(new Date(contrato.data_geracao), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {renderActions(contrato)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
