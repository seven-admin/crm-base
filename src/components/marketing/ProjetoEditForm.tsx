import { forwardRef, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjetosMarketing } from '@/hooks/useProjetosMarketing';
import { useFuncionariosSeven } from '@/hooks/useFuncionariosSeven';
import { 
  ProjetoMarketing, 
  CategoriaProjeto, 
  PrioridadeProjeto,
  StatusProjeto,
  CATEGORIA_LABELS, 
  PRIORIDADE_LABELS,
  STATUS_LABELS
} from '@/types/marketing.types';
import { User } from 'lucide-react';

interface ProjetoEditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projeto: ProjetoMarketing;
}

export const ProjetoEditForm = forwardRef<HTMLDivElement, ProjetoEditFormProps>(function ProjetoEditForm(
  { open, onOpenChange, projeto },
  ref
) {
  const { data: funcionarios } = useFuncionariosSeven();
  const { updateProjeto } = useProjetosMarketing();

  const [formData, setFormData] = useState({
    titulo: projeto.titulo,
    descricao: projeto.descricao || '',
    briefing_texto: projeto.briefing_texto || '',
    categoria: projeto.categoria,
    prioridade: projeto.prioridade,
    status: projeto.status,
    data_previsao: projeto.data_previsao || '',
    supervisor_id: projeto.supervisor_id || '',
  });

  useEffect(() => {
    if (projeto) {
      setFormData({
        titulo: projeto.titulo,
        descricao: projeto.descricao || '',
        briefing_texto: projeto.briefing_texto || '',
        categoria: projeto.categoria,
        prioridade: projeto.prioridade,
        status: projeto.status,
        data_previsao: projeto.data_previsao || '',
        supervisor_id: projeto.supervisor_id || '',
      });
    }
  }, [projeto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProjeto.mutateAsync({
      id: projeto.id,
      titulo: formData.titulo,
      descricao: formData.descricao || undefined,
      briefing_texto: formData.briefing_texto || undefined,
      categoria: formData.categoria,
      prioridade: formData.prioridade,
      status: formData.status,
      data_previsao: formData.data_previsao || undefined,
      supervisor_id: formData.supervisor_id || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={ref} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Título</label>
            <Input 
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Título do projeto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Select 
                value={formData.categoria} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, categoria: v as CategoriaProjeto }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIA_LABELS) as CategoriaProjeto[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORIA_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as StatusProjeto }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as StatusProjeto[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Prioridade</label>
              <Select 
                value={formData.prioridade} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, prioridade: v as PrioridadeProjeto }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORIDADE_LABELS) as PrioridadeProjeto[]).map((prio) => (
                    <SelectItem key={prio} value={prio}>
                      {PRIORIDADE_LABELS[prio]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Responsável
              </label>
          <Select 
            value={formData.supervisor_id || 'none'} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, supervisor_id: v === 'none' ? '' : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem responsável</SelectItem>
                  {funcionarios?.map((func) => (
                    <SelectItem key={func.id} value={func.id}>
                      {func.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Data de Previsão</label>
              <Input 
                type="date" 
                value={formData.data_previsao}
                onChange={(e) => setFormData(prev => ({ ...prev, data_previsao: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Descrição</label>
            <Textarea 
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição breve do projeto"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Briefing</label>
            <Textarea 
              value={formData.briefing_texto}
              onChange={(e) => setFormData(prev => ({ ...prev, briefing_texto: e.target.value }))}
              placeholder="Detalhes completos do briefing..."
              rows={5}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateProjeto.isPending}>
              {updateProjeto.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

ProjetoEditForm.displayName = 'ProjetoEditForm';
