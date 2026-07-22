import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/dashboard/KPICard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  MapPin,
  Edit,
  Loader2,
  Home,
  FileText,
  Image,
  LayoutGrid,
  Calculator,
  Trash2,
  DollarSign,
  History,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MoreVertical,
  Power,
} from 'lucide-react';
import { useEmpreendimento, useDeleteEmpreendimento, useUpdateEmpreendimento } from '@/hooks/useEmpreendimentos';
import { EmpreendimentoForm } from '@/components/empreendimentos/EmpreendimentoForm';
import { UnidadesTab } from '@/components/empreendimentos/UnidadesTab';
import { TipologiasTab } from '@/components/empreendimentos/TipologiasTab';
import { DocumentosTab } from '@/components/empreendimentos/DocumentosTab';
import { MidiasTab } from '@/components/empreendimentos/MidiasTab';
import { UnidadesMemorialTab } from '@/components/empreendimentos/UnidadesMemorialTab';
import { HistoricoEmpreendimentoTab } from '@/components/empreendimentos/HistoricoEmpreendimentoTab';
import { FachadasTab } from '@/components/empreendimentos/FachadasTab';
import { BoxesTab } from '@/components/empreendimentos/BoxesTab';
import { ValoresTab } from '@/components/empreendimentos/ValoresTab';
import { BlocosTab } from '@/components/empreendimentos/BlocosTab';
import { useAuth } from '@/contexts/AuthContext';
import {
  EMPREENDIMENTO_STATUS_LABELS,
  EMPREENDIMENTO_STATUS_COLORS,
  EMPREENDIMENTO_TIPO_LABELS,
} from '@/types/empreendimentos.types';
import { cn } from '@/lib/utils';

