import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Validação de CPF
function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

// Formatar CPF para exibição
function formatarCPF(value: string): string {
  const cpf = value.replace(/\D/g, '');
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
}

// Formatar telefone
function formatarTelefone(value: string): string {
  const phone = value.replace(/\D/g, '');
  if (phone.length <= 2) return phone;
  if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
}

const registerSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  cpf: z.string().refine(validarCPF, 'CPF inválido'),
  creci: z.string().min(1, 'CRECI é obrigatório'),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  uf: z.string().min(2, 'Estado é obrigatório'),
  telefone: z.string().min(14, 'WhatsApp é obrigatório'),
  aceite_termos: z.literal(true, { errorMap: () => ({ message: 'Você deve aceitar os termos de uso' }) })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

interface CorretorRegisterFormProps {
  onBack: () => void;
}

export function CorretorRegisterForm({ onBack }: CorretorRegisterFormProps) {
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    creci: '',
    cidade: '',
    uf: '',
    telefone: '',
    aceite_termos: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (field: string, value: string | boolean) => {
    let formattedValue = value;
    
    if (field === 'cpf' && typeof value === 'string') {
      formattedValue = formatarCPF(value);
    } else if (field === 'telefone' && typeof value === 'string') {
      formattedValue = formatarTelefone(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    
    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('register-corretor', {
        body: {
          email: formData.email.trim(),
          password: formData.password,
          nome_completo: formData.nome_completo.trim(),
          cpf: formData.cpf,
          creci: formData.creci.trim(),
          cidade: formData.cidade.trim(),
          uf: formData.uf,
          telefone: formData.telefone || null
        }
      });

      if (response.error) {
        let errorMsg = 'Erro ao processar cadastro';
        try {
          const errorBody = await response.error.context?.json();
          if (errorBody?.error) {
            errorMsg = errorBody.error;
          }
        } catch {
          errorMsg = response.error.message || errorMsg;
        }
        throw new Error(errorMsg);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setApiError(err.message || 'Erro ao processar cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-border shadow-2xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Cadastro Realizado com Sucesso!</h2>
          <p className="text-muted-foreground mb-6">
            Seu cadastro foi recebido e está aguardando ativação por um administrador do sistema.
            <br /><br />
            Você será notificado quando seu acesso for liberado.
          </p>
          <Button onClick={onBack} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-2xl">
      <CardHeader className="text-center pb-2 pt-6">
        <CardTitle className="text-xl font-bold">Cadastro de Corretor</CardTitle>
        <CardDescription className="text-sm mt-1">
          Preencha seus dados para solicitar acesso
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {apiError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                value={formData.nome_completo}
                onChange={(e) => handleChange('nome_completo', e.target.value)}
                placeholder="Seu nome completo"
                className={errors.nome_completo ? 'border-destructive' : ''}
              />
              {errors.nome_completo && (
                <p className="text-xs text-destructive">{errors.nome_completo}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="seu@email.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="••••••••"
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="••••••••"
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
                className={errors.cpf ? 'border-destructive' : ''}
              />
              {errors.cpf && (
                <p className="text-xs text-destructive">{errors.cpf}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="creci">CRECI *</Label>
              <Input
                id="creci"
                value={formData.creci}
                onChange={(e) => handleChange('creci', e.target.value)}
                placeholder="Ex: 123456-F/SP"
                className={errors.creci ? 'border-destructive' : ''}
              />
              {errors.creci && (
                <p className="text-xs text-destructive">{errors.creci}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                placeholder="Sua cidade"
                className={errors.cidade ? 'border-destructive' : ''}
              />
              {errors.cidade && (
                <p className="text-xs text-destructive">{errors.cidade}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">Estado *</Label>
              <Select value={formData.uf} onValueChange={(v) => handleChange('uf', v)}>
                <SelectTrigger className={errors.uf ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UF_OPTIONS.map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.uf && (
                <p className="text-xs text-destructive">{errors.uf}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="telefone">WhatsApp *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={errors.telefone ? 'border-destructive' : ''}
              />
              {errors.telefone && (
                <p className="text-xs text-destructive">{errors.telefone}</p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="aceite_termos"
              checked={formData.aceite_termos}
              onCheckedChange={(checked) => handleChange('aceite_termos', checked === true)}
              className={errors.aceite_termos ? 'border-destructive' : ''}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="aceite_termos"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Li e aceito os{' '}
                <Link to="/termos" target="_blank" className="text-primary hover:underline">
                  Termos de Uso
                </Link>
                {' '}e a{' '}
                <Link to="/politica-privacidade" target="_blank" className="text-primary hover:underline">
                  Política de Privacidade
                </Link>
              </label>
              {errors.aceite_termos && (
                <p className="text-xs text-destructive">{errors.aceite_termos}</p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 text-sm font-semibold" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Criar Conta'
            )}
          </Button>

          <Button 
            type="button" 
            variant="ghost" 
            className="w-full" 
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
