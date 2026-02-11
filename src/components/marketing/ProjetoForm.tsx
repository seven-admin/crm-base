import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useProjetosMarketing } from '@/hooks/useProjetosMarketing';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { CATEGORIA_LABELS, PRIORIDADE_LABELS, type CategoriaProjeto, type PrioridadeProjeto } from '@/types/marketing.types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  categoria: z.enum(['render_3d', 'design_grafico', 'video_animacao', 'evento', 'pedido_orcamento']),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  empreendimento_id: z.string().optional(),
  briefing_texto: z.string().optional(),
  data_previsao: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProjetoFormProps {
  onSuccess: () => void;
}

export function ProjetoForm({ onSuccess }: ProjetoFormProps) {
  const { createProjeto } = useProjetosMarketing();
  const { data: empreendimentos } = useEmpreendimentos();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      categoria: 'design_grafico',
      prioridade: 'media',
      briefing_texto: '',
    }
  });

  const onSubmit = async (data: FormData) => {
    await createProjeto.mutateAsync({
      titulo: data.titulo,
      descricao: data.descricao,
      categoria: data.categoria as CategoriaProjeto,
      prioridade: data.prioridade as PrioridadeProjeto,
      empreendimento_id: data.empreendimento_id || undefined,
      briefing_texto: data.briefing_texto,
      data_previsao: data.data_previsao || undefined,
    });
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Projeto *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Render Fachada Bloco A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CATEGORIA_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prioridade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
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
          name="empreendimento_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empreendimento (opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Vincular a um empreendimento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {empreendimentos?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data_previsao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Previsão</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
                  placeholder="Breve descrição do projeto..."
                  className="resize-none"
                  rows={2}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="briefing_texto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Briefing</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detalhes do briefing, requisitos, referências..."
                  className="resize-none"
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={createProjeto.isPending}>
            {createProjeto.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Projeto
          </Button>
        </div>
      </form>
    </Form>
  );
}
