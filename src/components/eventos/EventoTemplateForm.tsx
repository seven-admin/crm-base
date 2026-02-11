import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { EventoTemplate, EventoTemplateTarefa } from '@/hooks/useEventoTemplates';

interface EventoTemplateFormProps {
  template?: EventoTemplate | null;
  onSubmit: (data: {
    nome: string;
    descricao?: string;
    duracao_dias?: number;
    orcamento_padrao?: number;
    local_padrao?: string;
    tarefas: Array<{
      id?: string;
      titulo: string;
      descricao?: string;
      dias_antes_evento: number;
      duracao_horas?: number;
      ordem: number;
    }>;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EventoTemplateForm({ template, onSubmit, onCancel, isLoading }: EventoTemplateFormProps) {
  const [nome, setNome] = useState(template?.nome || '');
  const [descricao, setDescricao] = useState(template?.descricao || '');
  const [duracaoPadrao, setDuracaoPadrao] = useState(template?.duracao_dias || 1);
  const [orcamentoPadrao, setOrcamentoPadrao] = useState(template?.orcamento_padrao || 0);
  const [localPadrao, setLocalPadrao] = useState(template?.local_padrao || '');
  const [tarefas, setTarefas] = useState<Array<{
    id?: string;
    titulo: string;
    descricao?: string;
    dias_antes_evento: number;
    duracao_horas?: number;
    ordem: number;
    _tempId?: string;
  }>>(
    template?.tarefas?.map((t, idx) => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao || '',
      dias_antes_evento: t.dias_antes_evento,
      duracao_horas: t.duracao_horas || undefined,
      ordem: t.ordem || idx,
    })) || []
  );

  const handleAddTarefa = () => {
    setTarefas([
      ...tarefas,
      {
        _tempId: crypto.randomUUID(),
        titulo: '',
        descricao: '',
        dias_antes_evento: 7,
        duracao_horas: 2,
        ordem: tarefas.length,
      },
    ]);
  };

  const handleRemoveTarefa = (index: number) => {
    setTarefas(tarefas.filter((_, i) => i !== index));
  };

  const handleTarefaChange = (index: number, field: string, value: string | number) => {
    setTarefas(tarefas.map((t, i) => 
      i === index ? { ...t, [field]: value } : t
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nome,
      descricao: descricao || undefined,
      duracao_dias: duracaoPadrao,
      orcamento_padrao: orcamentoPadrao || undefined,
      local_padrao: localPadrao || undefined,
      tarefas: tarefas.filter(t => t.titulo.trim()).map((t, idx) => ({
        id: t.id,
        titulo: t.titulo,
        descricao: t.descricao,
        dias_antes_evento: t.dias_antes_evento,
        duracao_horas: t.duracao_horas,
        ordem: t.ordem ?? idx,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nome">Nome do Template *</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Evento de Lançamento"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição do template..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duracao">Duração Padrão (dias)</Label>
          <Input
            id="duracao"
            type="number"
            min={1}
            value={duracaoPadrao}
            onChange={(e) => setDuracaoPadrao(parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="orcamento">Orçamento Padrão (R$)</Label>
          <Input
            id="orcamento"
            type="number"
            min={0}
            step={0.01}
            value={orcamentoPadrao}
            onChange={(e) => setOrcamentoPadrao(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="local">Local Padrão</Label>
          <Input
            id="local"
            value={localPadrao}
            onChange={(e) => setLocalPadrao(e.target.value)}
            placeholder="Ex: Stand de Vendas"
          />
        </div>
      </div>

      {/* Tarefas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Tarefas do Template</h4>
          <Button type="button" variant="outline" size="sm" onClick={handleAddTarefa}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tarefa
          </Button>
        </div>

        {tarefas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
            Nenhuma tarefa adicionada. Clique em "Adicionar Tarefa" para criar.
          </p>
        ) : (
          <div className="space-y-3">
            {tarefas.map((tarefa, index) => (
              <Card key={tarefa.id || tarefa._tempId} className="relative">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-5">
                        <Input
                          placeholder="Título da tarefa *"
                          value={tarefa.titulo}
                          onChange={(e) => handleTarefaChange(index, 'titulo', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Input
                          placeholder="Descrição"
                          value={tarefa.descricao || ''}
                          onChange={(e) => handleTarefaChange(index, 'descricao', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            value={tarefa.dias_antes_evento}
                            onChange={(e) => handleTarefaChange(index, 'dias_antes_evento', parseInt(e.target.value) || 0)}
                            className="w-full"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">dias antes</span>
                        </div>
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          value={tarefa.duracao_horas || ''}
                          onChange={(e) => handleTarefaChange(index, 'duracao_horas', parseFloat(e.target.value) || 0)}
                          placeholder="Horas"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTarefa(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !nome.trim()}>
          {isLoading ? 'Salvando...' : template ? 'Atualizar' : 'Criar Template'}
        </Button>
      </div>
    </form>
  );
}
