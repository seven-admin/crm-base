import { useState } from 'react';
import { Edit, Trash2, Copy, Eye, MoreHorizontal, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { ContratoTemplate } from '@/types/contratos.types';

interface TemplatesTableProps {
  templates: ContratoTemplate[];
  isLoading: boolean;
  onEdit: (template: ContratoTemplate) => void;
  onPreview: (template: ContratoTemplate) => void;
  onDelete: (id: string) => void;
  onDuplicate: (template: ContratoTemplate) => void;
}

export function TemplatesTable({
  templates,
  isLoading,
  onEdit,
  onPreview,
  onDelete,
  onDuplicate,
}: TemplatesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ContratoTemplate | null>(null);

  const handleDeleteClick = (template: ContratoTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      onDelete(templateToDelete.id);
      toast.success('Template excluído com sucesso');
    }
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const countVariables = (content: string) => {
    const matches = content.match(/\{\{[^}]+\}\}/g);
    return matches ? matches.length : 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum template cadastrado</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Crie seu primeiro template de contrato para começar a gerar contratos automaticamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Empreendimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Variáveis</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow 
                key={template.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onEdit(template)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{template.nome}</p>
                    {template.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {template.descricao}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {template.empreendimento?.nome || 'Global'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">
                    {countVariables(template.conteudo_html)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPreview(template)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(template)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.nome}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
