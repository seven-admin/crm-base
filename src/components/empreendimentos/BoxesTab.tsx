import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Loader2, Plus, Trash2, Car, Link2, Link2Off, X } from 'lucide-react';
import { useBoxes, useDeleteBox, useVincularBoxUnidade, useDeleteBoxesBatch, useVincularBoxesBatch } from '@/hooks/useBoxes';
import { useBlocos } from '@/hooks/useBlocos';
import { useUnidades } from '@/hooks/useUnidades';
import { BoxBulkForm } from './BoxBulkForm';
import { BOX_STATUS_LABELS, BOX_TIPO_LABELS, BoxStatus } from '@/types/empreendimentos.types';
import { cn } from '@/lib/utils';

interface BoxesTabProps {
  empreendimentoId: string;
}

const STATUS_COLORS: Record<BoxStatus, string> = {
  disponivel: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  reservado: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  vendido: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function BoxesTab({ empreendimentoId }: BoxesTabProps) {
  const [blocoFilter, setBlocoFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [vincularOpen, setVincularOpen] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string>('');
  
  // Estado para seleção em lote
  const [selectionMode, setSelectionMode] = useState<'excluir' | 'vincular' | false>(false);
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<string>>(new Set());
  
  // Dialog vincular em lote
  const [vincularLoteOpen, setVincularLoteOpen] = useState(false);
  const [vincularLoteUnidadeId, setVincularLoteUnidadeId] = useState<string>('');

  const { data: boxes = [], isLoading } = useBoxes(empreendimentoId, {
    blocoId: blocoFilter !== 'all' ? blocoFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const { data: blocos = [] } = useBlocos(empreendimentoId);
  const { data: unidades = [] } = useUnidades(empreendimentoId);
  const deleteBox = useDeleteBox();
  const deleteBoxesBatch = useDeleteBoxesBatch();
  const vincularBox = useVincularBoxUnidade();
  const vincularBoxesBatch = useVincularBoxesBatch();

  const unidadesDisponiveis = unidades.filter(
    u => u.status === 'disponivel' || u.status === 'reservada' || u.status === 'negociacao'
  );

  // Verificar se seleção tem boxes vinculados ou não
  const selectedBoxes = boxes.filter(b => selectedBoxIds.has(b.id));
  const temVinculados = selectedBoxes.some(b => b.unidade_id);
  const temNaoVinculados = selectedBoxes.some(b => !b.unidade_id);

  const handleToggleBox = (boxId: string) => {
    setSelectedBoxIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(boxId)) {
        newSet.delete(boxId);
      } else {
        newSet.add(boxId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedBoxIds(new Set(boxes.map(b => b.id)));
  };

  const handleDeselectAll = () => {
    setSelectedBoxIds(new Set());
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedBoxIds(new Set());
  };

  const handleDeleteSelected = () => {
    deleteBoxesBatch.mutate(
      { ids: Array.from(selectedBoxIds), empreendimentoId },
      { onSuccess: handleExitSelectionMode }
    );
  };

  const handleVincular = (boxId: string) => {
    setSelectedBoxId(boxId);
    setSelectedUnidadeId('');
    setVincularOpen(true);
  };

  const handleDesvincular = (boxId: string) => {
    vincularBox.mutate({
      boxId,
      unidadeId: null,
      empreendimentoId,
    });
  };

  const handleConfirmarVinculo = () => {
    if (selectedBoxId && selectedUnidadeId) {
      vincularBox.mutate(
        {
          boxId: selectedBoxId,
          unidadeId: selectedUnidadeId,
          empreendimentoId,
        },
        {
          onSuccess: () => {
            setVincularOpen(false);
            setSelectedBoxId(null);
            setSelectedUnidadeId('');
          },
        }
      );
    }
  };

  const handleVincularEmLote = () => {
    if (vincularLoteUnidadeId && selectedBoxIds.size > 0) {
      vincularBoxesBatch.mutate(
        {
          ids: Array.from(selectedBoxIds),
          unidadeId: vincularLoteUnidadeId,
          empreendimentoId,
        },
        {
          onSuccess: () => {
            setVincularLoteOpen(false);
            setVincularLoteUnidadeId('');
            handleExitSelectionMode();
          },
        }
      );
    }
  };

  const handleDesvincularEmLote = () => {
    const idsVinculados = selectedBoxes.filter(b => b.unidade_id).map(b => b.id);
    if (idsVinculados.length > 0) {
      vincularBoxesBatch.mutate(
        {
          ids: idsVinculados,
          unidadeId: null,
          empreendimentoId,
        },
        { onSuccess: handleExitSelectionMode }
      );
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const stats = {
    total: boxes.length,
    disponiveis: boxes.filter(b => b.status === 'disponivel').length,
    reservados: boxes.filter(b => b.status === 'reservado').length,
    vendidos: boxes.filter(b => b.status === 'vendido').length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Car className="h-5 w-5" />
            Boxes / Vagas de Estacionamento
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as vagas de estacionamento do empreendimento
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectionMode ? (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedBoxIds.size} selecionado(s)
              </span>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Selecionar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Limpar
              </Button>
              {selectionMode === 'excluir' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={selectedBoxIds.size === 0 || deleteBoxesBatch.isPending}
                    >
                      {deleteBoxesBatch.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir ({selectedBoxIds.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão em lote</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir {selectedBoxIds.size} box(es)?
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
              {selectionMode === 'vincular' && (
                <>
                  {temNaoVinculados && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setVincularLoteUnidadeId('');
                        setVincularLoteOpen(true);
                      }}
                      disabled={selectedBoxIds.size === 0}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Vincular ({selectedBoxes.filter(b => !b.unidade_id).length})
                    </Button>
                  )}
                  {temVinculados && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={vincularBoxesBatch.isPending}
                        >
                          {vincularBoxesBatch.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <Link2Off className="h-4 w-4 mr-2" />
                          Desvincular ({selectedBoxes.filter(b => b.unidade_id).length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Desvincular em lote</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja desvincular {selectedBoxes.filter(b => b.unidade_id).length} box(es) de suas unidades?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDesvincularEmLote}>
                            Desvincular
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleExitSelectionMode}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectionMode('vincular')}>
                <Link2 className="h-4 w-4 mr-2" />
                Vincular em Lote
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectionMode('excluir')}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir em Lote
              </Button>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar em Lote
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{stats.disponiveis}</p>
            <p className="text-xs text-emerald-600">Disponíveis</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats.reservados}</p>
            <p className="text-xs text-yellow-600">Reservados</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.vendidos}</p>
            <p className="text-xs text-blue-600">Vendidos</p>
          </div>
        </div>

        {selectionMode === 'vincular' && (
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            Selecione os boxes que deseja <strong>vincular a uma unidade</strong> ou <strong>desvincular</strong>.
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-4">
          <Select value={blocoFilter} onValueChange={setBlocoFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os blocos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os blocos</SelectItem>
              {blocos.map((bloco) => (
                <SelectItem key={bloco.id} value={bloco.id}>
                  {bloco.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(BOX_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {selectionMode && <TableHead className="w-10"></TableHead>}
                <TableHead>Número</TableHead>
                <TableHead>Bloco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Coberto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Unidade Vinculada</TableHead>
                {!selectionMode && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {boxes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhum box cadastrado. Clique em "Criar em Lote" para adicionar.
                  </TableCell>
                </TableRow>
              ) : (
                boxes.map((box) => (
                  <TableRow 
                    key={box.id}
                    className={cn(selectionMode && selectedBoxIds.has(box.id) && 'bg-primary/5')}
                  >
                    {selectionMode && (
                      <TableCell>
                        <Checkbox
                          checked={selectedBoxIds.has(box.id)}
                          onCheckedChange={() => handleToggleBox(box.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{box.numero}</TableCell>
                    <TableCell>{box.bloco?.nome || '-'}</TableCell>
                    <TableCell>{BOX_TIPO_LABELS[box.tipo]}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={box.coberto ? 'bg-primary/10' : ''}>
                        {box.coberto ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(box.valor)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('border', STATUS_COLORS[box.status])}>
                        {BOX_STATUS_LABELS[box.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {box.unidade?.numero ? (
                        <Badge variant="secondary">
                          {box.bloco?.nome ? `${box.bloco.nome} - ` : ''}Un {box.unidade.numero}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {!selectionMode && (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {box.unidade_id ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDesvincular(box.id)}
                              title="Desvincular da unidade"
                            >
                              <Link2Off className="h-4 w-4 text-orange-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVincular(box.id)}
                              title="Vincular a uma unidade"
                            >
                              <Link2 className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Excluir">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o box {box.numero}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBox.mutate({ id: box.id, empreendimentoId })}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Dialog Criar em Lote */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Boxes em Lote</DialogTitle>
          </DialogHeader>
          <BoxBulkForm
            empreendimentoId={empreendimentoId}
            onSuccess={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Vincular Unidade (individual) */}
      <Dialog open={vincularOpen} onOpenChange={setVincularOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Box a Unidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedUnidadeId} onValueChange={setSelectedUnidadeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidadesDisponiveis.map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.id}>
                    {unidade.bloco?.nome ? `${unidade.bloco.nome} - ` : ''}Un {unidade.numero}
                    {unidade.tipologia?.nome ? ` (${unidade.tipologia.nome})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVincularOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarVinculo}
                disabled={!selectedUnidadeId || vincularBox.isPending}
              >
                {vincularBox.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Vincular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Vincular em Lote */}
      <Dialog open={vincularLoteOpen} onOpenChange={setVincularLoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular {selectedBoxes.filter(b => !b.unidade_id).length} Box(es) a uma Unidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Selecione a unidade para vincular os boxes selecionados.
            </p>
            <Select value={vincularLoteUnidadeId} onValueChange={setVincularLoteUnidadeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidadesDisponiveis.map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.id}>
                    {unidade.bloco?.nome ? `${unidade.bloco.nome} - ` : ''}Un {unidade.numero}
                    {unidade.tipologia?.nome ? ` (${unidade.tipologia.nome})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVincularLoteOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleVincularEmLote}
                disabled={!vincularLoteUnidadeId || vincularBoxesBatch.isPending}
              >
                {vincularBoxesBatch.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Vincular em Lote
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
