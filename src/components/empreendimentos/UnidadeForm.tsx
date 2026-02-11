import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateUnidade, useUpdateUnidade } from '@/hooks/useUnidades';
import { useBlocos } from '@/hooks/useBlocos';
import { useTipologias } from '@/hooks/useTipologias';
import { useFachadas } from '@/hooks/useFachadas';
import type { Unidade, EmpreendimentoTipo } from '@/types/empreendimentos.types';
import { UNIDADE_STATUS_LABELS } from '@/types/empreendimentos.types';

const formSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  bloco_id: z.string().optional(),
  tipologia_id: z.string().optional(),
  fachada_id: z.string().optional(),
  andar: z.coerce.number().optional(),
  area_privativa: z.coerce.number().optional(),
  valor: z.coerce.number().optional(),
  status: z.enum(['disponivel', 'reservada', 'negociacao', 'contrato', 'vendida', 'bloqueada']).default('disponivel'),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UnidadeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  unidade?: Unidade | null;
  tipoEmpreendimento?: EmpreendimentoTipo;
}

export function UnidadeForm({ open, onOpenChange, empreendimentoId, unidade, tipoEmpreendimento }: UnidadeFormProps) {
  const { data: blocos } = useBlocos(empreendimentoId);
  const { data: tipologias } = useTipologias(empreendimentoId);
  const { data: fachadas } = useFachadas(empreendimentoId);
  const createUnidade = useCreateUnidade();
  const updateUnidade = useUpdateUnidade();

  const isLoteamento = tipoEmpreendimento === 'loteamento' || tipoEmpreendimento === 'condominio';
  const agrupamentoLabel = isLoteamento ? 'Quadra' : 'Bloco/Torre';
  const unidadeLabel = isLoteamento ? 'Lote' : 'Unidade';

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero: '',
      bloco_id: undefined,
      tipologia_id: undefined,
      fachada_id: undefined,
      andar: undefined,
      area_privativa: undefined,
      valor: undefined,
      status: 'disponivel',
      descricao: '',
      observacoes: '',
    },
  });

  // Reset form when unidade changes (edit mode or new mode)
  useEffect(() => {
    if (unidade) {
      form.reset({
        numero: unidade.numero || '',
        bloco_id: unidade.bloco_id || undefined,
        tipologia_id: unidade.tipologia_id || undefined,
        fachada_id: unidade.fachada_id || undefined,
        andar: unidade.andar || undefined,
        area_privativa: unidade.area_privativa || undefined,
        valor: unidade.valor || undefined,
        status: unidade.status || 'disponivel',
        descricao: (unidade as any)?.descricao || '',
        observacoes: unidade.observacoes || '',
      });
    } else {
      form.reset({
        numero: '',
        bloco_id: undefined,
        tipologia_id: undefined,
        fachada_id: undefined,
        andar: undefined,
        area_privativa: undefined,
        valor: undefined,
        status: 'disponivel',
        descricao: '',
        observacoes: '',
      });
    }
  }, [unidade?.id, form]);

  const onSubmit = (data: FormData) => {
    const formData = {
      numero: data.numero,
      bloco_id: data.bloco_id || undefined,
      tipologia_id: data.tipologia_id || undefined,
      fachada_id: data.fachada_id || undefined,
      andar: data.andar,
      area_privativa: data.area_privativa,
      valor: data.valor,
      status: data.status,
      descricao: data.descricao,
      observacoes: data.observacoes,
    };

    if (unidade) {
      updateUnidade.mutate(
        { id: unidade.id, empreendimentoId, data: formData },
        { onSuccess: () => { onOpenChange(false); form.reset(); } }
      );
    } else {
      createUnidade.mutate(
        { empreendimentoId, data: formData },
        { onSuccess: () => { onOpenChange(false); form.reset(); } }
      );
    }
  };

  const isSubmitting = createUnidade.isPending || updateUnidade.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {unidade ? `Editar ${unidadeLabel}` : `Nov${isLoteamento ? 'o' : 'a'} ${unidadeLabel}`}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número *</FormLabel>
                      <FormControl>
                        <Input placeholder={isLoteamento ? 'Ex: 01' : 'Ex: 101'} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!isLoteamento && (
                  <FormField
                    control={form.control}
                    name="andar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Andar</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ex: 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bloco_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{agrupamentoLabel}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {blocos?.map((bloco) => (
                            <SelectItem key={bloco.id} value={bloco.id}>
                              {bloco.nome}
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
                  name="tipologia_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipologia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tipologias?.map((tipologia) => (
                            <SelectItem key={tipologia.id} value={tipologia.id}>
                              {tipologia.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {fachadas && fachadas.length > 0 && (
                <FormField
                  control={form.control}
                  name="fachada_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fachada</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a fachada" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fachadas.map((fachada) => (
                            <SelectItem key={fachada.id} value={fachada.id}>
                              {fachada.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="area_privativa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área {isLoteamento ? '(m²)' : 'Privativa (m²)'}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 65.50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 350000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        {Object.entries(UNIDADE_STATUS_LABELS).map(([value, label]) => (
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
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição / Memorial</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Texto completo do registro de imóveis para uso em contratos..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder={`Observações sobre ${isLoteamento ? 'o lote' : 'a unidade'}...`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 flex-shrink-0 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : unidade ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
