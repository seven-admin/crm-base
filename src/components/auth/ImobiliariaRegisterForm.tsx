import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { CheckCircle2, ArrowLeft, Loader2, Building2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { validarCPF, validarCNPJ, formatarCPF, formatarCNPJ, formatarTelefone } from '@/lib/documentUtils';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

type TipoPessoa = 'fisica' | 'juridica';

const baseSchema = z.object({
  tipo_pessoa: z.enum(['fisica', 'juridica']),
  nome_imobiliaria: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z.string().optional(),
  cpf: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  gestor_nome: z.string().min(3, 'Nome do gestor deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  aceite_termos: z.literal(true, { errorMap: () => ({ message: 'Você deve aceitar os termos de uso' }) })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.tipo_pessoa === 'juridica') {
    return data.cnpj && validarCNPJ(data.cnpj);
  }
  return true;
}, {
  message: 'CNPJ inválido',
  path: ['cnpj'],
}).refine((data) => {
  if (data.tipo_pessoa === 'fisica') {
    return data.cpf && validarCPF(data.cpf);
  }
  return true;
}, {
  message: 'CPF inválido',
  path: ['cpf'],
});

interface ImobiliariaRegisterFormProps {
  onBack: () => void;
}

export function ImobiliariaRegisterForm({ onBack }: ImobiliariaRegisterFormProps) {
  const [formData, setFormData] = useState({
    tipo_pessoa: 'juridica' as TipoPessoa,
    nome_imobiliaria: '',
    cnpj: '',
    cpf: '',
    cidade: '',
    uf: '',
    telefone: '',
    whatsapp: '',
    gestor_nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    aceite_termos: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (field: string, value: string | boolean) => {
    let formattedValue = value;
    if (field === 'cnpj' && typeof value === 'string') {
      formattedValue = formatarCNPJ(value);
    } else if (field === 'cpf' && typeof value === 'string') {
      formattedValue = formatarCPF(value);
    } else if ((field === 'telefone' || field === 'whatsapp') && typeof value === 'string') {
      formattedValue = formatarTelefone(value);
    }
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    const validation = baseSchema.safeParse(formData);
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
      const response = await supabase.functions.invoke('register-imobiliaria', {
        body: {
          tipo_pessoa: formData.tipo_pessoa,
          nome_imobiliaria: formData.nome_imobiliaria.trim(),
          cnpj: formData.tipo_pessoa === 'juridica' ? formData.cnpj : null,
          cpf: formData.tipo_pessoa === 'fisica' ? formData.cpf : null,
          cidade: formData.cidade.trim() || null,
          uf: formData.uf || null,
          telefone: formData.telefone || null,
          whatsapp: formData.whatsapp || null,
          gestor_nome: formData.gestor_nome.trim(),
          email: formData.email.trim(),
          senha: formData.password
        }
      });

      if (response.error) {
        let errorMsg = 'Erro ao processar cadastro';
        try {
          const errorBody = await response.error.context?.json();
          if (errorBody?.error) errorMsg = errorBody.error;
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
            Sua imobiliária foi cadastrada e já está ativa.
            <br /><br />
            Você já pode fazer login e começar a cadastrar seus corretores.
          </p>
          <Button onClick={onBack} className="w-full">
            Fazer Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-2xl">
      <CardHeader className="text-center pb-2 pt-6">
        <CardTitle className="text-xl font-bold">Cadastro de Imobiliária</CardTitle>
        <CardDescription className="text-sm mt-1">
          Preencha os dados para criar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {apiError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              {apiError}
            </div>
          )}

          {/* Dados da Imobiliária */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados da Imobiliária</h3>
          </div>

          {/* Tipo Pessoa Toggle */}
          <div className="space-y-2">
            <Label>Tipo de Pessoa *</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange('tipo_pessoa', 'juridica')}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors text-sm',
                  formData.tipo_pessoa === 'juridica'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-input hover:bg-accent'
                )}
              >
                <Building2 className="h-4 w-4" />
                Pessoa Jurídica
              </button>
              <button
                type="button"
                onClick={() => handleChange('tipo_pessoa', 'fisica')}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors text-sm',
                  formData.tipo_pessoa === 'fisica'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-input hover:bg-accent'
                )}
              >
                <User className="h-4 w-4" />
                Pessoa Física
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome_imobiliaria">
                {formData.tipo_pessoa === 'juridica' ? 'Nome da Imobiliária' : 'Nome Fantasia'} *
              </Label>
              <Input
                id="nome_imobiliaria"
                value={formData.nome_imobiliaria}
                onChange={(e) => handleChange('nome_imobiliaria', e.target.value)}
                placeholder={formData.tipo_pessoa === 'juridica' ? 'Nome da imobiliária' : 'Nome fantasia'}
                className={errors.nome_imobiliaria ? 'border-destructive' : ''}
              />
              {errors.nome_imobiliaria && <p className="text-xs text-destructive">{errors.nome_imobiliaria}</p>}
            </div>

            {/* CNPJ (PJ) ou CPF (PF) */}
            {formData.tipo_pessoa === 'juridica' ? (
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleChange('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className={errors.cnpj ? 'border-destructive' : ''}
                />
                {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj}</p>}
              </div>
            ) : (
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
                {errors.cpf && <p className="text-xs text-destructive">{errors.cpf}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">Estado</Label>
              <Select value={formData.uf} onValueChange={(v) => handleChange('uf', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UF_OPTIONS.map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="(00) 0000-0000"
                maxLength={15}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>

          {/* Dados do Gestor */}
          <div className="space-y-1 pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados do Gestor</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gestor_nome">Nome Completo *</Label>
              <Input
                id="gestor_nome"
                value={formData.gestor_nome}
                onChange={(e) => handleChange('gestor_nome', e.target.value)}
                placeholder="Nome do gestor"
                className={errors.gestor_nome ? 'border-destructive' : ''}
              />
              {errors.gestor_nome && <p className="text-xs text-destructive">{errors.gestor_nome}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="gestor@imobiliaria.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
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
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
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
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
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
              {errors.aceite_termos && <p className="text-xs text-destructive">{errors.aceite_termos}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Criar Conta'
            )}
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
