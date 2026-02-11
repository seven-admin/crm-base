import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  CalendarIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  Activity,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuditLogs, useAuditStats, getAvailableTables, getAvailableActions } from '@/hooks/useAuditLogs';

interface AuditLogDetail {
  id: string;
  action: string;
  actionLabel: string;
  table_name: string;
  tableLabel: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user_email: string | null;
  created_at: string;
  record_id: string | null;
}

export default function Auditoria() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [actionFilter, setActionFilter] = useState<string>('');
  const [tableFilter, setTableFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);

  const { data: logsData, isLoading } = useAuditLogs({
    startDate: dateRange.from,
    endDate: dateRange.to,
    action: actionFilter || undefined,
    tableName: tableFilter || undefined,
    page,
    pageSize: 20,
  });

  const { data: stats } = useAuditStats();

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'update':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'login':
        return <LogIn className="h-4 w-4 text-purple-500" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (action) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const renderDiff = (log: AuditLogDetail) => {
    if (log.action === 'create') {
      return (
        <div>
          <h4 className="font-medium mb-2 text-green-600">Dados Criados:</h4>
          <pre className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(log.new_data, null, 2)}
          </pre>
        </div>
      );
    }

    if (log.action === 'delete') {
      return (
        <div>
          <h4 className="font-medium mb-2 text-red-600">Dados Excluídos:</h4>
          <pre className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(log.old_data, null, 2)}
          </pre>
        </div>
      );
    }

    if (log.action === 'update') {
      // Encontrar campos alterados
      const changes: { field: string; old: unknown; new: unknown }[] = [];
      const allKeys = new Set([
        ...Object.keys(log.old_data || {}),
        ...Object.keys(log.new_data || {}),
      ]);

      allKeys.forEach((key) => {
        const oldVal = log.old_data?.[key];
        const newVal = log.new_data?.[key];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes.push({ field: key, old: oldVal, new: newVal });
        }
      });

      return (
        <div className="space-y-4">
          <h4 className="font-medium">Alterações:</h4>
          {changes.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma alteração detectada</p>
          ) : (
            <div className="space-y-3">
              {changes.map((change, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <p className="font-medium text-sm mb-2">{change.field}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      <span className="text-red-600 font-medium">Antes:</span>
                      <pre className="mt-1 text-xs overflow-auto">
                        {typeof change.old === 'object'
                          ? JSON.stringify(change.old, null, 2)
                          : String(change.old ?? 'null')}
                      </pre>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      <span className="text-green-600 font-medium">Depois:</span>
                      <pre className="mt-1 text-xs overflow-auto">
                        {typeof change.new === 'object'
                          ? JSON.stringify(change.new, null, 2)
                          : String(change.new ?? 'null')}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <MainLayout title="Auditoria" subtitle="Log completo de alterações do sistema">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Logs</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-2xl font-bold">{stats?.today || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Criações</p>
                <p className="text-2xl font-bold">
                  {stats?.byAction.find((a) => a.action === 'create')?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Edit className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atualizações</p>
                <p className="text-2xl font-bold">
                  {stats?.byAction.find((a) => a.action === 'update')?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                    {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                        setPage(1);
                      }
                    }}
                    locale={ptBR}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Ação</label>
              <Select value={actionFilter || '__all__'} onValueChange={(v) => { setActionFilter(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {getAvailableActions().map((action) => (
                    <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Tabela</label>
              <Select value={tableFilter || '__all__'} onValueChange={(v) => { setTableFilter(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {getAvailableTables().map((table) => (
                    <SelectItem key={table.value} value={table.value}>{table.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setActionFilter('');
                setTableFilter('');
                setDateRange({ from: subDays(new Date(), 30), to: new Date() });
                setPage(1);
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Logs de Auditoria</span>
            <span className="text-sm font-normal text-muted-foreground">
              {logsData?.total || 0} registros
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="w-32">Ação</TableHead>
                    <TableHead className="hidden md:table-cell">Tabela</TableHead>
                    <TableHead className="w-20">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsData?.logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum log encontrado com os filtros aplicados
                      </TableCell>
                    </TableRow>
                  )}
                  {logsData?.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user_email || <span className="text-muted-foreground">Sistema</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <Badge variant={getActionVariant(log.action)}>
                            {log.actionLabel}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{log.tableLabel}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log as AuditLogDetail)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {(logsData?.totalPages || 0) > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {logsData?.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(logsData?.totalPages || 1, p + 1))}
                      disabled={page >= (logsData?.totalPages || 1)}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getActionIcon(selectedLog.action)}
              Detalhes do Log
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data/Hora</p>
                    <p className="font-medium">
                      {format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Usuário</p>
                    <p className="font-medium">{selectedLog.user_email || 'Sistema'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ação</p>
                    <Badge variant={getActionVariant(selectedLog.action)}>
                      {selectedLog.actionLabel}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tabela</p>
                    <p className="font-medium">{selectedLog.tableLabel}</p>
                  </div>
                  {selectedLog.record_id && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">ID do Registro</p>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{selectedLog.record_id}</code>
                    </div>
                  )}
                </div>

                <hr />

                {renderDiff(selectedLog)}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
