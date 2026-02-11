import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditLogs, TABLE_LABELS, ACTION_LABELS } from '@/hooks/useAuditLogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  User, 
  Building2, 
  Home, 
  LayoutGrid, 
  Settings2, 
  DollarSign,
  FileText,
  Image,
  Users,
  Plus,
  Edit,
  Trash2,
  History
} from 'lucide-react';

interface HistoricoEmpreendimentoTabProps {
  empreendimentoId: string;
}

const TABLE_ICONS: Record<string, React.ReactNode> = {
  empreendimentos: <Building2 className="h-4 w-4" />,
  unidades: <Home className="h-4 w-4" />,
  tipologias: <LayoutGrid className="h-4 w-4" />,
  blocos: <Building2 className="h-4 w-4" />,
  configuracao_comercial: <Settings2 className="h-4 w-4" />,
  unidade_historico_precos: <DollarSign className="h-4 w-4" />,
  empreendimento_documentos: <FileText className="h-4 w-4" />,
  empreendimento_midias: <Image className="h-4 w-4" />,
  empreendimento_corretores: <Users className="h-4 w-4" />,
  empreendimento_imobiliarias: <Users className="h-4 w-4" />,
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  insert: <Plus className="h-3.5 w-3.5" />,
  update: <Edit className="h-3.5 w-3.5" />,
  delete: <Trash2 className="h-3.5 w-3.5" />,
};

const ACTION_COLORS: Record<string, string> = {
  insert: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  update: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  delete: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export function HistoricoEmpreendimentoTab({ empreendimentoId }: HistoricoEmpreendimentoTabProps) {
  // Buscar logs de auditoria filtrados pelo empreendimento
  const { data: logsData, isLoading } = useAuditLogs({
    page: 1,
    pageSize: 100,
  });

  // Filtrar logs relevantes ao empreendimento
  const logs = logsData?.logs.filter(log => {
    // Logs diretos do empreendimento
    if (log.table_name === 'empreendimentos' && log.record_id === empreendimentoId) {
      return true;
    }
    
    // Logs de entidades relacionadas (verificar new_data ou old_data)
    const relatedTables = [
      'unidades', 'tipologias', 'blocos', 'configuracao_comercial',
      'empreendimento_documentos', 'empreendimento_midias',
      'empreendimento_corretores', 'empreendimento_imobiliarias'
    ];
    
    if (relatedTables.includes(log.table_name)) {
      const checkData = (data: unknown) => {
        if (data && typeof data === 'object' && 'empreendimento_id' in data) {
          return (data as { empreendimento_id: string }).empreendimento_id === empreendimentoId;
        }
        return false;
      };
      
      return checkData(log.new_data) || checkData(log.old_data);
    }
    
    return false;
  }) || [];

  const formatChanges = (oldData: unknown, newData: unknown) => {
    if (!oldData && newData) {
      return null; // Insert - não mostrar diff
    }
    
    if (oldData && !newData) {
      return null; // Delete - não mostrar diff
    }
    
    if (oldData && newData && typeof oldData === 'object' && typeof newData === 'object') {
      const changes: { field: string; from: string; to: string }[] = [];
      const oldObj = oldData as Record<string, unknown>;
      const newObj = newData as Record<string, unknown>;
      
      // Campos a ignorar
      const ignoreFields = ['updated_at', 'created_at', 'id'];
      
      for (const key of Object.keys(newObj)) {
        if (ignoreFields.includes(key)) continue;
        
        const oldVal = oldObj[key];
        const newVal = newObj[key];
        
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes.push({
            field: key,
            from: oldVal !== null && oldVal !== undefined ? String(oldVal) : '-',
            to: newVal !== null && newVal !== undefined ? String(newVal) : '-',
          });
        }
      }
      
      return changes.length > 0 ? changes : null;
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <History className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-lg font-semibold">Histórico de Alterações</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => {
                const changes = formatChanges(log.old_data, log.new_data);
                
                return (
                  <div
                    key={log.id}
                    className="relative pl-6 pb-4 border-l-2 border-muted last:border-l-0"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                      {TABLE_ICONS[log.table_name] || <Edit className="h-2 w-2" />}
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          {TABLE_ICONS[log.table_name]}
                          <span className="font-medium">
                            {TABLE_LABELS[log.table_name] || log.table_name}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={ACTION_COLORS[log.action] || ''}
                          >
                            {ACTION_ICONS[log.action]}
                            <span className="ml-1">
                              {ACTION_LABELS[log.action] || log.action}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>

                      {/* User info */}
                      {log.user_email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          {log.user_email}
                        </div>
                      )}

                      {/* Changes */}
                      {changes && changes.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Alterações:
                          </p>
                          <div className="space-y-1">
                            {changes.slice(0, 5).map((change, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-muted-foreground min-w-[100px]">
                                  {change.field}:
                                </span>
                                <span className="text-muted-foreground line-through text-xs">
                                  {change.from.length > 30 ? change.from.substring(0, 30) + '...' : change.from}
                                </span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-medium text-foreground text-xs">
                                  {change.to.length > 30 ? change.to.substring(0, 30) + '...' : change.to}
                                </span>
                              </div>
                            ))}
                            {changes.length > 5 && (
                              <p className="text-xs text-muted-foreground">
                                + {changes.length - 5} outras alterações
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma alteração registrada para este empreendimento.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}