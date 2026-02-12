import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Folder, Building2, Tags, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TipoFluxo } from '@/types/financeiro.types';

interface CategoriaFluxo {
  id: string;
  nome: string;
  tipo: TipoFluxo;
  categoria_pai_id: string | null;
  ordem: number;
  is_active: boolean;
  aprovacao_automatica: boolean;
}

interface CentroCusto {
  id: string;
  nome: string;
  descricao: string | null;
  is_active: boolean;
}

export function FinanceiroConfiguracoes() {
  const [activeTab, setActiveTab] = useState('categorias');
  const [categoriaDialogOpen, setCategoriaDialogOpen] = useState(false);
  const [centroDialogOpen, setCentroDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaFluxo | null>(null);
  const [editingCentro, setEditingCentro] = useState<CentroCusto | null>(null);
  
  const [categoriaForm, setCategoriaForm] = useState({
    nome: '',
    tipo: 'saida' as TipoFluxo,
    categoria_pai_id: '',
    aprovacao_automatica: false
  });
  
  const [centroForm, setCentroForm] = useState({
    nome: '',
    descricao: ''
  });

  const queryClient = useQueryClient();

  // Fetch categorias
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-fluxo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_fluxo')
        .select('*')
        .order('tipo')
        .order('ordem');
      if (error) throw error;
      return data as CategoriaFluxo[];
    }
  });

  // Fetch centros de custo
  const { data: centrosCusto = [] } = useQuery({
    queryKey: ['centros-custo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centros_custo')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as CentroCusto[];
    }
  });

  // Create/Update categoria
  const categoriaMutation = useMutation({
    mutationFn: async (data: Partial<CategoriaFluxo>) => {
      if (editingCategoria) {
        const { error } = await supabase
          .from('categorias_fluxo')
          .update(data)
          .eq('id', editingCategoria.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categorias_fluxo')
          .insert([data as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-fluxo'] });
      setCategoriaDialogOpen(false);
      setEditingCategoria(null);
      setCategoriaForm({ nome: '', tipo: 'saida', categoria_pai_id: '', aprovacao_automatica: false });
      toast.success(editingCategoria ? 'Categoria atualizada' : 'Categoria criada');
    },
    onError: () => {
      toast.error('Erro ao salvar categoria');
    }
  });

  // Create/Update centro de custo
  const centroMutation = useMutation({
    mutationFn: async (data: Partial<CentroCusto>) => {
      if (editingCentro) {
        const { error } = await supabase
          .from('centros_custo')
          .update(data)
          .eq('id', editingCentro.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('centros_custo')
          .insert([data as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros-custo'] });
      setCentroDialogOpen(false);
      setEditingCentro(null);
      setCentroForm({ nome: '', descricao: '' });
      toast.success(editingCentro ? 'Centro de custo atualizado' : 'Centro de custo criado');
    },
    onError: () => {
      toast.error('Erro ao salvar centro de custo');
    }
  });

  // Delete categoria
  const deleteCategoria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categorias_fluxo')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-fluxo'] });
      toast.success('Categoria excluída');
    }
  });

  // Delete centro de custo
  const deleteCentro = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('centros_custo')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centros-custo'] });
      toast.success('Centro de custo excluído');
    }
  });

  const openEditCategoria = (categoria: CategoriaFluxo) => {
    setEditingCategoria(categoria);
    setCategoriaForm({
      nome: categoria.nome,
      tipo: categoria.tipo,
      categoria_pai_id: categoria.categoria_pai_id || '',
      aprovacao_automatica: categoria.aprovacao_automatica || false
    });
    setCategoriaDialogOpen(true);
  };

  const openEditCentro = (centro: CentroCusto) => {
    setEditingCentro(centro);
    setCentroForm({
      nome: centro.nome,
      descricao: centro.descricao || ''
    });
    setCentroDialogOpen(true);
  };

  const handleSaveCategoria = () => {
    categoriaMutation.mutate({
      nome: categoriaForm.nome,
      tipo: categoriaForm.tipo,
      categoria_pai_id: categoriaForm.categoria_pai_id || null,
      ordem: categorias.filter(c => c.tipo === categoriaForm.tipo).length,
      aprovacao_automatica: categoriaForm.aprovacao_automatica
    });
  };

  const handleSaveCentro = () => {
    centroMutation.mutate({
      nome: centroForm.nome,
      descricao: centroForm.descricao || null
    });
  };

  const categoriasEntrada = categorias.filter(c => c.tipo === 'entrada');
  const categoriasSaida = categorias.filter(c => c.tipo === 'saida');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categorias" className="gap-2">
            <Tags className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="centros" className="gap-2">
            <Building2 className="h-4 w-4" />
            Centros de Custo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categorias" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              setEditingCategoria(null);
              setCategoriaForm({ nome: '', tipo: 'saida', categoria_pai_id: '', aprovacao_automatica: false });
              setCategoriaDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categorias de Entrada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Folder className="h-5 w-5" />
                  Categorias de Entrada
                </CardTitle>
                <CardDescription>
                  Classificação para recebimentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoriasEntrada.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma categoria cadastrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categoriasEntrada.map(categoria => (
                      <div 
                        key={categoria.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{categoria.nome}</span>
                          {categoria.aprovacao_automatica && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Auto-aprovação
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditCategoria(categoria)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteCategoria.mutate(categoria.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categorias de Saída */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Folder className="h-5 w-5" />
                  Categorias de Saída
                </CardTitle>
                <CardDescription>
                  Classificação para pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoriasSaida.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma categoria cadastrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categoriasSaida.map(categoria => (
                      <div 
                        key={categoria.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{categoria.nome}</span>
                          {categoria.aprovacao_automatica && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Auto-aprovação
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditCategoria(categoria)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteCategoria.mutate(categoria.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="centros" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Centros de Custo</CardTitle>
                <CardDescription>
                  Gerencie os centros de custo vinculados aos empreendimentos
                </CardDescription>
              </div>
              <Button onClick={() => {
                setEditingCentro(null);
                setCentroForm({ nome: '', descricao: '' });
                setCentroDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Centro
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centrosCusto.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum centro de custo cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    centrosCusto.map(centro => (
                      <TableRow key={centro.id}>
                        <TableCell className="font-medium">{centro.nome}</TableCell>
                        <TableCell>{centro.descricao || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={centro.is_active ? 'default' : 'secondary'}>
                            {centro.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditCentro(centro)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteCentro.mutate(centro.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Categoria */}
      <Dialog open={categoriaDialogOpen} onOpenChange={setCategoriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={categoriaForm.nome}
                onChange={e => setCategoriaForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome da categoria"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={categoriaForm.tipo}
                onValueChange={(value: TipoFluxo) => setCategoriaForm(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-0.5">
                <Label>Aprovação Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Lançamentos nesta categoria serão aprovados automaticamente
                </p>
              </div>
              <Switch
                checked={categoriaForm.aprovacao_automatica}
                onCheckedChange={(checked) => 
                  setCategoriaForm(prev => ({ ...prev, aprovacao_automatica: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoriaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategoria} disabled={!categoriaForm.nome}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Centro de Custo */}
      <Dialog open={centroDialogOpen} onOpenChange={setCentroDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCentro ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={centroForm.nome}
                onChange={e => setCentroForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do centro de custo"
              />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={centroForm.descricao}
                onChange={e => setCentroForm(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do centro de custo"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCentroDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCentro} disabled={!centroForm.nome}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}