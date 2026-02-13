import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useCorretores } from '@/hooks/useCorretores';
import { Cliente, CLIENTE_ORIGENS, CLIENTE_TEMPERATURA_LABELS, ESTADOS_CIVIS, UFS_BRASIL, ClienteTemperatura } from '@/types/clientes.types';
import { useGestoresProduto } from '@/hooks/useGestores';
import { useCepLookup } from '@/hooks/useCepLookup';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { useGestorEmpreendimento } from '@/hooks/useGestorEmpreendimento';
import { User, Phone, MapPin, Building, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validarCPF, formatarCPF, formatarTelefone } from '@/lib/documentUtils';
import { ClienteTelefonesEditor } from './ClienteTelefonesEditor';
import { ClienteConjugeSelect } from './ClienteConjugeSelect';
import { ClienteSociosEditor } from './ClienteSociosEditor';
import { useAuth } from '@/contexts/AuthContext';

// Função para verificar se é brasileiro
const isBrasileiroNacionality = (nacionalidade: string | undefined): boolean => {
  if (!nacionalidade || nacionalidade.trim() === '') return true;
  const normalized = nacionalidade.toLowerCase().trim();
  return normalized.includes('brasil') || normalized === 'brasileiro' || normalized === 'brasileira';
};

const formSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  passaporte: z.string().optional(),
  data_nascimento: z.string().optional(),
  profissao: z.string().optional(),
  renda_mensal: z.coerce.number().optional(),
  estado_civil: z.string().optional(),
  nacionalidade: z.string().optional(),
  nome_mae: z.string().optional(),
  nome_pai: z.string().optional(),
  endereco_logradouro: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().optional(),
  endereco_cep: z.string().optional(),
  origem: z.string().optional(),
  temperatura: z.string().optional(),
  corretor_id: z.string().optional(),
  imobiliaria_id: z.string().optional(),
  gestor_id: z.string().optional(),
  empreendimento_id: z.string().optional(),
  conjuge_id: z.string().optional(),
  observacoes: z.string().optional(),
}).superRefine((data, ctx) => {
  const isBrasileiro = isBrasileiroNacionality(data.nacionalidade);
  
  if (isBrasileiro) {
    // Validar CPF apenas para brasileiros (se preenchido)
    if (data.cpf && data.cpf.replace(/\D/g, '').length > 0 && !validarCPF(data.cpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF inválido',
        path: ['cpf'],
      });
    }
  } else {
    // Passaporte obrigatório para estrangeiros
    if (!data.passaporte || data.passaporte.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passaporte é obrigatório para estrangeiros',
        path: ['passaporte'],
      });
    }
  }
});

type FormData = z.infer<typeof formSchema>;

