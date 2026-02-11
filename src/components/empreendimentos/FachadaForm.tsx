import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCreateFachada, useUpdateFachada, type Fachada } from '@/hooks/useFachadas';
import { FachadaImageUpload } from './FachadaImageUpload';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  imagem_url: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface FachadaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  fachada?: Fachada | null;
}

export function FachadaForm({ open, onOpenChange, empreendimentoId, fachada }: FachadaFormProps) {
  const createFachada = useCreateFachada();
  const updateFachada = useUpdateFachada();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      imagem_url: '',
    },
  });

  useEffect(() => {
    if (fachada) {
      form.reset({
        nome: fachada.nome || '',
        descricao: fachada.descricao || '',
        imagem_url: fachada.imagem_url || '',
      });
    } else {
      form.reset({
        nome: '',
        descricao: '',
        imagem_url: '',
      });
    }
  }, [fachada?.id, form]);

  const onSubmit = (data: FormData) => {
    const formData = {
      nome: data.nome,
      descricao: data.descricao || undefined,
      imagem_url: data.imagem_url || undefined,
    };

    if (fachada) {
      updateFachada.mutate(
        { id: fachada.id, empreendimentoId, data: formData },
        { onSuccess: () => { onOpenChange(false); form.reset(); } }
      );
    } else {
      createFachada.mutate(
        { empreendimentoId, data: formData },
        { onSuccess: () => { onOpenChange(false); form.reset(); } }
      );
    }
  };

  const isSubmitting = createFachada.isPending || updateFachada.isPending;
  const currentImageUrl = form.watch('imagem_url');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{fachada ? 'Editar Fachada' : 'Nova Fachada'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: F1, F2, Moderna" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição da fachada, cores, características..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imagem_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem da Fachada</FormLabel>
                  <FormControl>
                    <FachadaImageUpload
                      empreendimentoId={empreendimentoId}
                      currentImageUrl={currentImageUrl}
                      onUploadComplete={(url) => field.onChange(url)}
                      onRemove={() => field.onChange('')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : fachada ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
