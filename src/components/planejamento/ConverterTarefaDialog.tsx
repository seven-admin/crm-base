import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';
import { ATIVIDADE_TIPO_LABELS, ATIVIDADE_CATEGORIA_LABELS, TIPOS_FORECAST, TIPOS_DIARIO } from '@/types/atividades.types';
import { useGestorEmpreendimento } from '@/hooks/useGestorEmpreendimento';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PlanejamentoItemWithRelations;
  empreendimentoId: string;
}

export function ConverterTarefaDialog({ open, onOpenChange, item, empreendimentoId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: gestorEmpreendimento } = useGestorEmpreendimento(empreendimentoId);
  const [tab, setTab] = useState<'forecast' | 'diario' | 'marketing'>('forecast');
  const [saving, setSaving] = useState(false);

  // Forecast fields
  const [tituloForecast, setTituloForecast] = useState(item.item);
  const [tipoForecast, setTipoForecast] = useState('atendimento');

  // Diário de Bordo fields
  const [tituloDiario, setTituloDiario] = useState(item.item);
  const [tipoDiario, setTipoDiario] = useState('ligacao');
  const [categoriaDiario, setCategoriaDiario] = useState('seven');

  // Marketing fields
  const [tituloMkt, setTituloMkt] = useState(item.item);
  const [categoriaMkt, setCategoriaMkt] = useState('');

  const handleSaveAtividade = async (tipo: string, titulo: string, categoria: string) => {
    if (!titulo.trim()) { toast.error('Título é obrigatório'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('atividades').insert({
        titulo,
        tipo,
        categoria,
        empreendimento_id: empreendimentoId,
        data_inicio: item.data_inicio || format(new Date(), 'yyyy-MM-dd'),
        data_fim: item.data_fim || format(new Date(), 'yyyy-MM-dd'),
        gestor_id: gestorEmpreendimento || user?.id,
        status: 'pendente',
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      toast.success('Atividade criada com sucesso!');
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Erro ao criar atividade: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveForecast = () => handleSaveAtividade(tipoForecast, tituloForecast, 'cliente');
  const handleSaveDiario = () => handleSaveAtividade(tipoDiario, tituloDiario, categoriaDiario);

  const handleSaveMarketing = async () => {
    if (!tituloMkt.trim()) { toast.error('Título é obrigatório'); return; }
    if (!categoriaMkt) { toast.error('Selecione a categoria'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('projetos_marketing').insert({
        titulo: tituloMkt,
        categoria: categoriaMkt,
        empreendimento_id: empreendimentoId,
        status: 'briefing',
        data_solicitacao: format(new Date(), 'yyyy-MM-dd'),
        created_by: user?.id,
        is_interno: true,
      } as any);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['projetos-marketing'] });
      toast.success('Ticket de marketing criado com sucesso!');
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Erro ao criar ticket: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const getHandleSave = () => {
    switch (tab) {
      case 'forecast': return handleSaveForecast;
      case 'diario': return handleSaveDiario;
      case 'marketing': return handleSaveMarketing;
    }
  };

  const getButtonLabel = () => {
    switch (tab) {
      case 'forecast': return 'Criar Atividade (Forecast)';
      case 'diario': return 'Criar Atividade (Diário)';
      case 'marketing': return 'Criar Ticket';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Converter Tarefa</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-full">
            <TabsTrigger value="forecast" className="flex-1">Forecast</TabsTrigger>
            <TabsTrigger value="diario" className="flex-1">Diário de Bordo</TabsTrigger>
            <TabsTrigger value="marketing" className="flex-1">Marketing</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={tituloForecast} onChange={(e) => setTituloForecast(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipoForecast} onValueChange={setTipoForecast}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_FORECAST.map((k) => (
                    <SelectItem key={k} value={k}>{ATIVIDADE_TIPO_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Categoria: Cliente (automático)</p>
            {item.data_inicio && (
              <p className="text-xs text-muted-foreground">
                Datas: {item.data_inicio} → {item.data_fim || item.data_inicio}
              </p>
            )}
          </TabsContent>

          <TabsContent value="diario" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={tituloDiario} onChange={(e) => setTituloDiario(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipoDiario} onValueChange={setTipoDiario}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_DIARIO.map((k) => (
                      <SelectItem key={k} value={k}>{ATIVIDADE_TIPO_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoriaDiario} onValueChange={setCategoriaDiario}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ATIVIDADE_CATEGORIA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {item.data_inicio && (
              <p className="text-xs text-muted-foreground">
                Datas: {item.data_inicio} → {item.data_fim || item.data_inicio}
              </p>
            )}
          </TabsContent>

          <TabsContent value="marketing" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={tituloMkt} onChange={(e) => setTituloMkt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoriaMkt} onValueChange={setCategoriaMkt}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="criacao_campanha">Criação/Campanha</SelectItem>
                  <SelectItem value="video_animacao">Vídeo/Animação</SelectItem>
                  <SelectItem value="render_3d">Render 3D</SelectItem>
                  <SelectItem value="design_grafico">Design Gráfico</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="pedido_orcamento">Pedido de Orçamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={getHandleSave()} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getButtonLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
