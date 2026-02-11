import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEventos } from '@/hooks/useEventos';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Evento } from '@/types/marketing.types';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  data_evento: z.string().min(1, 'Data é obrigatória'),
  local: z.string().optional(),
  empreendimento_id: z.string().optional(),
  responsavel_id: z.string().optional(),
  orcamento: z.coerce.number().optional(),
  status: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EventoEditDialogProps {
  evento: Evento;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS = [
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'preparacao', label: 'Preparação' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function EventoEditDialog({ evento, open, onOpenChange }: EventoEditDialogProps) {
  const { updateEvento } = useEventos();
  const { data: empreendimentos } = useEmpreendimentos();

  // Buscar usuários
  const { data: usuarios } = useQuery({
    queryKey: ['profiles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: evento.nome,
      descricao: evento.descricao || '',
      data_evento: evento.data_evento,
      local: evento.local || '',
      empreendimento_id: evento.empreendimento_id || '',
      responsavel_id: evento.responsavel_id || '',
      orcamento: evento.orcamento || undefined,
      status: evento.status || 'planejamento',
    },
  });

  // Atualizar form quando evento mudar
  useEffect(() => {
    form.reset({
      nome: evento.nome,
      descricao: evento.descricao || '',
      data_evento: evento.data_evento,
      local: evento.local || '',
      empreendimento_id: evento.empreendimento_id || '',
      responsavel_id: evento.responsavel_id || '',
      orcamento: evento.orcamento || undefined,
      status: evento.status || 'planejamento',
    });
  }, [evento, form]);

  const onSubmit = async (data: FormData) => {
    await updateEvento.mutateAsync({
      id: evento.id,
      nome: data.nome,
      descricao: data.descricao,
      data_evento: data.data_evento,
      local: data.local,
      orcamento: data.orcamento,
      empreendimento_id: data.empreendimento_id || null,
      responsavel_id: data.responsavel_id || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
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
                    <Input {...field} placeholder="Ex: Feirão de Vendas" />
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
                    <Textarea {...field} placeholder="Descreva o evento..." rows={3} />
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
                    <FormLabel>Data do Evento *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Input {...field} placeholder="Onde será o evento?" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="empreendimento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empreendimento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {empreendimentos?.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {usuarios?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="orcamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orçamento (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      placeholder="0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateEvento.isPending}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
