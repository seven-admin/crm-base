import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  FormDescription,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAddSignatario } from '@/hooks/useContratoSignatarios';
import { SIGNATARIO_TIPO_LABELS, type SignatarioTipo } from '@/types/assinaturas.types';
import { User } from 'lucide-react';

const formSchema = z.object({
  tipo: z.enum(['comprador', 'conjuge', 'testemunha_1', 'testemunha_2', 'representante_legal', 'incorporador']),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  cpf: z.string().optional(),
  ordem: z.number().min(1),
  obrigatorio: z.boolean()
});

type FormData = z.infer<typeof formSchema>;

interface SignatarioFormProps {
  open: boolean;
  onClose: () => void;
  contratoId: string;
  clienteNome?: string;
  clienteEmail?: string;
  clienteCpf?: string;
  nextOrder: number;
}

export function SignatarioForm({ 
  open, 
  onClose, 
  contratoId,
  clienteNome,
  clienteEmail,
  clienteCpf,
  nextOrder
}: SignatarioFormProps) {
  const addSignatario = useAddSignatario();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: 'comprador',
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      ordem: nextOrder,
      obrigatorio: true
    }
  });

  const handlePreencherCliente = () => {
    if (clienteNome) form.setValue('nome', clienteNome);
    if (clienteEmail) form.setValue('email', clienteEmail);
    if (clienteCpf) form.setValue('cpf', clienteCpf);
    form.setValue('tipo', 'comprador');
  };

  const onSubmit = async (data: FormData) => {
    await addSignatario.mutateAsync({
      contratoId,
      data: {
        tipo: data.tipo,
        nome: data.nome,
        email: data.email || undefined,
        telefone: data.telefone,
        cpf: data.cpf,
        ordem: data.ordem,
        obrigatorio: data.obrigatorio
      }
    });
    
    form.reset({
      tipo: 'comprador' as const,
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      ordem: nextOrder + 1,
      obrigatorio: true
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Signatário</DialogTitle>
          <DialogDescription>
            Adicione um signatário ao contrato
          </DialogDescription>
        </DialogHeader>

        {clienteNome && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={handlePreencherCliente}
            className="w-full"
          >
            <User className="h-4 w-4 mr-2" />
            Preencher com dados do cliente ({clienteNome})
          </Button>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(SIGNATARIO_TIPO_LABELS).map(([value, label]) => (
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
                name="ordem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormDescription>Para envio do convite</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="000.000.000-00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="obrigatorio"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Assinatura Obrigatória</FormLabel>
                    <FormDescription>
                      O contrato só avança com esta assinatura
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addSignatario.isPending}>
                {addSignatario.isPending ? 'Salvando...' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
