import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { PlanejamentoFase, PlanejamentoStatus } from '@/types/planejamento.types';

interface Props {
  date: Date;
  fases: PlanejamentoFase[];
  statusList: PlanejamentoStatus[];
  responsaveis: { id: string; full_name: string }[];
  onSubmit: (data: {
    item: string;
    fase_id: string;
    status_id: string;
    data_inicio: string;
    data_fim: string;
    responsavel_tecnico_id?: string;
    obs?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CalendarioCriarTarefaPopover({
  date,
  fases,
  statusList,
  responsaveis,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const [item, setItem] = useState('');
  const [faseId, setFaseId] = useState('');
  const [statusId, setStatusId] = useState(statusList?.[0]?.id || '');
  const [dataFim, setDataFim] = useState<Date>(date);
  const [showMore, setShowMore] = useState(false);
  const [responsavelId, setResponsavelId] = useState('');
  const [obs, setObs] = useState('');
  const [dataFimOpen, setDataFimOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim() || !faseId || !statusId) return;

    onSubmit({
      item: item.trim(),
      fase_id: faseId,
      status_id: statusId,
      data_inicio: format(date, 'yyyy-MM-dd'),
      data_fim: format(dataFim, 'yyyy-MM-dd'),
      responsavel_tecnico_id: responsavelId || undefined,
      obs: obs.trim() || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const sortedFases = [...(fases || [])].sort((a, b) => a.nome.localeCompare(b.nome));
  const sortedStatus = [...(statusList || [])].sort((a, b) => a.nome.localeCompare(b.nome));
  const sortedResponsaveis = [...(responsaveis || [])].sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
        <Plus className="h-4 w-4" />
        Nova tarefa — {format(date, "d 'de' MMMM", { locale: ptBR })}
      </div>

      <div>
        <Input
          autoFocus
          placeholder="Nome da tarefa..."
          value={item}
          onChange={(e) => setItem(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Fase</Label>
          <Select value={faseId} onValueChange={setFaseId}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {sortedFases.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: f.cor }} />
                    {f.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Data fim</Label>
          <Popover open={dataFimOpen} onOpenChange={setDataFimOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full text-xs h-8 justify-start font-normal">
                {format(dataFim, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataFim}
                onSelect={(d) => {
                  if (d) {
                    setDataFim(d);
                    setDataFimOpen(false);
                  }
                }}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showMore ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {showMore ? 'Menos campos' : 'Mais campos'}
      </button>

      {showMore && (
        <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-1">
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={statusId} onValueChange={setStatusId}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {sortedStatus.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.cor }} />
                      {s.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                {sortedResponsaveis.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="text-xs min-h-[60px]"
              placeholder="Observações..."
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-xs h-7">
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          className="text-xs h-7"
          disabled={!item.trim() || !faseId || !statusId || isSubmitting}
        >
          {isSubmitting ? 'Criando...' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
