import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, LayoutDashboard, List } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useContratosPaginated, 
  useUpdateContratoStatus, 
  useDeleteContrato,
  useAllContratoTemplates,
  useCreateContratoTemplate,
  useUpdateContratoTemplate,
  useDeleteContratoTemplate,
} from '@/hooks/useContratos';
import { ContratosTable } from '@/components/contratos/ContratosTable';
import { ContratosDashboard } from '@/components/contratos/ContratosDashboard';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { ContratoForm } from '@/components/contratos/ContratoForm';
import { ContratoDetalhe } from '@/components/contratos/ContratoDetalhe';
import { TemplatesTable } from '@/components/contratos/TemplatesTable';
import { TemplateForm } from '@/components/contratos/TemplateForm';
import { TemplatePreview } from '@/components/contratos/TemplatePreview';
import { VariaveisManager } from '@/components/contratos/VariaveisManager';
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
import { toast } from 'sonner';
import type { ContratoStatus, ContratoTemplate, CONTRATO_STATUS_LABELS } from '@/types/contratos.types';

export default function Contratos() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const currentTab = searchParams.get('tab') || 'contratos';
  const { isSuperAdmin, canAccessModule } = usePermissions();

  // Contracts state
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ContratoStatus | 'all'>('all');
  const [selectedContratoId, setSelectedContratoId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('list');

  // Reset selectedContratoId when tab changes or route changes
  useEffect(() => {
    if (currentTab !== 'contratos') {
      setSelectedContratoId(null);
    }
  }, [currentTab, location.pathname, location.search]);

  // Templates state
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContratoTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ContratoTemplate | null>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contratoParaExcluir, setContratoParaExcluir] = useState<string | null>(null);

  // Contracts hooks
  const { data, isLoading, error: contratosError } = useContratosPaginated(
    statusFilter !== 'all' ? { status: statusFilter } : undefined,
    page,
    20
  );
  const contratos = data?.contratos || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  // Show error toast if contracts query fails
  useEffect(() => {
    if (contratosError) {
      console.error('Erro ao carregar contratos:', contratosError);
      toast.error(`Erro ao carregar contratos: ${contratosError.message}`);
    }
  }, [contratosError]);
  
  const { mutate: updateStatus } = useUpdateContratoStatus();
  const deleteContratoMutation = useDeleteContrato();

  // Templates hooks
  const { data: templates = [], isLoading: isLoadingTemplates } = useAllContratoTemplates();
  const { mutate: createTemplate, isPending: isCreatingTemplate } = useCreateContratoTemplate();
  const { mutate: updateTemplate, isPending: isUpdatingTemplate } = useUpdateContratoTemplate();
  const { mutate: deleteTemplate } = useDeleteContratoTemplate();

  const handleUpdateStatus = (id: string, status: ContratoStatus, motivo?: string) => {
    updateStatus({ id, status, motivo_reprovacao: motivo });
  };

  const handleDelete = (id: string) => {
    setContratoParaExcluir(id);
    setDeleteDialogOpen(true);
  };

  const confirmarExclusao = async () => {
    if (!contratoParaExcluir) return;
    try {
      await deleteContratoMutation.mutateAsync(contratoParaExcluir);
      setDeleteDialogOpen(false);
      setContratoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
    }
  };

  // Template handlers
  const handleEditTemplate = (template: ContratoTemplate) => {
    setEditingTemplate(template);
    setTemplateFormOpen(true);
  };

  const handleCloseTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateFormOpen(false);
  };

  const handleSaveTemplate = (templateData: {
    nome: string;
    descricao?: string;
    empreendimento_id?: string;
    conteudo_html: string;
    is_active: boolean;
  }) => {
    if (editingTemplate) {
      updateTemplate(
        { id: editingTemplate.id, data: templateData },
        {
          onSuccess: () => {
            handleCloseTemplateForm();
          },
        }
      );
    } else {
      createTemplate(templateData, {
        onSuccess: (createdTemplate) => {
          toast.success('Template criado! Agora você pode configurar as condições de pagamento.');
          // Keep form open and switch to editing mode with created template
          setEditingTemplate(createdTemplate);
        },
        onError: (error) => {
          toast.error(`Erro ao criar template: ${error.message}`);
        },
      });
    }
  };

  const handleDuplicateTemplate = (template: ContratoTemplate) => {
    createTemplate(
      {
        nome: `${template.nome} (Cópia)`,
        descricao: template.descricao || undefined,
        empreendimento_id: template.empreendimento_id || undefined,
        conteudo_html: template.conteudo_html,
        is_active: false,
      },
      {
        onSuccess: () => {
          toast.success('Template duplicado com sucesso');
        },
      }
    );
  };

  // If viewing a specific contract
  if (selectedContratoId) {
    return (
      <MainLayout title="Contrato" subtitle="Detalhes do contrato">
        <ContratoDetalhe 
          contratoId={selectedContratoId} 
          onBack={() => setSelectedContratoId(null)} 
        />
      </MainLayout>
    );
  }

  // Dynamic title/subtitle based on tab
  const getPageInfo = () => {
    switch (currentTab) {
      case 'templates':
        return { title: 'Templates de Contrato', subtitle: 'Gerencie os modelos de contrato' };
      case 'variaveis':
        return { title: 'Variáveis de Contrato', subtitle: 'Configure as variáveis disponíveis nos templates' };
      default:
        return { title: 'Contratos', subtitle: 'Gerencie contratos e documentação' };
    }
  };

  const { title, subtitle } = getPageInfo();

  // Render Templates tab
  if (currentTab === 'templates') {
    // Check specific permission for templates
    if (!canAccessModule('contratos_templates')) {
      return (
        <MainLayout title={title} subtitle={subtitle}>
          <div className="text-center py-12 text-muted-foreground">
            Você não tem permissão para acessar templates de contrato.
          </div>
        </MainLayout>
      );
    }

    return (
      <MainLayout title={title} subtitle={subtitle}>
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setTemplateFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>

          <TemplatesTable
            templates={templates}
            isLoading={isLoadingTemplates}
            onEdit={handleEditTemplate}
            onPreview={(template) => setPreviewTemplate(template)}
            onDelete={(id) => deleteTemplate(id)}
            onDuplicate={handleDuplicateTemplate}
          />
        </div>

        {templateFormOpen && (
          <TemplateForm
            template={editingTemplate}
            onSave={handleSaveTemplate}
            onCancel={handleCloseTemplateForm}
            isSaving={isCreatingTemplate || isUpdatingTemplate}
            open={templateFormOpen}
          />
        )}

        {previewTemplate && (
          <TemplatePreview
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            open={!!previewTemplate}
          />
        )}
      </MainLayout>
    );
  }

  // Render Variáveis tab
  if (currentTab === 'variaveis') {
    // Check specific permission for variables
    if (!canAccessModule('contratos_variaveis')) {
      return (
        <MainLayout title={title} subtitle={subtitle}>
          <div className="text-center py-12 text-muted-foreground">
            Você não tem permissão para acessar variáveis de contrato.
          </div>
        </MainLayout>
      );
    }

    return (
      <MainLayout title={title} subtitle={subtitle}>
        <VariaveisManager />
      </MainLayout>
    );
  }

  // Render Contratos tab (default)
  return (
    <MainLayout title={title} subtitle={subtitle}>
      <div className="space-y-6">
        {/* View mode toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'dashboard' | 'list')}>
            <TabsList>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3">
            {viewMode === 'list' && (
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value as ContratoStatus | 'all')}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="em_geracao">Em Geração</SelectItem>
                  <SelectItem value="enviado_assinatura">Enviado p/ Assinatura</SelectItem>
                  <SelectItem value="assinado">Assinado</SelectItem>
                  <SelectItem value="enviado_incorporador">Enviado ao Incorporador</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </div>

        {viewMode === 'dashboard' ? (
          <ContratosDashboard 
            onContratoClick={(id) => setSelectedContratoId(id)} 
          />
        ) : (
          <>
            <ContratosTable
              contratos={contratos}
              isLoading={isLoading}
              onView={(id) => setSelectedContratoId(id)}
              onEdit={(id) => setSelectedContratoId(id)}
              onDelete={handleDelete}
              onUpdateStatus={handleUpdateStatus}
              canDelete={isSuperAdmin()}
            />

            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ContratoForm 
        open={formOpen} 
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setPage(1); // Voltar para primeira página após criar contrato
          }
        }} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContratoParaExcluir(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteContratoMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
