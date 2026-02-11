import { useState } from 'react';
import { Plus, Copy, Trash2, Edit2, MoreVertical, Star, Building2, ShieldAlert } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useFunis, useFunilEtapas, useDeleteFunil, useDuplicarFunil } from '@/hooks/useFunis';
import { usePermissions } from '@/hooks/usePermissions';
import { FunilForm } from '@/components/negociacoes/FunilForm';
import { EtapasEditor } from '@/components/negociacoes/EtapasEditor';
import type { Funil } from '@/types/funis.types';

export default function ConfiguracaoFunis() {
  const { data: funis = [], isLoading } = useFunis();
  const deleteMutation = useDeleteFunil();
  const duplicarMutation = useDuplicarFunil();
  const { isSuperAdmin, isLoading: permissionsLoading } = usePermissions();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedFunil, setSelectedFunil] = useState<Funil | null>(null);
  const [editingFunil, setEditingFunil] = useState<Funil | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Funil | null>(null);

  const handleEdit = (funil: Funil) => {
    setEditingFunil(funil);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingFunil(null);
    setFormOpen(true);
  };

  const handleDuplicate = async (funil: Funil) => {
    await duplicarMutation.mutateAsync(funil.id);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      if (selectedFunil?.id === deleteConfirm.id) {
        setSelectedFunil(null);
      }
      setDeleteConfirm(null);
    }
  };

  // Aguarda carregamento das permissões
  if (permissionsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  // Verifica se é Super Admin
  if (!isSuperAdmin()) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground max-w-md">
            Esta funcionalidade está disponível apenas para Super Administradores.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Configuração de Negociações" subtitle="Gerencie o pipeline e as etapas das negociações">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pipeline
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Pipelines */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pipelines</h2>

            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </CardContent>
              </Card>
            ) : funis.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Nenhum pipeline configurado
                  </p>
                  <Button variant="outline" onClick={handleNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Pipeline
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {funis.map((funil) => (
                  <FunilCard
                    key={funil.id}
                    funil={funil}
                    isSelected={selectedFunil?.id === funil.id}
                    onSelect={() => setSelectedFunil(funil)}
                    onEdit={() => handleEdit(funil)}
                    onDuplicate={() => handleDuplicate(funil)}
                    onDelete={() => setDeleteConfirm(funil)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Editor de Etapas */}
          <div className="lg:col-span-2">
            {selectedFunil ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedFunil.nome}</h2>
                    {selectedFunil.descricao && (
                      <p className="text-sm text-muted-foreground">
                        {selectedFunil.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedFunil.is_default && (
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    )}
                    {selectedFunil.empreendimento && (
                      <Badge variant="outline">
                        <Building2 className="h-3 w-3 mr-1" />
                        {selectedFunil.empreendimento.nome}
                      </Badge>
                    )}
                  </div>
                </div>

                <EtapasEditor funilId={selectedFunil.id} />
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-muted-foreground">
                    Selecione um pipeline para editar suas etapas
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <FunilForm
        open={formOpen}
        onOpenChange={setFormOpen}
        funil={editingFunil}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pipeline</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pipeline "{deleteConfirm?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

// Componente do Card do Funil
interface FunilCardProps {
  funil: Funil;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function FunilCard({
  funil,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: FunilCardProps) {
  const { data: etapas = [] } = useFunilEtapas(funil.id);

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {funil.nome}
              {funil.is_default && (
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              )}
            </CardTitle>
            {funil.empreendimento && (
              <CardDescription className="text-xs">
                {funil.empreendimento.nome}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
                disabled={funil.is_default}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {/* Preview das etapas */}
        <div className="flex items-center gap-1">
          {etapas.slice(0, 6).map((etapa) => (
            <div
              key={etapa.id}
              className="h-2 flex-1 rounded-full"
              style={{ backgroundColor: etapa.cor }}
              title={etapa.nome}
            />
          ))}
          {etapas.length > 6 && (
            <span className="text-xs text-muted-foreground">+{etapas.length - 6}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {etapas.length} {etapas.length === 1 ? 'etapa' : 'etapas'}
        </p>
      </CardContent>
    </Card>
  );
}
