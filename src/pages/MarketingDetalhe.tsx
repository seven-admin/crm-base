import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Calendar, User, Building2, MessageSquare, History, CheckSquare, Pencil, Trash2, Image, FileText, ExternalLink, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProjetosMarketing } from '@/hooks/useProjetosMarketing';
import { useProjetoResponsaveis } from '@/hooks/useProjetoResponsaveis';
import { CATEGORIA_LABELS, STATUS_LABELS, STATUS_COLORS, PRIORIDADE_LABELS, PRIORIDADE_COLORS } from '@/types/marketing.types';
import { ProjetoTarefas } from '@/components/marketing/ProjetoTarefas';
import { ProjetoComentarios } from '@/components/marketing/ProjetoComentarios';
import { ProjetoTimeline } from '@/components/marketing/ProjetoTimeline';
import { ProjetoEditForm } from '@/components/marketing/ProjetoEditForm';
import { ProjetoCriativos } from '@/components/marketing/ProjetoCriativos';

export default function MarketingDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useProjeto, deleteProjeto } = useProjetosMarketing();
  const { data: projeto, isLoading } = useProjeto(id || '');
  const { responsaveis, removeResponsavel } = useProjetoResponsaveis(id);
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    if (!projeto) return;
    await deleteProjeto.mutateAsync(projeto.id);
    navigate('/marketing');
  };

  if (isLoading) {
    return (
      <MainLayout title="Carregando...">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!projeto) {
    return (
      <MainLayout title="Projeto não encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">O projeto solicitado não foi encontrado.</p>
          <Link to="/marketing">
            <Button>Voltar para Marketing</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const headerBadges = (
    <>
      <Badge 
        className="text-white"
        style={{ backgroundColor: STATUS_COLORS[projeto.status] }}
      >
        {STATUS_LABELS[projeto.status]}
      </Badge>
      <Badge 
        variant="outline"
        style={{ borderColor: PRIORIDADE_COLORS[projeto.prioridade] }}
      >
        {PRIORIDADE_LABELS[projeto.prioridade]}
      </Badge>
    </>
  );

  return (
    <MainLayout 
      title={projeto.titulo}
      subtitle={`${projeto.codigo} · ${CATEGORIA_LABELS[projeto.categoria]}`}
      backTo="/marketing"
      backLabel="Marketing"
      badge={headerBadges}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Ticket</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o ticket "{projeto.titulo}"? 
                  Esta ação não pode ser desfeita e removerá todas as tarefas, 
                  comentários e histórico associados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteProjeto.isPending ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      }
    >
      {/* Edit Form Dialog */}
      <ProjetoEditForm 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        projeto={projeto} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição e Briefing */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Briefing</CardTitle>
              {projeto.briefing && (
                <Link to={`/briefings`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <ExternalLink className="h-3 w-3" />
                    {projeto.briefing.codigo}
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {projeto.briefing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                      <p className="font-medium">{projeto.briefing.cliente}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tema</p>
                      <p className="font-medium">{projeto.briefing.tema}</p>
                    </div>
                  </div>

                  {projeto.briefing.objetivo && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Objetivo</p>
                      <p>{projeto.briefing.objetivo}</p>
                    </div>
                  )}

                  {(projeto.briefing.formato_peca || projeto.briefing.composicao) && (
                    <div className="grid grid-cols-2 gap-4">
                      {projeto.briefing.formato_peca && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Formato da Peça</p>
                          <p>{projeto.briefing.formato_peca}</p>
                        </div>
                      )}
                      {projeto.briefing.composicao && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Composição</p>
                          <p>{projeto.briefing.composicao}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {(projeto.briefing.head_titulo || projeto.briefing.sub_complemento) && (
                    <div className="grid grid-cols-2 gap-4">
                      {projeto.briefing.head_titulo && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Head / Título</p>
                          <p>{projeto.briefing.head_titulo}</p>
                        </div>
                      )}
                      {projeto.briefing.sub_complemento && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Sub / Complemento</p>
                          <p>{projeto.briefing.sub_complemento}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {projeto.briefing.mensagem_chave && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Mensagem Chave</p>
                      <p>{projeto.briefing.mensagem_chave}</p>
                    </div>
                  )}

                  {(projeto.briefing.tom_comunicacao || projeto.briefing.estilo_visual) && (
                    <div className="grid grid-cols-2 gap-4">
                      {projeto.briefing.tom_comunicacao && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Tom de Comunicação</p>
                          <p>{projeto.briefing.tom_comunicacao}</p>
                        </div>
                      )}
                      {projeto.briefing.estilo_visual && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Estilo Visual</p>
                          <p>{projeto.briefing.estilo_visual}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {projeto.briefing.diretrizes_visuais && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Diretrizes Visuais</p>
                      <p className="whitespace-pre-wrap">{projeto.briefing.diretrizes_visuais}</p>
                    </div>
                  )}

                  {projeto.briefing.referencia && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Referência</p>
                      <p className="whitespace-pre-wrap">{projeto.briefing.referencia}</p>
                    </div>
                  )}

                  {projeto.briefing.importante && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Importante</p>
                      <p className="whitespace-pre-wrap text-amber-600">{projeto.briefing.importante}</p>
                    </div>
                  )}

                  {projeto.briefing.observacoes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Observações</p>
                      <p className="whitespace-pre-wrap">{projeto.briefing.observacoes}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {projeto.descricao && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                      <p>{projeto.descricao}</p>
                    </div>
                  )}
                  {projeto.briefing_texto && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Detalhes do Briefing</p>
                      <p className="whitespace-pre-wrap">{projeto.briefing_texto}</p>
                    </div>
                  )}
                  {!projeto.descricao && !projeto.briefing_texto && (
                    <p className="text-muted-foreground">Nenhum briefing cadastrado.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="tarefas">
            <TabsList>
              <TabsTrigger value="tarefas" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="criativo" className="gap-2">
                <Image className="h-4 w-4" />
                Criativo
              </TabsTrigger>
              <TabsTrigger value="comentarios" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários
              </TabsTrigger>
              <TabsTrigger value="historico" className="gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tarefas" className="mt-4">
              <ProjetoTarefas projetoId={projeto.id} />
            </TabsContent>

            <TabsContent value="criativo" className="mt-4">
              <ProjetoCriativos projetoId={projeto.id} />
            </TabsContent>

            <TabsContent value="comentarios" className="mt-4">
              <ProjetoComentarios projetoId={projeto.id} />
            </TabsContent>

            <TabsContent value="historico" className="mt-4">
              <ProjetoTimeline projetoId={projeto.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projeto.cliente && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{projeto.cliente.full_name}</p>
                  </div>
                </div>
              )}

              {projeto.supervisor && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Supervisor</p>
                    <p className="font-medium">{projeto.supervisor.full_name}</p>
                  </div>
                </div>
              )}

              {projeto.empreendimento && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Empreendimento</p>
                    <p className="font-medium">{projeto.empreendimento.nome}</p>
                  </div>
                </div>
              )}

              {projeto.criador && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Criado por</p>
                    <p className="font-medium">{projeto.criador.full_name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responsáveis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Responsáveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {projeto.supervisor && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {projeto.supervisor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{projeto.supervisor.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">Principal</p>
                  </div>
                </div>
              )}
              {responsaveis.map(r => (
                <div key={r.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 group">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {r.user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium truncate flex-1">{r.user?.full_name}</p>
                  <button 
                    onClick={() => removeResponsavel.mutate(r.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
              {!projeto.supervisor && responsaveis.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum responsável atribuído.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Solicitação</p>
                  <p className="font-medium">
                    {format(new Date(projeto.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>

              {projeto.data_inicio && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="font-medium">
                      {format(new Date(projeto.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {projeto.data_previsao && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Previsão</p>
                    <p className="font-medium">
                      {format(new Date(projeto.data_previsao), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {projeto.data_entrega && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Entregue em</p>
                    <p className="font-medium text-green-600">
                      {format(new Date(projeto.data_entrega), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
