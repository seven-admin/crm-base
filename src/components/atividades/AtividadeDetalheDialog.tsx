import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Phone, Users, MapPin, Headphones, Calendar, Clock, User, Building2, MessageSquare, ThermometerSun, CalendarCheck, Shield, Video, Handshake, PenTool, PackageCheck, GraduationCap, Briefcase } from 'lucide-react';
import type { Atividade, AtividadeTipo, AtividadeStatus, AtividadeSubtipo } from '@/types/atividades.types';
import { ATIVIDADE_TIPO_LABELS, ATIVIDADE_STATUS_LABELS, ATIVIDADE_SUBTIPO_LABELS } from '@/types/atividades.types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AtividadeComentarios } from './AtividadeComentarios';
import { AlterarStatusAtividadeDialog } from './AlterarStatusAtividadeDialog';
import { TemperaturaSelector } from './TemperaturaSelector';
import { useUpdateAtividade } from '@/hooks/useAtividades';
import { useAtividadeHistorico } from '@/hooks/useAtividadeHistorico';
import type { ClienteTemperatura } from '@/types/clientes.types';

interface AtividadeDetalheDialogProps {
  atividade: Atividade | null;
  loading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  negociacao: Handshake,
  contra_proposta_atividade: Headphones,
};

const STATUS_COLORS: Record<AtividadeStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  concluida: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-gray-100 text-gray-600 border-gray-200',
};

const TIPO_COLORS: Record<AtividadeTipo, string> = {
  ligacao: 'bg-blue-100 text-blue-800 border-blue-200',
  meeting: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  reuniao: 'bg-purple-100 text-purple-800 border-purple-200',
  visita: 'bg-orange-100 text-orange-800 border-orange-200',
  atendimento: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  fechamento: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  assinatura: 'bg-teal-100 text-teal-800 border-teal-200',
  acompanhamento: 'bg-sky-100 text-sky-800 border-sky-200',
  treinamento: 'bg-amber-100 text-amber-800 border-amber-200',
  administrativa: 'bg-slate-100 text-slate-800 border-slate-200',
  negociacao: 'bg-violet-100 text-violet-800 border-violet-200',
  contra_proposta_atividade: 'bg-rose-100 text-rose-800 border-rose-200',
};

const TEMPERATURA_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  frio: { label: 'Frio', color: 'bg-blue-100 text-blue-800', emoji: '❄️' },
  morno: { label: 'Morno', color: 'bg-yellow-100 text-yellow-800', emoji: '🌤️' },
  quente: { label: 'Quente', color: 'bg-orange-100 text-orange-800', emoji: '🔥' },
};

