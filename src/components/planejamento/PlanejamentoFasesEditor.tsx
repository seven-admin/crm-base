import { useState } from 'react';
import { Plus, GripVertical, Pencil, Trash2, Check, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { cn } from '@/lib/utils';

const CORES_DISPONIVEIS = [
  '#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899',
  '#06B6D4', '#EF4444', '#10B981', '#6366F1', '#F97316'
];

export function PlanejamentoFasesEditor() {
  const [selectedEmpreendimentoId, setSelectedEmpreendimentoId] = useState<string>('global');
  const empreendimentoId = selectedEmpreendimentoId === 'global' ? undefined : selectedEmpreendimentoId;

  const { fases, isLoading, createFase, updateFase, deleteFase } = usePlanejamentoFases(empreendimentoId);
  const { data: empreendimentos } = useEmpreendimentosSelect();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ nome: '', cor: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [newFase, setNewFase] = useState({ nome: '', cor: CORES_DISPONIVEIS[0] });

  const isGlobalContext = selectedEmpreendimentoId === 'global';

  const canEditFase = (fase: { empreendimento_id?: string | null }) => {
    if (isGlobalContext) return !fase.empreendimento_id;
    return !!fase.empreendimento_id;
  };

  const handleEdit = (fase: { id: string; nome: string; cor: string; empreendimento_id?: string | null }) => {
    if (!canEditFase(fase)) return;
    setEditingId(fase.id);
    setEditValue({ nome: fase.nome, cor: fase.cor });
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.nome.trim()) {
      updateFase.mutate({ id: editingId, nome: editValue.nome, cor: editValue.cor });
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue({ nome: '', cor: '' });
  };

  const handleAdd = () => {
    if (newFase.nome.trim()) {
      const nextOrdem = (fases?.length || 0) + 1;
      createFase.mutate({
        nome: newFase.nome,
        cor: newFase.cor,
        ordem: nextOrdem,
        empreendimento_id: empreendimentoId || null,
      });
      setNewFase({ nome: '', cor: CORES_DISPONIVEIS[0] });
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta fase?')) {
      deleteFase.mutate(id);
    }
  };

  const selectedEmpreendimentoNome = empreendimentos?.find(e => e.id === selectedEmpreendimentoId)?.nome;

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader className="pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Fases do Planejamento</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-1" /> Nova Fase
          </Button>
        </div>
        <Select value={selectedEmpreendimentoId} onValueChange={setSelectedEmpreendimentoId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o escopo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Global (todos)
              </span>
            </SelectItem>
            {empreendimentos?.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-2">
        {fases?.map((fase) => {
          const isGlobal = !fase.empreendimento_id;
          const editable = canEditFase(fase);

          return (
            <div
              key={fase.id}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg border transition-colors',
                editable ? 'bg-card hover:bg-muted/50' : 'bg-muted/30 opacity-60'
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: fase.cor }}
              />

              {editingId === fase.id ? (
                <>
                  <Input
                    value={editValue.nome}
                    onChange={(e) => setEditValue({ ...editValue, nome: e.target.value })}
                    className="flex-1 h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <div className="flex gap-1">
                    {CORES_DISPONIVEIS.map((cor) => (
                      <button
                        key={cor}
                        className={cn(
                          'w-5 h-5 rounded-full transition-all',
                          editValue.cor === cor && 'ring-2 ring-offset-2 ring-primary'
                        )}
                        style={{ backgroundColor: cor }}
                        onClick={() => setEditValue({ ...editValue, cor })}
                      />
                    ))}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium flex items-center gap-2">
                    {fase.nome}
                    {!isGlobalContext && isGlobal && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground">
                        Global
                      </Badge>
                    )}
                  </span>
                  {editable && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEdit({ id: fase.id, nome: fase.nome, cor: fase.cor, empreendimento_id: fase.empreendimento_id })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(fase.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}

        {isAdding && (
          <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed bg-muted/30">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: newFase.cor }}
            />
            <Input
              value={newFase.nome}
              onChange={(e) => setNewFase({ ...newFase, nome: e.target.value })}
              placeholder="Nome da fase..."
              className="flex-1 h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <div className="flex gap-1">
              {CORES_DISPONIVEIS.slice(0, 5).map((cor) => (
                <button
                  key={cor}
                  className={cn(
                    'w-5 h-5 rounded-full transition-all',
                    newFase.cor === cor && 'ring-2 ring-offset-2 ring-primary'
                  )}
                  style={{ backgroundColor: cor }}
                  onClick={() => setNewFase({ ...newFase, cor })}
                />
              ))}
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!newFase.nome.trim()}>
              Adicionar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
          </div>
        )}

        {(!fases || fases.length === 0) && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isGlobalContext
              ? 'Nenhuma fase global cadastrada. Clique em "Nova Fase" para começar.'
              : `Nenhuma fase para ${selectedEmpreendimentoNome || 'este empreendimento'}. As fases globais são herdadas automaticamente.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
