import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateEmpreendimento, useUpdateEmpreendimento } from '@/hooks/useEmpreendimentos';
import { useGestoresProduto } from '@/hooks/useGestores';
import { useIncorporadoras } from '@/hooks/useIncorporadoras';
import type { Empreendimento, EmpreendimentoFormData, EmpreendimentoTipo, EmpreendimentoStatus, ConfigVenda } from '@/types/empreendimentos.types';
import { EMPREENDIMENTO_TIPO_LABELS, EMPREENDIMENTO_STATUS_LABELS, CONFIG_VENDA_RODAPE_DEFAULTS } from '@/types/empreendimentos.types';
import { LABEL_FORMAT_OPTIONS, type LabelFormatElement } from '@/lib/mapaUtils';
import { useCepLookup } from '@/hooks/useCepLookup';
import { Building2, MapPin, FileText, Table2, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_CONFIG_VENDA = {
  plano: { fluxo_ativo: false, ato_pct: 10, mensais_pct: 20, mensais_qtd: 60, reforcos_pct: 10, reforcos_qtd: 5, ref_label: '' },
  rodape: {
    gestao_comercial: '', especialista: '', inicio_obra: '', previsao_entrega: '',
    certidao_aprovacao: '', licenca_construcao: '', patrimonio_afetacao: '',
    reajustes: CONFIG_VENDA_RODAPE_DEFAULTS.reajustes,
    vantagens: CONFIG_VENDA_RODAPE_DEFAULTS.vantagens,
    garantias: CONFIG_VENDA_RODAPE_DEFAULTS.garantias,
  },
};

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.enum(['loteamento', 'condominio', 'predio', 'comercial']),
  status: z.enum(['lancamento', 'obra', 'entregue']),
  incorporadora_id: z.string().optional(),
  responsavel_comercial_id: z.string().optional(),
  descricao_curta: z.string().max(255, 'Máximo 255 caracteres').optional(),
  descricao_completa: z.string().optional(),
  endereco_logradouro: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().max(2, 'UF deve ter 2 caracteres').optional(),
  endereco_cep: z.string().optional(),
  registro_incorporacao: z.string().optional(),
  matricula_mae: z.string().optional(),
  config_venda: z.object({
    plano: z.object({
      fluxo_ativo: z.boolean().default(false),
      ato_pct: z.coerce.number().min(0).max(100),
      mensais_pct: z.coerce.number().min(0).max(100),
      mensais_qtd: z.coerce.number().int().min(0),
      reforcos_pct: z.coerce.number().min(0).max(100),
      reforcos_qtd: z.coerce.number().int().min(0),
      ref_label: z.string().optional(),
    }).superRefine((p, ctx) => {
      if (!p.fluxo_ativo) return; // sem fluxo ativo, percentuais não são exigidos
      if (p.ato_pct + p.mensais_pct + p.reforcos_pct > 100) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A soma de ato + mensais + reforços não pode passar de 100%', path: ['ato_pct'] });
      }
      if (p.mensais_qtd < 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mínimo 1', path: ['mensais_qtd'] });
      if (p.reforcos_qtd < 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mínimo 1', path: ['reforcos_qtd'] });
    }),
    rodape: z.object({
      gestao_comercial: z.string().optional(),
      especialista: z.string().optional(),
      inicio_obra: z.string().optional(),
      previsao_entrega: z.string().optional(),
      certidao_aprovacao: z.string().optional(),
      licenca_construcao: z.string().optional(),
      patrimonio_afetacao: z.string().optional(),
      reajustes: z.string().optional(),
      vantagens: z.string().optional(),
      garantias: z.string().optional(),
    }),
  }),
  legenda_status_visiveis: z.array(z.enum(['disponivel', 'reservada', 'negociacao', 'contrato', 'vendida', 'bloqueada'])).optional(),
  mapa_label_formato: z.array(z.enum(['bloco', 'tipologia', 'numero', 'posicao', 'andar'])).optional(),
});

interface EmpreendimentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimento?: Empreendimento;
}

const STEPS = [
  { id: 1, title: 'Dados Gerais', icon: Building2 },
  { id: 2, title: 'Localização', icon: MapPin },
  { id: 3, title: 'Documentação', icon: FileText },
  { id: 4, title: 'Tabela de Vendas', icon: Table2 },
];

