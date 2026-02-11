import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, DollarSign, ListTodo, Users, Edit, Clock, Trash2 } from 'lucide-react';
import { useEventos, useTarefasEvento } from '@/hooks/useEventos';
import { 
  EventoTarefasTab, 
  EventoCronograma, 
  EventoEquipeTab, 
  EventoEditDialog 
} from '@/components/eventos';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_LABELS: Record<string, string> = {
  planejamento: 'Planejamento',
  preparacao: 'Preparação',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  planejamento: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  preparacao: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  em_andamento: 'bg-green-500/10 text-green-500 border-green-500/20',
  concluido: 'bg-muted text-muted-foreground border-muted',
  cancelado: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function EventoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useEvento, deleteEvento } = useEventos();
  const { data: evento, isLoading: isLoadingEvento } = useEvento(id || '');
  const { tarefas } = useTarefasEvento(id || '');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleExcluirEvento = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteEvento.mutateAsync(id!);
      navigate('/eventos');
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  if (isLoadingEvento) {
    return (
      <MainLayout title="Carregando..." subtitle="">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!evento) {
    return (
      <MainLayout title="Evento não encontrado" subtitle="">
        <Card className="p-12 text-center">
          <h3 className="font-semibold mb-2">Evento não encontrado</h3>
          <p className="text-muted-foreground">O evento solicitado não existe ou foi removido.</p>
        </Card>
      </MainLayout>
    );
  }

  const tarefasConcluidas = tarefas?.filter(t => t.status === 'concluida').length || 0;
  const tarefasTotal = tarefas?.length || 0;
  const progresso = tarefasTotal > 0 ? (tarefasConcluidas / tarefasTotal) * 100 : 0;
  
  const dataEvento = new Date(evento.data_evento);
  const hoje = new Date();
  const diasRestantes = differenceInDays(dataEvento, hoje);
  const eventoPassou = isPast(dataEvento);

  const progressoMetadata = (
    <div className="flex items-center gap-4">
      <span className={eventoPassou ? 'text-muted-foreground' : diasRestantes <= 7 ? 'text-destructive font-medium' : ''}>
        {eventoPassou 
          ? 'Evento já ocorreu' 
          : diasRestantes === 0 
            ? 'Evento é hoje!' 
            : `${diasRestantes} dias restantes`}
      </span>
      <div className="flex items-center gap-2">
        <ListTodo className="h-4 w-4 text-muted-foreground" />
        <Progress value={progresso} className="h-2 w-24" />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {tarefasConcluidas}/{tarefasTotal}
        </span>
      </div>
    </div>
  );

  return (
    <MainLayout 
      title={evento.nome}
      subtitle={evento.codigo}
      backTo="/eventos"
      backLabel="Eventos"
      badge={
        <Badge variant="outline" className={STATUS_COLORS[evento.status || 'planejamento']}>
          {STATUS_LABELS[evento.status || 'planejamento']}
        </Badge>
      }
      metadata={progressoMetadata}
      actions={
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            onClick={handleExcluirEvento} 
            className="gap-2"
            disabled={deleteEvento.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
          <Button onClick={() => setEditDialogOpen(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            Editar Evento
          </Button>
        </div>
      }
    >

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">
              {format(dataEvento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Local</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold truncate">
              {evento.local || 'Não definido'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">
              {evento.orcamento 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(evento.orcamento)
                : 'Não definido'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Responsável</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold truncate">
              {evento.responsavel?.full_name || 'Não definido'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs with real components */}
      <Tabs defaultValue="tarefas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tarefas" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="cronograma" className="gap-2">
            <Clock className="h-4 w-4" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-2">
            <Users className="h-4 w-4" />
            Equipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tarefas">
          <EventoTarefasTab eventoId={id || ''} />
        </TabsContent>

        <TabsContent value="cronograma">
          <EventoCronograma tarefas={tarefas || []} dataEvento={evento.data_evento} />
        </TabsContent>

        <TabsContent value="equipe">
          <EventoEquipeTab eventoId={id || ''} responsavelId={evento.responsavel_id} />
        </TabsContent>
      </Tabs>

      {/* Description */}
      {evento.descricao && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{evento.descricao}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <EventoEditDialog 
        evento={evento} 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
      />
    </MainLayout>
  );
}
