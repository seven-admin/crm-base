import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { useEmpreendimento, useDeleteEmpreendimento } from '@/hooks/useEmpreendimentos';
import { EmpreendimentoForm } from '@/components/empreendimentos/EmpreendimentoForm';
import { UnidadesTab } from '@/components/empreendimentos/UnidadesTab';
import { TipologiasTab } from '@/components/empreendimentos/TipologiasTab';
import { DocumentosTab } from '@/components/empreendimentos/DocumentosTab';
import { MidiasTab } from '@/components/empreendimentos/MidiasTab';
import { ConfiguracaoComercialTab } from '@/components/empreendimentos/ConfiguracaoComercialTab';
import { UnidadesValoresTab } from '@/components/empreendimentos/UnidadesValoresTab';
import { UnidadesMemorialTab } from '@/components/empreendimentos/UnidadesMemorialTab';
import { HistoricoEmpreendimentoTab } from '@/components/empreendimentos/HistoricoEmpreendimentoTab';
import { FachadasTab } from '@/components/empreendimentos/FachadasTab';
import { BoxesTab } from '@/components/empreendimentos/BoxesTab';
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
  const { role } = useAuth();

  const isAdminOrGestor = role === 'super_admin' || role === 'admin' || role === 'gestor_produto';
  const canDelete = role === 'super_admin' || role === 'admin';

  const { data: empreendimento, isLoading } = useEmpreendimento(id);
  const isPredio = empreendimento?.tipo === 'predio';
  const deleteEmpreendimento = useDeleteEmpreendimento();

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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
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
      )}
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Unidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUnidades}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">
              {empreendimento.unidades_disponiveis}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VGV Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(empreendimento.valor_total)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VGV Vendido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">
              {formatCurrency(empreendimento.valor_vendido)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="unidades" className="space-y-4">
        <TabsList className={cn(
          "grid w-full lg:w-auto lg:inline-grid",
          isPredio && isAdminOrGestor ? "grid-cols-11" : isAdminOrGestor ? "grid-cols-10" : "grid-cols-6"
        )}>
          <TabsTrigger value="unidades" className="gap-2">
            <Home className="h-4 w-4 hidden sm:block" />
            Unidades
          </TabsTrigger>
          <TabsTrigger value="blocos" className="gap-2">
            <Building2 className="h-4 w-4 hidden sm:block" />
            {empreendimento.tipo === 'loteamento' || empreendimento.tipo === 'condominio' ? 'Quadras' : 'Blocos'}
          </TabsTrigger>
          <TabsTrigger value="tipologias" className="gap-2">
            <LayoutGrid className="h-4 w-4 hidden sm:block" />
            Tipologias
          </TabsTrigger>
          <TabsTrigger value="fachadas" className="gap-2">
            <Image className="h-4 w-4 hidden sm:block" />
            Fachadas
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <FileText className="h-4 w-4 hidden sm:block" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="midias" className="gap-2">
            <Image className="h-4 w-4 hidden sm:block" />
            Mídias
          </TabsTrigger>
          {isPredio && isAdminOrGestor && (
            <TabsTrigger value="boxes" className="gap-2">
              <Home className="h-4 w-4 hidden sm:block" />
              Boxes
            </TabsTrigger>
          )}
          {isAdminOrGestor && (
            <TabsTrigger value="valores" className="gap-2">
              <DollarSign className="h-4 w-4 hidden sm:block" />
              Valores
            </TabsTrigger>
          )}
          {isAdminOrGestor && (
            <TabsTrigger value="memorial" className="gap-2">
              <FileText className="h-4 w-4 hidden sm:block" />
              Memorial
            </TabsTrigger>
          )}
          {isAdminOrGestor && (
            <TabsTrigger value="comercial" className="gap-2">
              <Calculator className="h-4 w-4 hidden sm:block" />
              Comercial
            </TabsTrigger>
          )}
          {isAdminOrGestor && (
            <TabsTrigger value="historico" className="gap-2">
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
            <UnidadesValoresTab empreendimentoId={id!} />
          </TabsContent>
        )}

        {isAdminOrGestor && (
          <TabsContent value="memorial">
            <UnidadesMemorialTab empreendimentoId={id!} />
          </TabsContent>
        )}

        {isAdminOrGestor && (
          <TabsContent value="comercial">
            <ConfiguracaoComercialTab empreendimentoId={id!} />
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
