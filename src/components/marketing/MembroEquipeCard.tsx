import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CheckCircle2, AlertCircle, Loader2, Target, ExternalLink } from 'lucide-react';
import type { MembroEquipe, TicketResumo } from '@/hooks/useEquipeMarketing';

interface MembroEquipeCardProps {
  membro: MembroEquipe;
}

function AtividadeListItem({ ticket }: { ticket: TicketResumo }) {
  const navigate = useNavigate();

  const categoriaBadgeColor: Record<string, string> = {
    'criacao': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    'render': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    'video': 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
    'relacionamento': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  };

  return (
    <div
      className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={() => navigate(`/marketing/${ticket.id}`)}
    >
      <div className="flex-1 min-w-0 mr-2">
        <p className="text-sm font-medium truncate">{ticket.titulo}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground font-mono">{ticket.codigo}</span>
          {ticket.categoria && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoriaBadgeColor[ticket.categoria] || ''}`}>
              {ticket.categoria}
            </Badge>
          )}
        </div>
      </div>
      {ticket.data_previsao && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {new Date(ticket.data_previsao).toLocaleDateString('pt-BR')}
        </span>
      )}
      <ExternalLink className="h-3.5 w-3.5 ml-2 text-muted-foreground shrink-0" />
    </div>
  );
}

export function MembroEquipeCard({ membro }: MembroEquipeCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const cargaAtual = membro.emProducao + membro.aguardando + membro.revisao;
  const cargaMaxima = 10;
  const cargaPercent = Math.min((cargaAtual / cargaMaxima) * 100, 100);
  
  const getCargaColor = () => {
    if (cargaPercent >= 80) return 'bg-destructive';
    if (cargaPercent >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={membro.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(membro.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{membro.nome}</h3>
              {membro.cargo && (
                <p className="text-xs text-muted-foreground truncate">{membro.cargo}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {membro.totalTickets} atividades atribuídas
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status dos tickets */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                <Loader2 className="h-3.5 w-3.5" />
                <span className="font-semibold">{membro.emProducao}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Em Produção</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="font-semibold">{membro.aguardando + membro.revisao}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Pendentes</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-semibold">{membro.concluidos}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Concluídos</p>
            </div>
          </div>

          {/* Métricas de performance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Tempo médio
              </span>
              <span className="font-medium">
                {membro.tempoMedio !== null ? `${membro.tempoMedio} dias` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                No prazo
              </span>
              <Badge 
                variant={membro.taxaNoPrazo >= 80 ? 'default' : membro.taxaNoPrazo >= 50 ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {membro.taxaNoPrazo}%
              </Badge>
            </div>
          </div>

          {/* Barra de carga de trabalho */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Carga de trabalho</span>
              <span className="font-medium">{cargaAtual}/{cargaMaxima}</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div 
                className={`h-full transition-all ${getCargaColor()}`}
                style={{ width: `${cargaPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalhamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={membro.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(membro.nome)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>{membro.nome}</span>
                {membro.cargo && (
                  <p className="text-xs text-muted-foreground font-normal">{membro.cargo}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="producao" className="mt-2">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="producao" className="text-xs">
                Em Produção ({membro.ticketsEmProducao.length})
              </TabsTrigger>
              <TabsTrigger value="pendentes" className="text-xs">
                Pendentes ({membro.ticketsPendentes.length})
              </TabsTrigger>
              <TabsTrigger value="concluidos" className="text-xs">
                Concluídos ({membro.ticketsConcluidos.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-3">
              <TabsContent value="producao" className="space-y-2 mt-0">
                {membro.ticketsEmProducao.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade em produção</p>
                ) : (
                  membro.ticketsEmProducao.map(t => <AtividadeListItem key={t.id} ticket={t} />)
                )}
              </TabsContent>

              <TabsContent value="pendentes" className="space-y-2 mt-0">
                {membro.ticketsPendentes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade pendente</p>
                ) : (
                  membro.ticketsPendentes.map(t => <AtividadeListItem key={t.id} ticket={t} />)
                )}
              </TabsContent>

              <TabsContent value="concluidos" className="space-y-2 mt-0">
                {membro.ticketsConcluidos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade concluída no período</p>
                ) : (
                  membro.ticketsConcluidos.map(t => <AtividadeListItem key={t.id} ticket={t} />)
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
