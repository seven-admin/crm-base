import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Blocks } from 'lucide-react';
import { TipTapEditor } from '@/components/nexa/contratos/TipTapEditor';
import { useContratoBlocos, useSaveContratoBloco, useDeleteContratoBloco, CATEGORIAS_BLOCO, type ContratoBloco } from '@/hooks/useNexaContratoBlocos';

export default function NexaContratosBlocos() {
  const { data: blocos = [], isLoading } = useContratoBlocos();
  const save = useSaveContratoBloco();
  const del = useDeleteContratoBloco();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContratoBloco | null>(null);
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<string>('geral');
  const [descricao, setDescricao] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [isActive, setIsActive] = useState(true);

  const filtered = useMemo(() => {
    if (categoriaFilter === 'todas') return blocos;
    return blocos.filter((b) => b.categoria === categoriaFilter);
  }, [blocos, categoriaFilter]);

  const grupos = useMemo(() => {
    const map = new Map<string, ContratoBloco[]>();
    filtered.forEach((b) => {
      if (!map.has(b.categoria)) map.set(b.categoria, []);
      map.get(b.categoria)!.push(b);
    });
    return Array.from(map.entries()).sort();
  }, [filtered]);

  const openNew = () => {
    setEditing(null);
    setNome(''); setCategoria('geral'); setDescricao(''); setConteudo(''); setIsActive(true);
    setOpen(true);
  };

  const openEdit = (b: ContratoBloco) => {
    setEditing(b);
    setNome(b.nome); setCategoria(b.categoria); setDescricao(b.descricao || '');
    setConteudo(b.conteudo_html); setIsActive(b.is_active);
    setOpen(true);
  };

  const handleSave = async () => {
    await save.mutateAsync({
      id: editing?.id,
      nome, categoria, descricao,
      conteudo_html: conteudo,
      is_active: isActive,
    });
    setOpen(false);
  };

  return (
    <MainLayout
      title="Blocos de texto"
      subtitle="Biblioteca de cláusulas reutilizáveis para os contratos."
      actions={
        <div className="flex gap-2 items-center">
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas categorias</SelectItem>
              {CATEGORIAS_BLOCO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo bloco</Button>
        </div>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : grupos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Blocks className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Nenhum bloco cadastrado.
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {grupos.map(([cat, items]) => (
            <div key={cat}>
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-primary">{cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((b) => (
                  <Card key={b.id} className={`shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card ${!b.is_active ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="font-medium">{b.nome}</div>
                          {b.descricao && <p className="text-xs text-muted-foreground mt-0.5">{b.descricao}</p>}
                        </div>
                        {!b.is_active && <Badge variant="outline">inativo</Badge>}
                      </div>
                      <div
                        className="line-clamp-3 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: b.conteudo_html }}
                      />
                      <div className="flex justify-end gap-1 mt-3">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir bloco?</AlertDialogTitle>
                              <AlertDialogDescription>"{b.nome}" será removido permanentemente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => del.mutate(b.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar bloco' : 'Novo bloco de texto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Cláusula de rescisão padrão" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_BLOCO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Conteúdo</Label>
              <TipTapEditor value={conteudo} onChange={setConteudo} placeholder="Digite o texto do bloco…" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={save.isPending || !nome.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
