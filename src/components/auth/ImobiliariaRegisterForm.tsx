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

function formatarTelefone(value: string): string {
  const phone = value.replace(/\D/g, '');
  if (phone.length <= 2) return phone;
  if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
}

function formatarCNPJ(value: string): string {
  const cnpj = value.replace(/\D/g, '');
  if (cnpj.length <= 2) return cnpj;
  if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
  if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
  if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
}

function validarCNPJLocal(cnpj: string): boolean {
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const pesos1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  let soma = 0;
  for (let i = 0; i < 12; i++) soma += parseInt(c[i]) * pesos1[i];
  let r = soma % 11;
  if ((r < 2 ? 0 : 11 - r) !== parseInt(c[12])) return false;
  const pesos2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  soma = 0;
  for (let i = 0; i < 13; i++) soma += parseInt(c[i]) * pesos2[i];
  r = soma % 11;
  if ((r < 2 ? 0 : 11 - r) !== parseInt(c[13])) return false;
  return true;
}

const registerSchema = z.object({
  nome_imobiliaria: z.string().min(3, 'Nome da imobiliária deve ter no mínimo 3 caracteres'),
  cnpj: z.string().min(1, 'CNPJ é obrigatório').refine(
    (val) => validarCNPJLocal(val),
    { message: 'CNPJ inválido' }
  ),
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
});

interface ImobiliariaRegisterFormProps {
  onBack: () => void;
}

export function ImobiliariaRegisterForm({ onBack }: ImobiliariaRegisterFormProps) {
  const [formData, setFormData] = useState({
    nome_imobiliaria: '',
    cnpj: '',
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
      const response = await supabase.functions.invoke('register-imobiliaria', {
        body: {
          nome_imobiliaria: formData.nome_imobiliaria.trim(),
          cnpj: formData.cnpj || null,
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome_imobiliaria">Nome da Imobiliária *</Label>
              <Input
                id="nome_imobiliaria"
                value={formData.nome_imobiliaria}
                onChange={(e) => handleChange('nome_imobiliaria', e.target.value)}
                placeholder="Nome da imobiliária"
                className={errors.nome_imobiliaria ? 'border-destructive' : ''}
              />
              {errors.nome_imobiliaria && <p className="text-xs text-destructive">{errors.nome_imobiliaria}</p>}
            </div>

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
