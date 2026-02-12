import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Calendar, MapPin, MoreHorizontal, Trash2 } from 'lucide-react';
import { useEventos } from '@/hooks/useEventos';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SelecionarTemplateDialog } from '@/components/eventos/SelecionarTemplateDialog';
import { EventoTemplate } from '@/hooks/useEventoTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  planejamento: 'Planejamento',
  preparacao: 'Preparação',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  planejamento: 'bg-blue-500/10 text-blue-500',
  preparacao: 'bg-yellow-500/10 text-yellow-500',
  em_andamento: 'bg-green-500/10 text-green-500',
  concluido: 'bg-gray-500/10 text-gray-500',
  cancelado: 'bg-red-500/10 text-red-500',
};

const formSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  data_evento: z.string().min(1, 'Data é obrigatória'),
  data_fim: z.string().optional(),
  local: z.string().optional(),
  orcamento: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Eventos() {
  const [showForm, setShowForm] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EventoTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { eventos, isLoading, createEvento, deleteEvento } = useEventos();

  const handleExcluirEvento = async (eventoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
      await deleteEvento.mutateAsync(eventoId);
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      data_evento: '',
      data_fim: '',
      local: '',
      orcamento: '',
    }
  });

  const eventosFiltrados = eventos?.filter(e =>
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNovoEvento = () => {
    setShowTemplateDialog(true);
  };

  const handleSelectTemplate = (template: EventoTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateDialog(false);
    
    // Pré-preencher o formulário com dados do template
    const hoje = new Date();
    const dataFim = addDays(hoje, template.duracao_dias);
    
    form.reset({
      nome: '',
      descricao: template.descricao || '',
      data_evento: format(hoje, 'yyyy-MM-dd'),
      data_fim: format(dataFim, 'yyyy-MM-dd'),
      local: template.local_padrao || '',
      orcamento: template.orcamento_padrao?.toString() || '',
    });
    
    setShowForm(true);
  };

  const handleSkipTemplate = () => {
    setSelectedTemplate(null);
    setShowTemplateDialog(false);
    form.reset();
    setShowForm(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const novoEvento = await createEvento.mutateAsync({
        nome: data.nome,
        descricao: data.descricao,
        data_evento: data.data_evento,
        local: data.local,
        orcamento: data.orcamento ? parseFloat(data.orcamento) : undefined,
      });

      // Se usou template, criar as tarefas predefinidas
      if (selectedTemplate && selectedTemplate.tarefas && novoEvento) {
        const dataEvento = new Date(data.data_evento);
        
        for (const tarefaTemplate of selectedTemplate.tarefas) {
          const dataTarefa = addDays(dataEvento, tarefaTemplate.dias_antes_evento);
          
          await supabase.from('evento_tarefas').insert({
            evento_id: novoEvento.id,
            titulo: tarefaTemplate.titulo,
            descricao: tarefaTemplate.descricao,
            data_inicio: dataTarefa.toISOString(),
            data_fim: addDays(dataTarefa, Math.ceil(tarefaTemplate.duracao_horas / 24)).toISOString(),
            status: 'pendente',
          });
        }
        
        toast.success(`Evento criado com ${selectedTemplate.tarefas.length} tarefas do template!`);
      }

      setShowForm(false);
      setSelectedTemplate(null);
      form.reset();
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <MainLayout 
      title="Eventos"
      subtitle="Gerencie eventos e ações de relacionamento"
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button onClick={handleNovoEvento} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {/* Events */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : eventosFiltrados?.length === 0 ? (
        <Card className="p-8 md:p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Nenhum evento encontrado</h3>
          <p className="text-muted-foreground mb-4">Comece criando seu primeiro evento.</p>
          <Button onClick={handleNovoEvento}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {eventosFiltrados?.map((evento) => (
              <Card 
                key={evento.id} 
                className="p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/eventos/${evento.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {evento.codigo}
                      </span>
                      <Badge className={STATUS_COLORS[evento.status || 'planejamento']}>
                        {STATUS_LABELS[evento.status || 'planejamento']}
                      </Badge>
                    </div>
                    <p className="font-medium">{evento.nome}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(evento.data_evento), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/eventos/${evento.id}`);
                      }}>
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => handleExcluirEvento(evento.id, e)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {(evento.local || evento.orcamento) && (
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    {evento.local && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[150px]">{evento.local}</span>
                      </div>
                    )}
                    {evento.orcamento && (
                      <span className="font-medium text-foreground">
                        {formatCurrency(evento.orcamento)}
                      </span>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="hidden lg:table-cell">Local</TableHead>
                  <TableHead className="hidden lg:table-cell">Orçamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventosFiltrados?.map((evento) => (
                  <TableRow 
                    key={evento.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/eventos/${evento.id}`)}
                  >
                    <TableCell>
                      <span className="font-mono text-sm text-muted-foreground">
                        {evento.codigo}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{evento.nome}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(evento.data_evento), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {evento.local ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{evento.local}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {evento.orcamento ? (
                        <span className="font-medium">
                          {formatCurrency(evento.orcamento)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[evento.status || 'planejamento']}>
                        {STATUS_LABELS[evento.status || 'planejamento']}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/eventos/${evento.id}`);
                          }}>
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleExcluirEvento(evento.id, e)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
        </>
      )}

      {/* Dialog Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Evento *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Lançamento Residencial Aurora" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data_evento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orcamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orçamento</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="local"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço do evento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detalhes do evento..."
                        className="resize-none"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createEvento.isPending}>
                  {createEvento.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Evento
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para selecionar template */}
      <SelecionarTemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSelectTemplate={handleSelectTemplate}
        onSkip={handleSkipTemplate}
      />
    </MainLayout>
  );
}