export function EmpreendimentoForm({ open, onOpenChange, empreendimento }: EmpreendimentoFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const createMutation = useCreateEmpreendimento();
  const updateMutation = useUpdateEmpreendimento();
  const { buscarCep, isLoading: isLoadingCep } = useCepLookup();
  const { data: gestoresProduto } = useGestoresProduto();
  const { incorporadoras } = useIncorporadoras();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      tipo: 'predio',
      status: 'lancamento',
      incorporadora_id: '',
      responsavel_comercial_id: '',
      descricao_curta: '',
      descricao_completa: '',
      endereco_logradouro: '',
      endereco_numero: '',
      endereco_complemento: '',
      endereco_bairro: '',
      endereco_cidade: '',
      endereco_uf: '',
      endereco_cep: '',
      registro_incorporacao: '',
      matricula_mae: '',
      config_venda: DEFAULT_CONFIG_VENDA,
      legenda_status_visiveis: ['disponivel', 'reservada', 'vendida', 'bloqueada'],
      mapa_label_formato: ['bloco', 'tipologia', 'numero'],
    },
  });

  useEffect(() => {
    setCurrentStep(1);
    if (empreendimento) {
      form.reset({
        nome: empreendimento.nome || '',
        tipo: empreendimento.tipo || 'predio',
        status: empreendimento.status || 'lancamento',
        incorporadora_id: (empreendimento as any).incorporadora_id || '',
        responsavel_comercial_id: empreendimento.responsavel_comercial_id || '',
        descricao_curta: empreendimento.descricao_curta || '',
        descricao_completa: empreendimento.descricao_completa || '',
        endereco_logradouro: empreendimento.endereco_logradouro || '',
        endereco_numero: empreendimento.endereco_numero || '',
        endereco_complemento: empreendimento.endereco_complemento || '',
        endereco_bairro: empreendimento.endereco_bairro || '',
        endereco_cidade: empreendimento.endereco_cidade || '',
        endereco_uf: empreendimento.endereco_uf || '',
        endereco_cep: empreendimento.endereco_cep || '',
        registro_incorporacao: empreendimento.registro_incorporacao || '',
        matricula_mae: empreendimento.matricula_mae || '',
        config_venda: {
          plano: { ...DEFAULT_CONFIG_VENDA.plano, ...(empreendimento.config_venda?.plano || {}) },
          rodape: { ...DEFAULT_CONFIG_VENDA.rodape, ...(empreendimento.config_venda?.rodape || {}) },
        },
        legenda_status_visiveis: empreendimento.legenda_status_visiveis || ['disponivel', 'reservada', 'negociacao', 'contrato', 'vendida', 'bloqueada'],
        mapa_label_formato: (empreendimento as any).mapa_label_formato || ['bloco', 'tipologia', 'numero'],
      });
    } else {
      form.reset({
        nome: '',
        tipo: 'predio',
        status: 'lancamento',
        incorporadora_id: '',
        responsavel_comercial_id: '',
        descricao_curta: '',
        descricao_completa: '',
        endereco_logradouro: '',
        endereco_numero: '',
        endereco_complemento: '',
        endereco_bairro: '',
        endereco_cidade: '',
        endereco_uf: '',
        endereco_cep: '',
        registro_incorporacao: '',
        matricula_mae: '',
        config_venda: DEFAULT_CONFIG_VENDA,
        legenda_status_visiveis: ['disponivel', 'reservada', 'vendida', 'bloqueada'],
        mapa_label_formato: ['bloco', 'tipologia', 'numero'],
      });
    }
  }, [empreendimento?.id, form, open]);

  const onError = (errors: Record<string, any>) => {
    const step1Fields = ['nome', 'tipo', 'status', 'incorporadora_id', 'responsavel_comercial_id', 'descricao_curta', 'descricao_completa', 'legenda_status_visiveis', 'mapa_label_formato'];
    const step2Fields = ['endereco_logradouro', 'endereco_numero', 'endereco_complemento', 'endereco_bairro', 'endereco_cidade', 'endereco_uf', 'endereco_cep'];
    
    const errorKeys = Object.keys(errors);
    if (errorKeys.some(k => step1Fields.includes(k))) {
      setCurrentStep(1);
    } else if (errorKeys.some(k => step2Fields.includes(k))) {
      setCurrentStep(2);
    } else if (errorKeys.includes('config_venda')) {
      setCurrentStep(4);
    } else {
      setCurrentStep(3);
    }
    
    toast({ variant: 'destructive', title: 'Verifique os campos obrigatórios', description: 'Há campos inválidos no formulário.' });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('Form submitted with values:', values);
    const data: EmpreendimentoFormData = {
      nome: values.nome,
      tipo: values.tipo as EmpreendimentoTipo,
      status: values.status as EmpreendimentoStatus,
      incorporadora_id: values.incorporadora_id || undefined,
      responsavel_comercial_id: values.responsavel_comercial_id || undefined,
      descricao_curta: values.descricao_curta || undefined,
      descricao_completa: values.descricao_completa || undefined,
      endereco_logradouro: values.endereco_logradouro || undefined,
      endereco_numero: values.endereco_numero || undefined,
      endereco_complemento: values.endereco_complemento || undefined,
      endereco_bairro: values.endereco_bairro || undefined,
      endereco_cidade: values.endereco_cidade || undefined,
      endereco_uf: values.endereco_uf || undefined,
      endereco_cep: values.endereco_cep || undefined,
      registro_incorporacao: values.registro_incorporacao || undefined,
      matricula_mae: values.matricula_mae || undefined,
      config_venda: values.config_venda as ConfigVenda,
      legenda_status_visiveis: values.legenda_status_visiveis as any || undefined,
      mapa_label_formato: values.mapa_label_formato as any || undefined,
    };

    try {
      if (empreendimento) {
        await updateMutation.mutateAsync({ id: empreendimento.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving empreendimento:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {empreendimento ? 'Editar Empreendimento' : 'Novo Empreendimento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="flex flex-col flex-1 overflow-hidden">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6 px-2">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => goToStep(step.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 group transition-all",
                      isActive || isCompleted ? "cursor-pointer" : "cursor-pointer opacity-60"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                      isCompleted && "bg-primary text-primary-foreground",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground group-hover:bg-muted/80"
                    )}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </div>
                    <span className={cn(
                      "text-xs font-medium transition-colors",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </button>
                  
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2 min-h-[300px]">
            {/* Step 1: Dados Gerais */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome do Empreendimento *</Label>
                  <Input
                    id="nome"
                    {...form.register('nome')}
                    placeholder="Ex: Residencial Aurora"
                  />
                  {form.formState.errors.nome && (
                    <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select
                      value={form.watch('tipo')}
                      onValueChange={(value) => form.setValue('tipo', value as EmpreendimentoTipo)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EMPREENDIMENTO_TIPO_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={form.watch('status')}
                      onValueChange={(value) => form.setValue('status', value as EmpreendimentoStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EMPREENDIMENTO_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="incorporadora_id">Incorporadora</Label>
                  <Select
                    value={form.watch('incorporadora_id') || '__none__'}
                    onValueChange={(value) => form.setValue('incorporadora_id', value === '__none__' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a incorporadora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhuma</SelectItem>
                      {incorporadoras?.map((inc) => (
                        <SelectItem key={inc.id} value={inc.id}>
                          {inc.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="responsavel_comercial_id">Gestor do Produto</Label>
                  <Select
                    value={form.watch('responsavel_comercial_id') || '__none__'}
                    onValueChange={(value) => form.setValue('responsavel_comercial_id', value === '__none__' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gestor responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {gestoresProduto?.map((gestor) => (
                        <SelectItem key={gestor.id} value={gestor.id}>
                          {gestor.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Gestor responsável pelo empreendimento
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="descricao_curta">Descrição Curta</Label>
                  <Input
                    id="descricao_curta"
                    {...form.register('descricao_curta')}
                    placeholder="Breve descrição (máx. 255 caracteres)"
                    maxLength={255}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="descricao_completa">Descrição Completa</Label>
                  <Textarea
                    id="descricao_completa"
                    {...form.register('descricao_completa')}
                    placeholder="Descrição detalhada do empreendimento"
                    rows={4}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Status Visíveis na Legenda do Mapa</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Selecione quais status de unidade serão exibidos na legenda do mapa interativo
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'disponivel', label: 'Disponível', color: 'bg-green-500' },
                      { value: 'reservada', label: 'Reservada', color: 'bg-amber-500' },
                      { value: 'vendida', label: 'Vendida', color: 'bg-red-500' },
                      { value: 'bloqueada', label: 'Bloqueada', color: 'bg-gray-500' },
                    ].map((status) => {
                      const currentValues = form.watch('legenda_status_visiveis') || [];
                      const isChecked = currentValues.includes(status.value as any);
                      
                      return (
                        <div key={status.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const newValues = checked
                                ? [...currentValues, status.value]
                                : currentValues.filter((v: string) => v !== status.value);
                              form.setValue('legenda_status_visiveis', newValues as any);
                            }}
                          />
                          <Label 
                            htmlFor={`status-${status.value}`} 
                            className="font-normal cursor-pointer flex items-center gap-2"
                          >
                            <span className={`w-3 h-3 rounded-full ${status.color}`} />
                            {status.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Formato do Label no Mapa</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Selecione quais informações serão exibidas nos labels das unidades no mapa interativo
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {LABEL_FORMAT_OPTIONS.map((option) => {
                      const currentValues = form.watch('mapa_label_formato') || [];
                      const isChecked = currentValues.includes(option.value as any);
                      
                      return (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`label-${option.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const newValues = checked
                                ? [...currentValues, option.value]
                                : currentValues.filter((v: string) => v !== option.value);
                              form.setValue('mapa_label_formato', newValues as any);
                            }}
                          />
                          <Label 
                            htmlFor={`label-${option.value}`} 
                            className="font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Localização */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 grid gap-2">
                    <Label htmlFor="endereco_logradouro">Logradouro</Label>
                    <Input
                      id="endereco_logradouro"
                      {...form.register('endereco_logradouro')}
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endereco_numero">Número</Label>
                    <Input
                      id="endereco_numero"
                      {...form.register('endereco_numero')}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="endereco_complemento">Complemento</Label>
                    <Input
                      id="endereco_complemento"
                      {...form.register('endereco_complemento')}
                      placeholder="Bloco, Sala, etc."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endereco_bairro">Bairro</Label>
                    <Input
                      id="endereco_bairro"
                      {...form.register('endereco_bairro')}
                      placeholder="Nome do bairro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 grid gap-2">
                    <Label htmlFor="endereco_cep">CEP</Label>
                    <div className="relative">
                      <Input
                        id="endereco_cep"
                        {...form.register('endereco_cep')}
                        placeholder="00000-000"
                        onChange={async (e) => {
                          form.setValue('endereco_cep', e.target.value);
                          const cep = e.target.value.replace(/\D/g, '');
                          if (cep.length === 8) {
                            const endereco = await buscarCep(cep);
                            if (endereco) {
                              form.setValue('endereco_logradouro', endereco.logradouro);
                              form.setValue('endereco_bairro', endereco.bairro);
                              form.setValue('endereco_cidade', endereco.cidade);
                              form.setValue('endereco_uf', endereco.uf);
                            }
                          }
                        }}
                      />
                      {isLoadingCep && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endereco_cidade">Cidade</Label>
                    <Input
                      id="endereco_cidade"
                      {...form.register('endereco_cidade')}
                      placeholder="Nome da cidade"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endereco_uf">UF</Label>
                    <Input
                      id="endereco_uf"
                      {...form.register('endereco_uf')}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Documentação */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="registro_incorporacao">Registro de Incorporação</Label>
                  <Input
                    id="registro_incorporacao"
                    {...form.register('registro_incorporacao')}
                    placeholder="Número do registro"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="matricula_mae">Matrícula-Mãe</Label>
                  <Input
                    id="matricula_mae"
                    {...form.register('matricula_mae')}
                    placeholder="Número da matrícula"
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  Upload de documentos estará disponível após criar o empreendimento.
                </p>
              </div>
            )}

            {/* Step 4: Tabela de Vendas */}
            {currentStep === 4 && (() => {
              const p = form.watch('config_venda.plano');
              const fluxoAtivo = p?.fluxo_ativo ?? false;
              const finPct = 100 - (Number(p?.ato_pct) || 0) - (Number(p?.mensais_pct) || 0) - (Number(p?.reforcos_pct) || 0);
              const planoErr = form.formState.errors.config_venda?.plano as any;
              return (
                <div className="space-y-5">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="pr-4">
                      <h3 className="text-sm font-semibold">Fluxo de pagamento na tabela de vendas</h3>
                      <p className="text-xs text-muted-foreground">Quando ativo, o PDF "Tabela de Vendas" exibe as colunas ATO, mensais, reforços e financiamento (calculadas do valor da unidade). Desligado, mostra só o valor total.</p>
                    </div>
                    <Switch
                      checked={fluxoAtivo}
                      onCheckedChange={(v) => form.setValue('config_venda.plano.fluxo_ativo', v)}
                    />
                  </div>

                  {fluxoAtivo && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="ato_pct">ATO (%)</Label>
                      <Input id="ato_pct" type="number" step="0.01" {...form.register('config_venda.plano.ato_pct')} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mensais_pct">Mensais (%)</Label>
                      <Input id="mensais_pct" type="number" step="0.01" {...form.register('config_venda.plano.mensais_pct')} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mensais_qtd">Qtd. parcelas mensais</Label>
                      <Input id="mensais_qtd" type="number" step="1" {...form.register('config_venda.plano.mensais_qtd')} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reforcos_pct">Reforços (%)</Label>
                      <Input id="reforcos_pct" type="number" step="0.01" {...form.register('config_venda.plano.reforcos_pct')} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reforcos_qtd">Qtd. reforços</Label>
                      <Input id="reforcos_qtd" type="number" step="1" {...form.register('config_venda.plano.reforcos_qtd')} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Financiamento (%)</Label>
                      <Input value={Number.isFinite(finPct) ? finPct : ''} readOnly disabled className={cn(finPct < 0 && 'text-destructive')} />
                    </div>
                  </div>
                  )}
                  {fluxoAtivo && planoErr?.ato_pct?.message && (
                    <p className="text-sm text-destructive">{planoErr.ato_pct.message}</p>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="ref_label">Referência (ex: julho/2026)</Label>
                    <Input id="ref_label" {...form.register('config_venda.plano.ref_label')} placeholder="julho/2026" />
                  </div>

                  <div className="pt-2">
                    <h3 className="text-sm font-semibold">Rodapé do PDF comercial</h3>
                    <p className="text-xs text-muted-foreground">Campos vazios não aparecem no PDF. Os textos abaixo já vêm preenchidos com um padrão editável.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="gestao_comercial">Gestão comercial (nome · telefone)</Label>
                      <Input id="gestao_comercial" {...form.register('config_venda.rodape.gestao_comercial')} placeholder="Fulano - (55) 9....." />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="especialista">Especialista responsável (nome · telefone)</Label>
                      <Input id="especialista" {...form.register('config_venda.rodape.especialista')} placeholder="Fulano - (55) 9....." />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="inicio_obra">Início de obra</Label>
                      <Input id="inicio_obra" type="date" {...form.register('config_venda.rodape.inicio_obra')} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="previsao_entrega">Previsão de entrega</Label>
                      <Input id="previsao_entrega" {...form.register('config_venda.rodape.previsao_entrega')} placeholder="Outubro de 2029" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="certidao_aprovacao">Certidão de aprovação</Label>
                      <Input id="certidao_aprovacao" {...form.register('config_venda.rodape.certidao_aprovacao')} placeholder="134/2025" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="licenca_construcao">Licença de construção</Label>
                      <Input id="licenca_construcao" {...form.register('config_venda.rodape.licenca_construcao')} placeholder="00263/2025" />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="patrimonio_afetacao">Patrimônio de afetação</Label>
                      <Input id="patrimonio_afetacao" {...form.register('config_venda.rodape.patrimonio_afetacao')} placeholder="AV.4/194.982" />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="reajustes">Regras de reajustes</Label>
                    <Textarea id="reajustes" rows={3} {...form.register('config_venda.rodape.reajustes')} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="vantagens">Vantagens do financiamento</Label>
                    <Textarea id="vantagens" rows={3} {...form.register('config_venda.rodape.vantagens')} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="garantias">Garantia de entrega e segurança patrimonial</Label>
                    <Textarea id="garantias" rows={3} {...form.register('config_venda.rodape.garantias')} />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
            </div>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : empreendimento ? 'Salvar' : 'Criar Empreendimento'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
