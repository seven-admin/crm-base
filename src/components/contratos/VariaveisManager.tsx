import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Edit, Trash2, Search, Lock } from 'lucide-react';
import { useContratoVariaveis, useDeleteContratoVariavel, type ContratoVariavel } from '@/hooks/useContratoVariaveis';
import { VariavelForm } from './VariavelForm';

const CATEGORIA_LABELS: Record<string, string> = {
  cliente: 'Cliente',
  empreendimento: 'Empreendimento',
  unidade: 'Unidade',
  contrato: 'Contrato',
  sistema: 'Sistema',
  geral: 'Geral',
};

const CATEGORIA_COLORS: Record<string, string> = {
  cliente: 'bg-blue-100 text-blue-800',
  empreendimento: 'bg-green-100 text-green-800',
  unidade: 'bg-purple-100 text-purple-800',
  contrato: 'bg-amber-100 text-amber-800',
  sistema: 'bg-slate-100 text-slate-800',
  geral: 'bg-gray-100 text-gray-800',
};

export function VariaveisManager() {
  const { data: variaveis = [], isLoading } = useContratoVariaveis();
  const { mutate: deleteVariavel } = useDeleteContratoVariavel();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingVariavel, setEditingVariavel] = useState<ContratoVariavel | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleEdit = (variavel: ContratoVariavel) => {
    setEditingVariavel(variavel);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingVariavel(null);
  };

  const handleDelete = (id: string) => {
    deleteVariavel(id);
  };

  // Group by category
  const categories = [...new Set(variaveis.map(v => v.categoria))];

  const filteredVariaveis = variaveis.filter(v => {
    const matchesSearch = search === '' || 
      v.chave.toLowerCase().includes(search.toLowerCase()) ||
      v.label.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || v.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar variável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('all')}
            >
              Todas
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
              >
                {CATEGORIA_LABELS[cat] || cat}
              </Button>
            ))}
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Variável
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chave</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Exemplo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVariaveis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma variável encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredVariaveis.map((variavel) => (
                  <TableRow key={variavel.id}>
                    <TableCell className="font-mono text-sm">
                      {`{{${variavel.chave}}}`}
                    </TableCell>
                    <TableCell>{variavel.label}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {variavel.exemplo || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={CATEGORIA_COLORS[variavel.categoria] || 'bg-gray-100 text-gray-800'}>
                        {CATEGORIA_LABELS[variavel.categoria] || variavel.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{variavel.tipo}</TableCell>
                    <TableCell>
                      {variavel.is_sistema ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Sistema
                        </Badge>
                      ) : variavel.is_active ? (
                        <Badge variant="default">Ativa</Badge>
                      ) : (
                        <Badge variant="outline">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!variavel.is_sistema && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(variavel)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir variável?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta variável será excluída permanentemente e não poderá ser recuperada.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(variavel.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {formOpen && (
        <VariavelForm
          variavel={editingVariavel}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
