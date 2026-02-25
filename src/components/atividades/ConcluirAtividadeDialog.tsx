import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TemperaturaSelector } from './TemperaturaSelector';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useConcluirAtividade } from '@/hooks/useAtividades';
import type { Atividade, ConcluirAtividadeData } from '@/types/atividades.types';
import { type ClienteTemperatura } from '@/types/clientes.types';

// Resultado agora é opcional - aprovação direta
const formSchema = z.object({
  temperatura_cliente: z.enum(['frio', 'morno', 'quente']).optional(),
  requer_followup: z.boolean().default(false),
  data_followup: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConcluirAtividadeDialogProps {
  atividade: Atividade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConcluirAtividadeDialog({
  atividade,
  open,
  onOpenChange,
  onSuccess,
}: ConcluirAtividadeDialogProps) {
  const { mutate: concluir, isPending } = useConcluirAtividade();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      temperatura_cliente: undefined,
      requer_followup: false,
      data_followup: undefined,
    },
  });

  const requerFollowup = form.watch('requer_followup');

  // Reset form quando atividade muda
  useEffect(() => {
    if (atividade && open) {
      form.reset({
        temperatura_cliente: atividade.temperatura_cliente || atividade.cliente?.temperatura || undefined,
        requer_followup: false,
        data_followup: undefined,
      });
    }
  }, [atividade, open, form]);

  if (!atividade) return null;

  const handleSubmit = (values: FormValues) => {
    const data: ConcluirAtividadeData = {
      resultado: 'Atividade concluída', // Resultado padrão automático
      temperatura_cliente: values.temperatura_cliente as ClienteTemperatura | undefined,
      requer_followup: values.requer_followup,
      data_followup: values.data_followup?.toISOString(),
    };

    concluir(
      { id: atividade.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          onSuccess?.();
        },
      }
    );
  };

  // Aprovação direta sem formulário (quando não tem cliente)
  const handleAprovacaoDireta = () => {
    const data: ConcluirAtividadeData = {
      resultado: 'Atividade concluída',
    };

    concluir(
      { id: atividade.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  // Se não tem cliente, mostrar apenas confirmação simples
  const temCliente = !!atividade.cliente_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Concluir Atividade
          </DialogTitle>
          <DialogDescription>
            {temCliente 
              ? `Conclua a atividade "${atividade.titulo}" e opcionalmente atualize a temperatura do cliente.`
              : `Confirma a conclusão de "${atividade.titulo}"?`
            }
          </DialogDescription>
        </DialogHeader>

        {temCliente ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Atualizar Temperatura */}
              <FormField
                control={form.control}
                name="temperatura_cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperatura do Cliente (opcional)</FormLabel>
                    <FormControl>
                      <TemperaturaSelector
                        value={field.value as ClienteTemperatura | undefined}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Follow-up */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="requer_followup"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="text-base">Agendar Follow-up</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Criar lembrete para próximo contato
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {requerFollowup && (
                  <FormField
                    control={form.control}
                    name="data_followup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Follow-up</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecione'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Concluindo...' : 'Concluir'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          // Aprovação direta sem formulário
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAprovacaoDireta} disabled={isPending}>
              {isPending ? 'Concluindo...' : 'Confirmar'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
