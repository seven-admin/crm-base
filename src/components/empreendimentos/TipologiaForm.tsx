import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTipologia, useUpdateTipologia } from '@/hooks/useTipologias';
import type { Tipologia, TipologiaCategoria } from '@/types/empreendimentos.types';
import { TIPOLOGIA_CATEGORIA_LABELS } from '@/types/empreendimentos.types';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.enum(['casa', 'apartamento', 'terreno'] as const).default('apartamento'),
  quartos: z.coerce.number().min(0).default(0),
  suites: z.coerce.number().min(0).default(0),
  banheiros: z.coerce.number().min(0).default(0),
  vagas: z.coerce.number().min(0).default(0),
  area_privativa: z.coerce.number().optional(),
  area_total: z.coerce.number().optional(),
  valor_base: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TipologiaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  tipologia?: Tipologia | null;
}

export function TipologiaForm({ open, onOpenChange, empreendimentoId, tipologia }: TipologiaFormProps) {
  const createTipologia = useCreateTipologia();
  const updateTipologia = useUpdateTipologia();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      categoria: 'apartamento',
      quartos: 0,
      suites: 0,
      banheiros: 0,
      vagas: 0,
      area_privativa: undefined,
      area_total: undefined,
      valor_base: undefined,
    },
  });

  const categoria = form.watch('categoria');
  const isTerreno = categoria === 'terreno';

  // Reset form when tipologia changes (edit mode or new mode)
  useEffect(() => {
    if (tipologia) {
      form.reset({
        nome: tipologia.nome || '',
        categoria: tipologia.categoria || 'apartamento',
        quartos: tipologia.quartos || 0,
        suites: tipologia.suites || 0,
        banheiros: tipologia.banheiros || 0,
        vagas: tipologia.vagas || 0,
        area_privativa: tipologia.area_privativa || undefined,
        area_total: tipologia.area_total || undefined,
        valor_base: tipologia.valor_base || undefined,
      });
    } else {
      form.reset({
        nome: '',
        categoria: 'apartamento',
        quartos: 0,
        suites: 0,
        banheiros: 0,
        vagas: 0,
        area_privativa: undefined,
        area_total: undefined,
        valor_base: undefined,
      });
    }
  }, [tipologia?.id, form]);

  // Reset quartos/suites/banheiros/vagas when switching to terreno
  useEffect(() => {
    if (isTerreno) {
      form.setValue('quartos', 0);
      form.setValue('suites', 0);
      form.setValue('banheiros', 0);
      form.setValue('vagas', 0);
    }
  }, [isTerreno, form]);

  const onSubmit = (data: FormData) => {
    const formData = {
      nome: data.nome,
      categoria: data.categoria as TipologiaCategoria,
      quartos: isTerreno ? 0 : data.quartos,
      suites: isTerreno ? 0 : data.suites,
      banheiros: isTerreno ? 0 : data.banheiros,
      vagas: isTerreno ? 0 : data.vagas,
      area_privativa: data.area_privativa,
      area_total: data.area_total,
      valor_base: data.valor_base,
    };

    if (tipologia) {
      updateTipologia.mutate(
        { id: tipologia.id, empreendimentoId, data: formData },
        { onSuccess: () => { onOpenChange(false); form.reset(); } }
      );
    } else {
      createTipologia.mutate(
        { empreendimentoId, data: formData },
        { onSuccess: () => { onOpenChange(false); form.reset(); } }
      );
    }
  };

  const isSubmitting = createTipologia.isPending || updateTipologia.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tipologia ? 'Editar Tipologia' : 'Nova Tipologia'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.entries(TIPOLOGIA_CATEGORIA_LABELS) as [TipologiaCategoria, string][]).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={isTerreno ? "Ex: Lote 300m²" : "Ex: Apartamento 2 Quartos"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isTerreno && (
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="quartos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quartos</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="suites"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suítes</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="banheiros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banheiros</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vagas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vagas</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="area_privativa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isTerreno ? 'Área do Lote (m²)' : 'Área Privativa (m²)'}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 65.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área Total (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 80.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="valor_base"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Base (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 350000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : tipologia ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