export default function EmpreendimentoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { role } = useAuth();

  const isAdminOrGestor = role === 'super_admin' || role === 'admin' || role === 'gestor_produto';
  const canDelete = role === 'super_admin' || role === 'admin';

  const { data: empreendimento, isLoading } = useEmpreendimento(id);
  const isPredio = empreendimento?.tipo === 'predio';
  const deleteEmpreendimento = useDeleteEmpreendimento();
  const updateEmpreendimento = useUpdateEmpreendimento();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const handleDelete = () => {
    if (id) {
      deleteEmpreendimento.mutate(id, {
        onSuccess: () => navigate('/empreendimentos'),
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Carregando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!empreendimento) {
    return (
      <MainLayout title="Empreendimento não encontrado">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            Empreendimento não encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            O empreendimento solicitado não existe ou você não tem acesso.
          </p>
          <Button onClick={() => navigate('/empreendimentos')}>
            Voltar para Empreendimentos
          </Button>
        </div>
      </MainLayout>
    );
  }

  const totalUnidades =
    empreendimento.unidades_disponiveis +
    empreendimento.unidades_reservadas +
    empreendimento.unidades_vendidas +
    empreendimento.unidades_bloqueadas +
    (empreendimento.unidades_negociacao || 0);

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button onClick={() => setFormOpen(true)}>
        <Edit className="h-4 w-4 mr-2" />
        Editar
      </Button>

      {canDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                updateEmpreendimento.mutate({
                  id: id!,
                  data: { is_active: !empreendimento.is_active } as any,
                });
              }}
            >
              <Power className="h-4 w-4 mr-2" />
              {empreendimento.is_active ? 'Desativar' : 'Ativar'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empreendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o empreendimento "{empreendimento?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEmpreendimento.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const locationMetadata = empreendimento.endereco_cidade ? (
    <span className="flex items-center gap-1">
      <MapPin className="h-3.5 w-3.5" />
      {empreendimento.endereco_cidade}
      {empreendimento.endereco_uf && `, ${empreendimento.endereco_uf}`}
    </span>
  ) : null;

  return (
    <MainLayout
      title={empreendimento.nome}
      subtitle={EMPREENDIMENTO_TIPO_LABELS[empreendimento.tipo]}
      backTo="/empreendimentos"
      backLabel="Empreendimentos"
      badge={
        <Badge className={cn('border', EMPREENDIMENTO_STATUS_COLORS[empreendimento.status])}>
          {EMPREENDIMENTO_STATUS_LABELS[empreendimento.status]}
        </Badge>
      }
      metadata={locationMetadata}
      actions={headerActions}
    >

      {!empreendimento.is_active && (
        <div className="mb-6 flex items-center gap-2 rounded-[1.25rem] border border-yellow-500/30 bg-yellow-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Este empreendimento está <strong>desativado</strong> e não aparece nas listagens para os demais usuários.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-[1.75rem] border border-border/70 bg-card md:grid-cols-4 [&>*]:rounded-none [&>*]:border-0 [&>*]:border-b [&>*]:border-r [&>*]:border-border/70">
        <KPICard
          title="Total de Unidades"
          value={totalUnidades.toLocaleString('pt-BR')}
          icon={Home}
          iconColor="blue"
        />
        <KPICard
          title="Disponíveis"
          value={empreendimento.unidades_disponiveis.toLocaleString('pt-BR')}
          icon={CheckCircle2}
          iconColor="green"
        />
        <KPICard
          title="VGV Total"
          value={formatCurrency(empreendimento.valor_total)}
          icon={DollarSign}
          iconColor="orange"
        />
        <KPICard
          title="VGV Vendido"
          value={formatCurrency(empreendimento.valor_vendido)}
          icon={TrendingUp}
          iconColor="purple"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="unidades" className="space-y-4">
        <TabsList className="w-full flex justify-start overflow-x-auto scrollbar-thin h-auto p-1">
          <TabsTrigger value="unidades" className="gap-2 shrink-0">
            <Home className="h-4 w-4 hidden sm:block" />
            Unidades
          </TabsTrigger>
          <TabsTrigger value="blocos" className="gap-2 shrink-0">
            <Building2 className="h-4 w-4 hidden sm:block" />
            {empreendimento.tipo === 'loteamento' || empreendimento.tipo === 'condominio' ? 'Quadras' : 'Blocos'}
          </TabsTrigger>
          <TabsTrigger value="tipologias" className="gap-2 shrink-0">
            <LayoutGrid className="h-4 w-4 hidden sm:block" />
            Tipologias
          </TabsTrigger>
          {isAdminOrGestor && (
            <TabsTrigger value="valores" className="gap-2 shrink-0">
              <DollarSign className="h-4 w-4 hidden sm:block" />
              Valores
            </TabsTrigger>
          )}
          {isPredio && isAdminOrGestor && (
            <TabsTrigger value="boxes" className="gap-2 shrink-0">
              <Home className="h-4 w-4 hidden sm:block" />
              Boxes
            </TabsTrigger>
          )}
          <TabsTrigger value="fachadas" className="gap-2 shrink-0">
            <Image className="h-4 w-4 hidden sm:block" />
            Fachadas
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2 shrink-0">
            <FileText className="h-4 w-4 hidden sm:block" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="midias" className="gap-2 shrink-0">
            <Image className="h-4 w-4 hidden sm:block" />
            Mídias
          </TabsTrigger>
          {isAdminOrGestor && (
            <TabsTrigger value="memorial" className="gap-2 shrink-0">
              <FileText className="h-4 w-4 hidden sm:block" />
              Memorial
            </TabsTrigger>
          )}
          {isAdminOrGestor && (
            <TabsTrigger value="historico" className="gap-2 shrink-0">
              <History className="h-4 w-4 hidden sm:block" />
              Histórico
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="unidades">
          <UnidadesTab empreendimentoId={id!} />
        </TabsContent>

        <TabsContent value="blocos">
          <BlocosTab empreendimentoId={id!} tipoEmpreendimento={empreendimento.tipo} />
        </TabsContent>

        <TabsContent value="tipologias">
          <TipologiasTab empreendimentoId={id!} />
        </TabsContent>

        <TabsContent value="fachadas">
          <FachadasTab empreendimentoId={id!} />
        </TabsContent>

        <TabsContent value="documentos">
          <DocumentosTab empreendimentoId={id!} />
        </TabsContent>

        <TabsContent value="midias">
          <MidiasTab empreendimentoId={id!} />
        </TabsContent>

        {isPredio && isAdminOrGestor && (
          <TabsContent value="boxes">
            <BoxesTab empreendimentoId={id!} />
          </TabsContent>
        )}

        {isAdminOrGestor && (
          <TabsContent value="valores">
            <ValoresTab empreendimentoId={id!} />
          </TabsContent>
        )}


        {isAdminOrGestor && (
          <TabsContent value="memorial">
            <UnidadesMemorialTab empreendimentoId={id!} />
          </TabsContent>
        )}


        {isAdminOrGestor && (
          <TabsContent value="historico">
            <HistoricoEmpreendimentoTab empreendimentoId={id!} />
          </TabsContent>
        )}
      </Tabs>

      <EmpreendimentoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        empreendimento={empreendimento}
      />
    </MainLayout>
  );
}
