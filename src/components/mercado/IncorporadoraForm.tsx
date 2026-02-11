import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Incorporadora, IncorporadoraFormData } from '@/types/mercado.types';
import { useCepLookup } from '@/hooks/useCepLookup';
import { Building2, MapPin, Phone, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validarCNPJ, formatarCNPJ, formatarTelefone } from '@/lib/documentUtils';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  razao_social: z.string().optional(),
  cnpj: z.string()
    .optional()
    .refine((val) => !val || val.replace(/\D/g, '').length === 0 || validarCNPJ(val), {
      message: 'CNPJ inválido',
    }),
  endereco_logradouro: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().optional(),
  endereco_cep: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  is_active: z.boolean().default(true)
});

interface IncorporadoraFormProps {
  initialData?: Incorporadora;
  onSubmit: (data: IncorporadoraFormData) => void;
  isLoading?: boolean;
}

const STEPS = [
  { id: 1, title: 'Empresa', icon: Building2 },
  { id: 2, title: 'Endereço', icon: MapPin },
  { id: 3, title: 'Contatos', icon: Phone },
];

export function IncorporadoraForm({ initialData, onSubmit, isLoading }: IncorporadoraFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { buscarCep, isLoading: isLoadingCep } = useCepLookup();

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      razao_social: '',
      cnpj: '',
      endereco_logradouro: '',
      endereco_numero: '',
      endereco_complemento: '',
      endereco_bairro: '',
      endereco_cidade: '',
      endereco_uf: '',
      endereco_cep: '',
      telefone: '',
      email: '',
      is_active: true
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        nome: initialData.nome || '',
        razao_social: initialData.razao_social || '',
        cnpj: initialData.cnpj || '',
        endereco_logradouro: initialData.endereco_logradouro || '',
        endereco_numero: initialData.endereco_numero || '',
        endereco_complemento: initialData.endereco_complemento || '',
        endereco_bairro: initialData.endereco_bairro || '',
        endereco_cidade: initialData.endereco_cidade || '',
        endereco_uf: initialData.endereco_uf || '',
        endereco_cep: initialData.endereco_cep || '',
        telefone: initialData.telefone || '',
        email: initialData.email || '',
        is_active: initialData.is_active ?? true
      });
    } else {
      reset({
        nome: '',
        razao_social: '',
        cnpj: '',
        endereco_logradouro: '',
        endereco_numero: '',
        endereco_complemento: '',
        endereco_bairro: '',
        endereco_cidade: '',
        endereco_uf: '',
        endereco_cep: '',
        telefone: '',
        email: '',
        is_active: true
      });
      setCurrentStep(1);
    }
  }, [initialData?.id, reset]);

  const isActive = watch('is_active');

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6 px-2">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isStepActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => goToStep(step.id)}
                className={cn(
                  "flex flex-col items-center gap-1 group transition-all",
                  isStepActive || isCompleted ? "cursor-pointer" : "cursor-pointer opacity-60"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isStepActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isCompleted && "bg-primary text-primary-foreground",
                  !isStepActive && !isCompleted && "bg-muted text-muted-foreground group-hover:bg-muted/80"
                )}>
                  {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                </div>
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  isStepActive && "text-primary",
                  !isStepActive && "text-muted-foreground"
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
        {/* Step 1: Empresa */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Fantasia *</Label>
                <Input id="nome" {...register('nome')} placeholder="Nome da incorporadora" />
                {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input id="razao_social" {...register('razao_social')} placeholder="Razão social completa" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input 
                  id="cnpj" 
                  value={watch('cnpj') || ''}
                  onChange={(e) => setValue('cnpj', formatarCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00" 
                  maxLength={18}
                />
                {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Endereço */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco_logradouro">Logradouro</Label>
                <Input id="endereco_logradouro" {...register('endereco_logradouro')} placeholder="Rua, Avenida..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco_numero">Número</Label>
                <Input id="endereco_numero" {...register('endereco_numero')} placeholder="123" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco_complemento">Complemento</Label>
                <Input id="endereco_complemento" {...register('endereco_complemento')} placeholder="Sala, Andar..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco_bairro">Bairro</Label>
                <Input id="endereco_bairro" {...register('endereco_bairro')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco_cep">CEP</Label>
                <div className="relative">
                  <Input 
                    id="endereco_cep" 
                    {...register('endereco_cep')} 
                    placeholder="00000-000"
                    onChange={async (e) => {
                      const cep = e.target.value.replace(/\D/g, '');
                      setValue('endereco_cep', e.target.value);
                      if (cep.length === 8) {
                        const endereco = await buscarCep(cep);
                        if (endereco) {
                          setValue('endereco_logradouro', endereco.logradouro);
                          setValue('endereco_bairro', endereco.bairro);
                          setValue('endereco_cidade', endereco.cidade);
                          setValue('endereco_uf', endereco.uf);
                        }
                      }
                    }}
                  />
                  {isLoadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco_cidade">Cidade</Label>
                <Input id="endereco_cidade" {...register('endereco_cidade')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco_uf">UF</Label>
                <Input id="endereco_uf" {...register('endereco_uf')} maxLength={2} placeholder="SP" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contatos */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input 
                  id="telefone" 
                  value={watch('telefone') || ''}
                  onChange={(e) => setValue('telefone', formatarTelefone(e.target.value))}
                  placeholder="(00) 0000-0000" 
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" {...register('email')} type="email" placeholder="contato@incorporadora.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="space-y-0.5">
                <Label>Status</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? 'Incorporadora ativa no sistema' : 'Incorporadora inativa'}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
            </div>
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
            {isLoading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Incorporadora'}
          </Button>
        )}
      </div>
    </form>
  );
}
