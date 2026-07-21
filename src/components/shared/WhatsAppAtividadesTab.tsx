import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, X, Trash2, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNexaWhatsappAtividades, useNexaWhatsappCategorias, useDeleteNexaWhatsappAtividade } from '@/hooks/useNexa';
import type { NexaWhatsappAtividade } from '@/types/nexa.types';
import { usePermissions } from '@/hooks/usePermissions';

export function WhatsAppAtividadesTab() {
  const { isAdmin } = usePermissions();
  const admin = isAdmin();

  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewing, setViewing] = useState<NexaWhatsappAtividade | null>(null);
  const [toDelete, setToDelete] = useState<NexaWhatsappAtividade | null>(null);

  const filters = {
    search: search.trim() || undefined,
    categoria: categoria === 'all' ? undefined : categoria,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data: atividades = [], isLoading } = useNexaWhatsappAtividades(filters);
  const { data: categorias = [] } = useNexaWhatsappCategorias();
  const del = useDeleteNexaWhatsappAtividade();

  const clearFilters = () => {
    setSearch(''); setCategoria('all'); setDateFrom(''); setDateTo('');
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <Label className="text-xs">Busca (nome, WhatsApp)</Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" placeholder="Buscar..." />
            </div>
          </div>
          <div>
            <Label className="text-xs">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" /> Limpar
          </Button>
          <p className="text-sm text-muted-foreground">{atividades.length} registro(s)</p>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : !atividades.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma atividade de WhatsApp encontrada. Os registros são gerados automaticamente
            pela rotina diária de resumo de conversas.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Próximas atividades</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atividades.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(new Date(`${a.data}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell className="text-xs">{a.whatsapp}</TableCell>
                  <TableCell>
                    {a.categoria ? <Badge variant="outline">{a.categoria}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-xs max-w-[240px] truncate">{a.proximas_atividades || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setViewing(a)} title="Ver histórico completo">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      {admin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setToDelete(a)}
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.nome} — {viewing?.whatsapp}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {viewing?.categoria && (
              <div><Badge variant="outline">{viewing.categoria}</Badge></div>
            )}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Histórico do dia</p>
              <p className="whitespace-pre-wrap">{viewing?.historico || 'Sem histórico registrado.'}</p>
            </div>
            {viewing?.proximas_atividades && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Próximas atividades</p>
                <p className="whitespace-pre-wrap">{viewing.proximas_atividades}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O resumo de conversa será apagado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!toDelete) return;
                await del.mutateAsync(toDelete.id);
                setToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

