import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useImobiliarias } from '@/hooks/useImobiliarias';
import { Corretor, CorretorFormData } from '@/types/mercado.types';
import { User, Building, Phone, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validarCPF, formatarCPF, formatarTelefone } from '@/lib/documentUtils';

const formSchema = z.object({
  nome_completo: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string()
    .optional()
    .refine((val) => !val || val.replace(/\D/g, '').length === 0 || validarCPF(val), {
      message: 'CPF inválido',
    }),
  imobiliaria_id: z.string().min(1, 'Imobiliária é obrigatória'),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  creci: z.string().optional(),
  is_active: z.boolean().default(true)
});

interface CorretorFormProps {
  initialData?: Corretor;
  onSubmit: (data: CorretorFormData) => void;
  isLoading?: boolean;
}

const STEPS = [
  { id: 1, title: 'Dados Pessoais', icon: User },
  { id: 2, title: 'Vínculo', icon: Building },
  { id: 3, title: 'Contato', icon: Phone },
];

export function CorretorForm({ initialData, onSubmit, isLoading }: CorretorFormProps) {
  const { imobiliarias } = useImobiliarias();
  const [currentStep, setCurrentStep] = useState(1);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_completo: '',
      cpf: '',
      imobiliaria_id: '',
      telefone: '',
      whatsapp: '',
      email: '',
      creci: '',
      is_active: true
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        nome_completo: initialData.nome_completo || '',
        cpf: initialData.cpf || '',
        imobiliaria_id: initialData.imobiliaria_id || '',
        telefone: initialData.telefone || '',
        whatsapp: initialData.whatsapp || '',
        email: initialData.email || '',
        creci: initialData.creci || '',
        is_active: initialData.is_active ?? true
      });
    } else {
      reset({
        nome_completo: '',
        cpf: '',
        imobiliaria_id: '',
        telefone: '',
        whatsapp: '',
        email: '',
        creci: '',
        is_active: true
      });
      setCurrentStep(1);
    }
  }, [initialData?.id, reset]);

  const isActive = watch('is_active');
  const selectedImobiliaria = watch('imobiliaria_id');

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    const formData: CorretorFormData = {
      nome_completo: data.nome_completo,
      cpf: data.cpf || undefined,
      imobiliaria_id: data.imobiliaria_id,
      telefone: data.telefone || undefined,
      whatsapp: data.whatsapp || undefined,
      email: data.email || undefined,
      creci: data.creci || undefined,
      is_active: data.is_active
    };
    onSubmit(formData);
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-full">
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
        {/* Step 1: Dados Pessoais */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input id="nome_completo" {...register('nome_completo')} placeholder="Nome do corretor" />
              {errors.nome_completo && <p className="text-sm text-destructive">{errors.nome_completo.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input 
                  id="cpf" 
                  value={watch('cpf') || ''}
                  onChange={(e) => setValue('cpf', formatarCPF(e.target.value))}
                  placeholder="000.000.000-00" 
                  maxLength={14}
                />
                {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="creci">CRECI</Label>
                <Input id="creci" {...register('creci')} placeholder="CRECI/UF" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Vínculo */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Imobiliária *</Label>
              <Select 
                value={selectedImobiliaria || ''} 
                onValueChange={(value) => setValue('imobiliaria_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  {imobiliarias.map(imob => (
                    <SelectItem key={imob.id} value={imob.id}>{imob.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.imobiliaria_id && <p className="text-sm text-destructive">{errors.imobiliaria_id.message}</p>}
            </div>
          </div>
        )}

        {/* Step 3: Contato */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input 
                  id="whatsapp" 
                  value={watch('whatsapp') || ''}
                  onChange={(e) => setValue('whatsapp', formatarTelefone(e.target.value))}
                  placeholder="(00) 00000-0000" 
                  maxLength={15}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" {...register('email')} type="email" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="space-y-0.5">
                <Label>Status</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? 'Corretor ativo' : 'Corretor inativo'}
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
            {isLoading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Corretor'}
          </Button>
        )}
      </div>
    </form>
  );
}