interface ClienteFormProps {
  initialData?: Cliente;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

const STEPS = [
  { id: 1, title: 'Dados Pessoais', icon: User },
  { id: 2, title: 'Contato', icon: Phone },
  { id: 3, title: 'Endereço', icon: MapPin },
  { id: 4, title: 'Origem', icon: Building },
];

export function ClienteForm({ initialData, onSubmit, isLoading }: ClienteFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const isStep4 = currentStep === 4;

  const { corretores } = useCorretores(undefined, { enabled: isStep4 });
  const { data: gestores } = useGestoresProduto({ enabled: isStep4 });
  const { buscarCep, isLoading: isLoadingCep } = useCepLookup();
  const { data: empreendimentos } = useEmpreendimentosSelect({ enabled: isStep4 });
  const { user, role } = useAuth();
  const [selectedEmpreendimentoId, setSelectedEmpreendimentoId] = useState<string | undefined>(
    initialData?.empreendimento_id || undefined
  );
  
  const isGestorProduto = role === 'gestor_produto';
  const isCorretor = role === 'corretor';
  
  // Buscar gestor vinculado ao empreendimento selecionado
  const { data: gestorDoEmpreendimento } = useGestorEmpreendimento(isStep4 ? selectedEmpreendimentoId : undefined);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      whatsapp: '',
      cpf: '',
      rg: '',
      passaporte: '',
      data_nascimento: '',
      profissao: '',
      renda_mensal: undefined,
      estado_civil: '',
      nacionalidade: 'Brasileiro',
      nome_mae: '',
      nome_pai: '',
      endereco_logradouro: '',
      endereco_numero: '',
      endereco_complemento: '',
      endereco_bairro: '',
      endereco_cidade: '',
      endereco_uf: '',
      endereco_cep: '',
      origem: '',
      temperatura: '',
      corretor_id: '',
      imobiliaria_id: '',
      gestor_id: '',
      empreendimento_id: '',
      conjuge_id: '',
      observacoes: '',
    },
  });

  // Watch nacionalidade para mostrar/esconder campos condicionalmente
  const watchNacionalidade = form.watch('nacionalidade');
  const isBrasileiro = isBrasileiroNacionality(watchNacionalidade);

  useEffect(() => {
    if (initialData) {
      // Normalize date for input[type="date"] (expects YYYY-MM-DD)
      let dataNascimento = initialData.data_nascimento || '';
      if (dataNascimento && dataNascimento.includes('T')) {
        dataNascimento = dataNascimento.split('T')[0];
      }

      form.reset({
        nome: initialData.nome || '',
        email: initialData.email || '',
        telefone: initialData.telefone || '',
        whatsapp: initialData.whatsapp || '',
        cpf: initialData.cpf || '',
        rg: initialData.rg || '',
        passaporte: initialData.passaporte || '',
        data_nascimento: dataNascimento,
        profissao: initialData.profissao || '',
        renda_mensal: initialData.renda_mensal || undefined,
        estado_civil: initialData.estado_civil || '',
        nacionalidade: initialData.nacionalidade || 'Brasileiro',
        nome_mae: initialData.nome_mae || '',
        nome_pai: initialData.nome_pai || '',
        endereco_logradouro: initialData.endereco_logradouro || '',
        endereco_numero: initialData.endereco_numero || '',
        endereco_complemento: initialData.endereco_complemento || '',
        endereco_bairro: initialData.endereco_bairro || '',
        endereco_cidade: initialData.endereco_cidade || '',
        endereco_uf: initialData.endereco_uf || '',
        endereco_cep: initialData.endereco_cep || '',
        origem: initialData.origem || '',
        temperatura: initialData.temperatura || '',
        corretor_id: initialData.corretor_id || '',
        imobiliaria_id: initialData.imobiliaria_id || '',
        gestor_id: initialData.gestor_id || '',
        empreendimento_id: initialData.empreendimento_id || '',
        conjuge_id: initialData.conjuge_id || '',
        observacoes: initialData.observacoes || '',
      });
      setSelectedEmpreendimentoId(initialData.empreendimento_id || undefined);
    } else {
      form.reset({
        nome: '',
        email: '',
        telefone: '',
        whatsapp: '',
        cpf: '',
        rg: '',
        passaporte: '',
        data_nascimento: '',
        profissao: '',
        renda_mensal: undefined,
        estado_civil: '',
        nacionalidade: 'Brasileiro',
        nome_mae: '',
        nome_pai: '',
        endereco_logradouro: '',
        endereco_numero: '',
        endereco_complemento: '',
        endereco_bairro: '',
        endereco_cidade: '',
        endereco_uf: '',
        endereco_cep: '',
        origem: '',
        temperatura: '',
        corretor_id: '',
        imobiliaria_id: '',
        gestor_id: '',
        empreendimento_id: '',
        conjuge_id: '',
        observacoes: '',
      });
      setCurrentStep(1);
      setSelectedEmpreendimentoId(undefined);
    }
  }, [initialData?.id, form]);

  // Auto-set gestor_id for gestor_produto users
  useEffect(() => {
    if (isGestorProduto && user?.id && !initialData) {
      form.setValue('gestor_id', user.id);
    }
  }, [isGestorProduto, user?.id, initialData, form]);

  // Auto-set gestor_id quando corretor seleciona um empreendimento
  useEffect(() => {
    if (isCorretor && gestorDoEmpreendimento && !isGestorProduto) {
      form.setValue('gestor_id', gestorDoEmpreendimento);
    }
  }, [gestorDoEmpreendimento, isCorretor, isGestorProduto, form]);

  const handleSubmit = (data: FormData) => {
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? undefined : value,
      ])
    ) as FormData;
    
    // Garantir gestor_id para gestor_produto (segurança extra para RLS)
    if (isGestorProduto && user?.id) {
      cleanData.gestor_id = user.id;
    }
    
    onSubmit(cleanData);
  };

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
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          // Prevenir submissão prematura nas etapas intermediárias
          if (currentStep < STEPS.length) {
            e.preventDefault();
            return;
          }
          // Na última etapa, processar normalmente
          form.handleSubmit(handleSubmit)(e);
        }} 
        className="flex flex-col h-full"
      >
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
        <div className="flex-1 overflow-y-auto px-1">
          {/* Step 1: Dados Pessoais */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nacionalidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nacionalidade</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Brasileiro, Paraguaio, Argentino..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* CPF - apenas para brasileiros */}
                {isBrasileiro && (
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-00" 
                            value={field.value}
                            onChange={(e) => field.onChange(formatarCPF(e.target.value))}
                            maxLength={14}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Passaporte - apenas para estrangeiros */}
                {!isBrasileiro && (
                  <FormField
                    control={form.control}
                    name="passaporte"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passaporte *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Número do passaporte" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input placeholder="RG" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissão</FormLabel>
                      <FormControl>
                        <Input placeholder="Profissão" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="renda_mensal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renda Mensal</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="R$ 0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cônjuge */}
              <div className="pt-4 border-t">
                <FormField
                  control={form.control}
                  name="conjuge_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cônjuge</FormLabel>
                      <FormControl>
                        <ClienteConjugeSelect
                          value={field.value}
                          onChange={field.onChange}
                          excludeId={initialData?.id}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sócios (apenas para clientes existentes) */}
              {initialData?.id && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-3">Sócios</h4>
                  <ClienteSociosEditor clienteId={initialData.id} />
                </div>
              )}
              {!initialData?.id && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2 text-muted-foreground">Sócios</h4>
                  <p className="text-sm text-muted-foreground italic">
                    Salve o cliente primeiro para adicionar sócios.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Contato */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefones legados para manter compatibilidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone Principal</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(00) 0000-0000" 
                          value={field.value}
                          onChange={(e) => field.onChange(formatarTelefone(e.target.value))}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Principal</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(00) 00000-0000" 
                          value={field.value}
                          onChange={(e) => field.onChange(formatarTelefone(e.target.value))}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Lista de telefones adicionais (apenas para clientes existentes) */}
              {initialData?.id && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">Telefones Adicionais</h4>
                  <ClienteTelefonesEditor clienteId={initialData.id} />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Endereço */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="endereco_cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="00000-000" 
                            {...field}
                            onChange={async (e) => {
                              field.onChange(e);
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endereco_logradouro"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Avenida..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endereco_numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Nº" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endereco_complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto, Bloco..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endereco_bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endereco_cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endereco_uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Step 4: Origem */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Campo de Empreendimento - primeiro, pois define o gestor */}
              <FormField
                control={form.control}
                name="empreendimento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empreendimento de Interesse</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedEmpreendimentoId(value || undefined);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o empreendimento" />
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
                    {isCorretor && gestorDoEmpreendimento && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Gestor vinculado automaticamente ao empreendimento selecionado
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Temperatura */}
              <FormField
                control={form.control}
                name="temperatura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperatura</FormLabel>
                    <div className="flex gap-2">
                      {(Object.keys(CLIENTE_TEMPERATURA_LABELS) as ClienteTemperatura[]).map((temp) => {
                        const colorMap: Record<ClienteTemperatura, string> = {
                          frio: 'border-blue-400 bg-blue-50 text-blue-700',
                          morno: 'border-orange-400 bg-orange-50 text-orange-700',
                          quente: 'border-red-400 bg-red-50 text-red-700',
                        };
                        return (
                          <button
                            key={temp}
                            type="button"
                            onClick={() => field.onChange(field.value === temp ? '' : temp)}
                            className={cn(
                              'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                              field.value === temp
                                ? colorMap[temp]
                                : 'border-input hover:bg-accent'
                            )}
                          >
                            {CLIENTE_TEMPERATURA_LABELS[temp]}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="origem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a origem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CLIENTE_ORIGENS.map((origem) => (
                            <SelectItem key={origem} value={origem}>
                              {origem}
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
                  name="corretor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Corretor Responsável</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o corretor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {corretores?.map((corretor) => (
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
                {isGestorProduto ? (
                  <FormItem>
                    <FormLabel>Gestor de Produto</FormLabel>
                    <Input value="Você (atribuição automática)" disabled className="bg-muted" />
                  </FormItem>
                ) : isCorretor && gestorDoEmpreendimento ? (
                  <FormItem>
                    <FormLabel>Gestor de Produto</FormLabel>
                    <Input 
                      value={gestores?.find(g => g.id === gestorDoEmpreendimento)?.full_name || 'Gestor vinculado'} 
                      disabled 
                      className="bg-muted" 
                    />
                    <p className="text-xs text-muted-foreground">Vinculado ao empreendimento selecionado</p>
                  </FormItem>
                ) : (
                  <FormField
                    control={form.control}
                    name="gestor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gestor de Produto</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o gestor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gestores?.map((gestor) => (
                              <SelectItem key={gestor.id} value={gestor.id}>
                                {gestor.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações sobre o cliente..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" onClick={nextStep}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Cadastrar'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
