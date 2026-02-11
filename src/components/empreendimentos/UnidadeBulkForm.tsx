import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Layers, AlertCircle } from 'lucide-react';
import { useCreateUnidadesBulk } from '@/hooks/useUnidades';
import { useBlocos } from '@/hooks/useBlocos';
import { useTipologias } from '@/hooks/useTipologias';
import { useFachadas } from '@/hooks/useFachadas';
import type { EmpreendimentoTipo, UnidadeFormData } from '@/types/empreendimentos.types';

const formSchema = z.object({
  bloco_id: z.string().optional(),
  tipologia_id: z.string().optional(),
  fachada_id: z.string().optional(),
  fachada_distribuicao: z.enum(['unica', 'alternada']).default('unica'),
  fachadas_selecionadas: z.array(z.string()).optional(),
  quantidade: z.coerce.number().min(1, 'Mínimo 1').max(500, 'Máximo 500'),
  valor: z.coerce.number().optional(),
  andar_inicial: z.coerce.number().min(0).default(1),
  unidades_por_andar: z.coerce.number().min(1).default(4),
  prefixo: z.string().optional(),
  numero_inicial: z.coerce.number().min(1).default(1),
  padrao_numeracao: z.enum(['sequencial', 'por_andar']).default('sequencial'),
});

type FormData = z.infer<typeof formSchema>;

interface UnidadeBulkFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  tipoEmpreendimento: EmpreendimentoTipo;
}

