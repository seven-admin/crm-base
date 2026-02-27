import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Eye, History, Trash2 } from 'lucide-react';
import { useWebhookLogs, useCleanOldWebhookLogs, type WebhookLog } from '@/hooks/useWebhooks';
import { PaginationControls } from '@/components/ui/pagination-controls';

interface WebhookLogsSectionProps {
  webhooks: Array<{ id: string; evento: string; url: string }>;
}

export function WebhookLogsSection({ webhooks }: WebhookLogsSectionProps) {
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [payloadDialog, setPayloadDialog] = useState<WebhookLog | null>(null);

  const { data, isLoading } = useWebhookLogs(selectedWebhookId, page, 20);
  const cleanMutation = useCleanOldWebhookLogs();

  const logs = data?.logs ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  const handleFilterChange = (v: string) => {
    setSelectedWebhookId(v === 'all' ? undefined : v);
    setPage(1);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Histórico de Disparos</h3>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={cleanMutation.isPending}>
                {cleanMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Limpar antigos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar logs antigos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todos os logs de disparo anteriores ao mês corrente serão excluídos permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => cleanMutation.mutate()}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Select
            value={selectedWebhookId || 'all'}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filtrar por webhook" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os webhooks</SelectItem>
              {webhooks.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.evento} — {wh.url.substring(0, 30)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length > 0 ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead className="hidden md:table-cell">URL</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Tempo</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="text-xs">
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium">{log.evento}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        {log.url.length > 40 ? `${log.url.substring(0, 40)}...` : log.url}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      {log.sucesso ? (
                        <Badge className="bg-green-500 text-white text-[10px]">
                          {log.status_code || 'OK'}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          {log.status_code || 'ERRO'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {log.tempo_ms != null ? `${log.tempo_ms}ms` : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPayloadDialog(log)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
          Nenhum log de disparo encontrado.
        </div>
      )}

      {/* Payload Detail Dialog */}
      <Dialog open={!!payloadDialog} onOpenChange={() => setPayloadDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Disparo</DialogTitle>
          </DialogHeader>
          {payloadDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Evento:</span>
                  <p className="font-medium">{payloadDialog.evento}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">
                    {payloadDialog.sucesso ? '✅ Sucesso' : '❌ Falha'}
                    {payloadDialog.status_code && ` (${payloadDialog.status_code})`}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tempo:</span>
                  <p className="font-medium">{payloadDialog.tempo_ms ?? '-'}ms</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <p className="font-medium">
                    {format(new Date(payloadDialog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">URL:</span>
                <code className="block mt-1 text-xs bg-muted p-2 rounded break-all">
                  {payloadDialog.url}
                </code>
              </div>

              {payloadDialog.erro && (
                <div>
                  <span className="text-sm text-destructive">Erro:</span>
                  <code className="block mt-1 text-xs bg-destructive/10 text-destructive p-2 rounded">
                    {payloadDialog.erro}
                  </code>
                </div>
              )}

              <div>
                <span className="text-sm text-muted-foreground">Payload Enviado:</span>
                <pre className="mt-1 text-xs bg-muted p-3 rounded overflow-x-auto max-h-60">
                  {JSON.stringify(payloadDialog.payload, null, 2)}
                </pre>
              </div>

              {payloadDialog.response_body && (
                <div>
                  <span className="text-sm text-muted-foreground">Resposta:</span>
                  <pre className="mt-1 text-xs bg-muted p-3 rounded overflow-x-auto max-h-40">
                    {payloadDialog.response_body}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