export function AtividadeDetalheDialog({ atividade, loading = false, open, onOpenChange }: AtividadeDetalheDialogProps) {
  const { role } = useAuth();
  const [alterarStatusOpen, setAlterarStatusOpen] = useState(false);
  const updateAtividade = useUpdateAtividade();
  const { data: historico = [] } = useAtividadeHistorico(atividade?.id ?? null);
  
  const TipoIcon = atividade ? TIPO_ICONS[atividade.tipo] : Phone;
  const temperatura = atividade?.temperatura_cliente 
    ? TEMPERATURA_LABELS[atividade.temperatura_cliente] 
    : null;

  const handleTemperaturaChange = (temp: ClienteTemperatura | null) => {
    if (atividade) {
      updateAtividade.mutate({ id: atividade.id, data: { temperatura_cliente: temp } });
    }
  };

  const isAtrasada = (() => {
    if (!atividade) return false;
    if (atividade.status !== 'pendente') return false;
    if (!atividade.deadline_date) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(`${atividade.deadline_date}T00:00:00`);
    prazo.setHours(0, 0, 0, 0);
    return prazo < hoje;
  })();

  // Super Admin pode alterar status
  const canAlterStatus = role === 'super_admin';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Detalhes da Atividade</DialogTitle>
          </DialogHeader>

          {loading || !atividade ? (
            <div className="space-y-4">
              <div>
                <Skeleton className="h-6 w-3/4" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Separator />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
          <div className="space-y-6">
            {/* Título e Badges */}
            <div>
              <h3 className="font-semibold text-lg mb-3">{atividade.titulo}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={cn('border', TIPO_COLORS[atividade.tipo])}>
                  <TipoIcon className="h-3 w-3 mr-1" />
                  {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
                </Badge>
                {atividade.subtipo && (
                  <Badge variant="secondary">
                    {ATIVIDADE_SUBTIPO_LABELS[atividade.subtipo as AtividadeSubtipo]}
                  </Badge>
                )}
                <Badge variant="outline" className={cn('border', STATUS_COLORS[atividade.status])}>
                  {ATIVIDADE_STATUS_LABELS[atividade.status]}
                </Badge>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Observações</span>
              </div>
              <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                {atividade.observacoes || <span className="text-muted-foreground italic">Sem observações</span>}
              </p>
            </div>

            <Separator />

            {/* Informações principais */}
            <div className="grid grid-cols-2 gap-4">
              {atividade.cliente && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-medium">{atividade.cliente.nome}</p>
                  </div>
                </div>
              )}

              {atividade.corretor && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Corretor</p>
                    <p className="font-medium">{atividade.corretor.nome_completo}</p>
                  </div>
                </div>
              )}

              {atividade.empreendimento && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Empreendimento</p>
                    <p className="font-medium">{atividade.empreendimento.nome}</p>
                  </div>
                </div>
              )}

              {atividade.gestor && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Gestor</p>
                    <p className="font-medium">{atividade.gestor.full_name}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Data de Início e Fim */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Início:</span>
                <span>{format(new Date(`${atividade.data_inicio}T00:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                {atividade.hora_inicio && (
                  <span className="text-sm text-muted-foreground">às {atividade.hora_inicio.substring(0, 5)}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Fim:</span>
                <span>{format(new Date(`${atividade.data_fim}T00:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                {atividade.hora_fim && (
                  <span className="text-sm text-muted-foreground">às {atividade.hora_fim.substring(0, 5)}</span>
                )}
              </div>
            </div>

            {/* Prazo (deadline) */}
            {atividade.deadline_date && (
              <div className={cn(
                'flex items-center justify-between gap-3 p-3 rounded-lg border',
                isAtrasada ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/30'
              )}>
                <div className="flex items-center gap-2">
                  <Calendar className={cn('h-4 w-4', isAtrasada ? 'text-destructive' : 'text-muted-foreground')} />
                  <span className="text-sm text-muted-foreground">Prazo:</span>
                  <strong className={cn('text-sm', isAtrasada ? 'text-destructive' : 'text-foreground')}>
                    {format(new Date(`${atividade.deadline_date}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
                  </strong>
                </div>
                {isAtrasada && (
                  <Badge variant="outline" className="border-destructive text-destructive">
                    Atrasada
                  </Badge>
                )}
              </div>
            )}


            {/* Resultado (se concluída) */}
            {atividade.status === 'concluida' && atividade.resultado && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <CalendarCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">Resultado</span>
                </div>
                <p className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/20 whitespace-pre-wrap">
                  {atividade.resultado}
                </p>
              </div>
            )}

            {/* Motivo do Cancelamento (se cancelada) */}
            {atividade.status === 'cancelada' && atividade.motivo_cancelamento && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-destructive">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">Motivo do Cancelamento</span>
                </div>
                <p className="text-sm bg-destructive/5 p-3 rounded-lg border border-destructive/20 whitespace-pre-wrap">
                  {atividade.motivo_cancelamento}
                </p>
              </div>
            )}

            {/* Temperatura do Cliente */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ThermometerSun className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Temperatura:</span>
              </div>
              <TemperaturaSelector
                value={atividade.temperatura_cliente}
                onValueChange={handleTemperaturaChange}
              />
            </div>

            {/* Follow-up */}
            {atividade.requer_followup && atividade.data_followup && (
              <div className="flex items-center gap-2 p-3 bg-accent/30 rounded-lg border border-border">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  Follow-up agendado para{' '}
                  <strong>
                    {format(new Date(atividade.data_followup), "dd/MM/yyyy", { locale: ptBR })}
                  </strong>
                </span>
              </div>
            )}

            {/* Seção de Interações/Comentários */}
            <Separator />
            <AtividadeComentarios atividadeId={atividade.id} />

            {/* Histórico de Alterações */}
            {historico.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Histórico</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {historico.map((item) => (
                      <div key={item.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="shrink-0 text-[10px] mt-0.5">
                          {format(new Date(item.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                        </span>
                        <span className="flex-1">
                          <span className="font-medium text-foreground">{item.user?.full_name || 'Sistema'}</span>
                          {' — '}
                          {item.tipo_evento === 'criacao' && 'Criou a atividade'}
                          {item.tipo_evento === 'concluida' && 'Concluiu a atividade'}
                          {item.tipo_evento === 'cancelada' && 'Cancelou a atividade'}
                          {item.tipo_evento === 'reaberta' && 'Reabriu a atividade'}
                          {item.tipo_evento === 'temperatura_alterada' && `Temperatura: ${item.valor_anterior || '—'} → ${item.valor_novo}`}
                          {item.tipo_evento === 'status_alterado' && `Status: ${item.valor_anterior} → ${item.valor_novo}`}
                          {item.tipo_evento === 'edicao' && `Editou ${item.campo_alterado}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Ações de Super Admin */}
            {canAlterStatus && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Ações de Administrador</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAlterarStatusOpen(true)}
                    className="w-full"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Alterar Status da Atividade
                  </Button>
                </div>
              </>
            )}
          </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para alterar status */}
      {atividade && (
        <AlterarStatusAtividadeDialog
          open={alterarStatusOpen}
          onOpenChange={setAlterarStatusOpen}
          atividadeId={atividade.id}
          statusAtual={atividade.status}
          onSuccess={() => onOpenChange(false)}
        />
      )}
    </>
  );
}
