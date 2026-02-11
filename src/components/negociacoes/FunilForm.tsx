import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useCreateFunil, useUpdateFunil } from '@/hooks/useFunis';
import type { Funil } from '@/types/funis.types';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  empreendimento_id: z.string().nullable().optional(),
  is_default: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface FunilFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funil?: Funil | null;
}

export function FunilForm({ open, onOpenChange, funil }: FunilFormProps) {
  const { data: empreendimentos } = useEmpreendimentos();
  const createMutation = useCreateFunil();
  const updateMutation = useUpdateFunil();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      empreendimento_id: null,
      is_default: false,
    },
  });

  useEffect(() => {
    if (funil) {
      form.reset({
        nome: funil.nome,
        descricao: funil.descricao || '',
        empreendimento_id: funil.empreendimento_id,
        is_default: funil.is_default,
      });
    } else {
      form.reset({
        nome: '',
        descricao: '',
        empreendimento_id: null,
        is_default: false,
      });
    }
  }, [funil, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (funil) {
        await updateMutation.mutateAsync({ id: funil.id, data: values });
      } else {
        await createMutation.mutateAsync({
          nome: values.nome,
          descricao: values.descricao,
          empreendimento_id: values.empreendimento_id,
          is_default: values.is_default,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {funil ? 'Editar Funil' : 'Novo Funil'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Funil de Lançamento" {...field} />
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
                      placeholder="Descrição opcional do funil"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="empreendimento_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empreendimento (opcional)</FormLabel>
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Funil global" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Funil global (todos)</SelectItem>
                      {empreendimentos?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Deixe vazio para usar em todos os empreendimentos
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Funil Padrão</FormLabel>
                    <FormDescription>
                      Usar este funil como padrão para novos negócios
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : funil ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}