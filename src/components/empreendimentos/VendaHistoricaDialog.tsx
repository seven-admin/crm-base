import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, History, Info, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatarMoeda } from '@/lib/formatters';

import { useVendaHistorica } from '@/hooks/useVendaHistorica';
import { useCorretores } from '@/hooks/useCorretores';
import { useImobiliarias } from '@/hooks/useImobiliarias';
import { Unidade } from '@/types/empreendimentos.types';

const formSchema = z.object({
  data_venda: z.date({
    required_error: 'Data da venda é obrigatória',
  }),
  valor_total: z.number({
    required_error: 'Valor total é obrigatório',
  }).min(0.01, 'Valor deve ser maior que zero'),
  corretor_id: z.string().optional(),
  imobiliaria_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface VendaHistoricaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  unidadesSelecionadas: Unidade[];
  onSuccess?: () => void;
}

export function VendaHistoricaDialog({
  open,
  onOpenChange,
  empreendimentoId,
  unidadesSelecionadas,
  onSuccess,
}: VendaHistoricaDialogProps) {
  const { corretores, isLoading: loadingCorretores } = useCorretores();
  const { imobiliarias, isLoading: loadingImobiliarias } = useImobiliarias();
  const vendaHistorica = useVendaHistorica();

  const [valorInput, setValorInput] = useState('');

  // Calcular valor total de tabela das unidades selecionadas
  const valorTabelaTotal = useMemo(() => {
    return unidadesSelecionadas.reduce((sum, u) => sum + (u.valor || 0), 0);
  }, [unidadesSelecionadas]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_venda: new Date(),
      valor_total: valorTabelaTotal,
    },
  });

  // Atualizar valor quando unidades mudam - usando useEffect para side-effects
  useEffect(() => {
    if (valorTabelaTotal > 0) {
      form.setValue('valor_total', valorTabelaTotal);
      setValorInput(formatarMoeda(valorTabelaTotal));
    }
  }, [valorTabelaTotal, form]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = parseInt(rawValue, 10) / 100 || 0;
    setValorInput(formatarMoeda(numericValue));
    form.setValue('valor_total', numericValue);
  };

  const onSubmit = async (data: FormData) => {
    await vendaHistorica.mutateAsync({
      unidade_ids: unidadesSelecionadas.map((u) => u.id),
      empreendimento_id: empreendimentoId,
      data_venda: format(data.data_venda, 'yyyy-MM-dd'),
      valor_total: data.valor_total,
      corretor_id: data.corretor_id === 'none' ? undefined : data.corretor_id,
      imobiliaria_id: data.imobiliaria_id === 'none' ? undefined : data.imobiliaria_id,
    });

    form.reset();
    setValorInput('');
    onOpenChange(false);
    onSuccess?.();
  };

  const isLoteamento = unidadesSelecionadas[0]?.bloco?.nome?.toLowerCase().includes('quadra');
  const unidadeLabel = isLoteamento ? 'Lotes' : 'Unidades';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Registrar Venda Histórica
          </DialogTitle>
          <DialogDescription>
            Registre vendas anteriores à implantação do sistema para atualizar os dashboards.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Unidades selecionadas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{unidadeLabel} Selecionados</label>
              <ScrollArea className="h-[100px] rounded-md border p-3">
                <div className="flex flex-wrap gap-2">
                  {unidadesSelecionadas.map((unidade) => (
                    <Badge key={unidade.id} variant="secondary" className="gap-1">
                      {unidade.bloco?.nome && `${unidade.bloco.nome} - `}
                      {unidade.numero}
                      {unidade.valor && (
                        <span className="text-muted-foreground ml-1">
                          ({formatarMoeda(unidade.valor)})
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-sm text-muted-foreground">
                {unidadesSelecionadas.length} unidade(s) • Valor de tabela:{' '}
                <strong>{formatarMoeda(valorTabelaTotal)}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Data da Venda */}
              <FormField
                control={form.control}
                name="data_venda"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Venda *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                            ) : (
                              <span>Selecione...</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valor Total */}
              <FormField
                control={form.control}
                name="valor_total"
                render={() => (
                  <FormItem>
                    <FormLabel>Valor Total *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        value={valorInput}
                        onChange={handleValorChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Corretor */}
              <FormField
                control={form.control}
                name="corretor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corretor (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingCorretores}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {corretores.map((corretor) => (
                          <SelectItem key={corretor.id} value={corretor.id}>
                            {corretor.nome_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Imobiliária */}
              <FormField
                control={form.control}
                name="imobiliaria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imobiliária (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingImobiliarias}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {imobiliarias.map((imobiliaria) => (
                          <SelectItem key={imobiliaria.id} value={imobiliaria.id}>
                            {imobiliaria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Informação sobre cliente padrão */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Esta venda será vinculada ao cliente genérico{' '}
                <strong>"Comprador Histórico (Pré-Sistema)"</strong>. O sistema criará
                automaticamente uma negociação e contrato assinado para atualizar os dashboards.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={vendaHistorica.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={vendaHistorica.isPending}>
                {vendaHistorica.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Venda'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
