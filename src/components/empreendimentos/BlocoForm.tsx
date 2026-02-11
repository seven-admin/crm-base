import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateBloco, useUpdateBloco } from '@/hooks/useBlocos';
import type { Bloco, EmpreendimentoTipo } from '@/types/empreendimentos.types';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  total_andares: z.coerce.number().min(1).optional(),
  unidades_por_andar: z.coerce.number().min(1).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BlocoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  bloco?: Bloco | null;
  tipoEmpreendimento?: EmpreendimentoTipo;
}

export const BlocoForm = React.forwardRef<HTMLDivElement, BlocoFormProps>(
  function BlocoForm({ open, onOpenChange, empreendimentoId, bloco, tipoEmpreendimento }, ref) {
    const createBloco = useCreateBloco();
    const updateBloco = useUpdateBloco();

    const isLoteamento = tipoEmpreendimento === 'loteamento' || tipoEmpreendimento === 'condominio';
    const entityLabel = isLoteamento ? 'Quadra' : 'Bloco';

    const form = useForm<FormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        nome: '',
        total_andares: undefined,
        unidades_por_andar: undefined,
      },
    });

    // Reset form when bloco changes (edit mode or new mode)
    useEffect(() => {
      if (bloco) {
        form.reset({
          nome: bloco.nome || '',
          total_andares: bloco.total_andares || undefined,
          unidades_por_andar: bloco.unidades_por_andar || undefined,
        });
      } else {
        form.reset({
          nome: '',
          total_andares: undefined,
          unidades_por_andar: undefined,
        });
      }
    }, [bloco?.id, form]);

    const onSubmit = (data: FormData) => {
      const formData = {
        nome: data.nome,
        total_andares: isLoteamento ? undefined : data.total_andares,
        unidades_por_andar: isLoteamento ? data.unidades_por_andar : data.unidades_por_andar,
      };

      if (bloco) {
        updateBloco.mutate(
          { id: bloco.id, empreendimentoId, data: formData },
          { onSuccess: () => { onOpenChange(false); form.reset(); } }
        );
      } else {
        createBloco.mutate(
          { empreendimentoId, data: formData },
          { onSuccess: () => { onOpenChange(false); form.reset(); } }
        );
      }
    };

    const isSubmitting = createBloco.isPending || updateBloco.isPending;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bloco ? `Editar ${entityLabel}` : `Nov${isLoteamento ? 'a' : 'o'} ${entityLabel}`}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={isLoteamento ? 'Ex: Quadra 1, Quadra A' : 'Ex: Torre A, Bloco 1'} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isLoteamento ? (
                <FormField
                  control={form.control}
                  name="unidades_por_andar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total de Lotes</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="Ex: 20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="total_andares"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total de Andares</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="Ex: 10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unidades_por_andar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidades por Andar</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="Ex: 4" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : bloco ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
);