export function UnidadeBulkForm({ open, onOpenChange, empreendimentoId, tipoEmpreendimento }: UnidadeBulkFormProps) {
  const { data: blocos } = useBlocos(empreendimentoId);
  const { data: tipologias } = useTipologias(empreendimentoId);
  const { data: fachadas } = useFachadas(empreendimentoId);
  const createUnidadesBulk = useCreateUnidadesBulk();

  const isLoteamento = tipoEmpreendimento === 'loteamento' || tipoEmpreendimento === 'condominio';
  const agrupamentoLabel = isLoteamento ? 'Quadra' : 'Bloco/Torre';
  const unidadeLabel = isLoteamento ? 'Lotes' : 'Unidades';

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantidade: 10,
      andar_inicial: 1,
      unidades_por_andar: 4,
      numero_inicial: 1,
      padrao_numeracao: isLoteamento ? 'sequencial' : 'por_andar',
      fachada_distribuicao: 'unica',
      fachadas_selecionadas: [],
    },
  });

  const watchedValues = form.watch();

  // Generate preview of units to be created
  const previewUnidades = useMemo(() => {
    const { quantidade, andar_inicial, unidades_por_andar, prefixo, numero_inicial, padrao_numeracao, fachada_id, fachada_distribuicao, fachadas_selecionadas } = watchedValues;
    const unidades: { numero: string; andar: number | null; fachada_id?: string; fachada_nome?: string }[] = [];

    if (!quantidade || quantidade < 1) return unidades;

    const qty = Math.min(quantidade, 500);

    // Prepare fachadas for distribution
    const fachadasParaDistribuir = fachada_distribuicao === 'alternada' && fachadas_selecionadas && fachadas_selecionadas.length > 0
      ? fachadas_selecionadas
      : fachada_id ? [fachada_id] : [];

    if (padrao_numeracao === 'por_andar' && !isLoteamento) {
      let currentFloor = andar_inicial || 1;
      let positionOnFloor = 1;
      const unitsPerFloor = unidades_por_andar || 4;

      for (let i = 0; i < qty; i++) {
        const floorPrefix = currentFloor.toString();
        const unitNumber = positionOnFloor.toString().padStart(2, '0');
        const numero = `${prefixo || ''}${floorPrefix}${unitNumber}`;
        
        // Get fachada for this unit (cyclic distribution)
        const currentFachadaId = fachadasParaDistribuir.length > 0 
          ? fachadasParaDistribuir[i % fachadasParaDistribuir.length] 
          : undefined;
        const currentFachada = fachadas?.find(f => f.id === currentFachadaId);
        
        unidades.push({ 
          numero, 
          andar: currentFloor, 
          fachada_id: currentFachadaId,
          fachada_nome: currentFachada?.nome 
        });

        positionOnFloor++;
        if (positionOnFloor > unitsPerFloor) {
          positionOnFloor = 1;
          currentFloor++;
        }
      }
    } else {
      const startNum = numero_inicial || 1;
      for (let i = 0; i < qty; i++) {
        const num = startNum + i;
        const numero = `${prefixo || ''}${num.toString().padStart(2, '0')}`;
        
        // Get fachada for this unit (cyclic distribution)
        const currentFachadaId = fachadasParaDistribuir.length > 0 
          ? fachadasParaDistribuir[i % fachadasParaDistribuir.length] 
          : undefined;
        const currentFachada = fachadas?.find(f => f.id === currentFachadaId);
        
        unidades.push({ 
          numero, 
          andar: null, 
          fachada_id: currentFachadaId,
          fachada_nome: currentFachada?.nome 
        });
      }
    }

    return unidades;
  }, [watchedValues, isLoteamento, fachadas]);

  const onSubmit = (data: FormData) => {
    const selectedTipologia = tipologias?.find(t => t.id === data.tipologia_id);
    
    const unidades: UnidadeFormData[] = previewUnidades.map(preview => ({
      numero: preview.numero,
      andar: preview.andar ?? undefined,
      bloco_id: data.bloco_id || undefined,
      tipologia_id: data.tipologia_id || undefined,
      fachada_id: preview.fachada_id || undefined,
      area_privativa: selectedTipologia?.area_privativa ?? undefined,
      valor: data.valor || undefined,
      status: 'disponivel',
    }));

    createUnidadesBulk.mutate(
      { empreendimentoId, unidades },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      }
    );
  };

  const isSubmitting = createUnidadesBulk.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Adicionar {unidadeLabel} em Lote
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden space-y-4">
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
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium mb-3 text-sm">Fachada</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fachada_distribuicao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distribuição</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unica">Fachada Única</SelectItem>
                            <SelectItem value="alternada">Alternada (Cíclica)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {watchedValues.fachada_distribuicao === 'unica' ? (
                    <FormField
                      control={form.control}
                      name="fachada_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fachada</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
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
                  ) : (
                    <FormField
                      control={form.control}
                      name="fachadas_selecionadas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fachadas (ordem de alternância)</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {fachadas.map((fachada) => {
                              const isSelected = field.value?.includes(fachada.id);
                              return (
                                <Badge
                                  key={fachada.id}
                                  variant={isSelected ? 'default' : 'outline'}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    const current = field.value || [];
                                    if (isSelected) {
                                      field.onChange(current.filter(id => id !== fachada.id));
                                    } else {
                                      field.onChange([...current, fachada.id]);
                                    }
                                  }}
                                >
                                  {fachada.nome}
                                </Badge>
                              );
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Clique para selecionar. A ordem será: {field.value?.map(id => fachadas.find(f => f.id === id)?.nome).join(' → ') || 'nenhuma'}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="500" placeholder="Ex: 100" {...field} />
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
                    <FormLabel>Valor Base (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 350000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Numeração</h4>
              
              {!isLoteamento && (
                <FormField
                  control={form.control}
                  name="padrao_numeracao"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Padrão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sequencial">Sequencial (01, 02, 03...)</SelectItem>
                          <SelectItem value="por_andar">Por Andar (101, 102, 201, 202...)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                {watchedValues.padrao_numeracao === 'por_andar' && !isLoteamento ? (
                  <>
                    <FormField
                      control={form.control}
                      name="andar_inicial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Andar Inicial</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" placeholder="Ex: 1" {...field} />
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
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="numero_inicial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número Inicial</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="Ex: 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="prefixo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prefixo</FormLabel>
                      <FormControl>
                        <Input placeholder={isLoteamento ? 'Ex: Q1-' : 'Ex: A'} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-muted/30 flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Preview</h4>
                <Badge variant="secondary">{previewUnidades.length} {unidadeLabel.toLowerCase()}</Badge>
              </div>
              
              {previewUnidades.length > 0 ? (
                <ScrollArea className="flex-1 max-h-32">
                  <div className="flex flex-wrap gap-1">
                    {previewUnidades.slice(0, 50).map((u, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {u.numero}{u.fachada_nome ? `|${u.fachada_nome}` : ''}
                      </Badge>
                    ))}
                    {previewUnidades.length > 50 && (
                      <Badge variant="outline" className="text-xs">
                        +{previewUnidades.length - 50} mais...
                      </Badge>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">Configure os campos acima para ver o preview</p>
              )}
            </div>

            {watchedValues.quantidade > 100 && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Criar {watchedValues.quantidade} unidades pode demorar alguns segundos.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || previewUnidades.length === 0}>
                {isSubmitting ? 'Criando...' : `Criar ${previewUnidades.length} ${unidadeLabel}`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
