import { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGoogleCalendarEmbeds } from '@/hooks/useGoogleCalendarEmbeds';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfigurarGoogleCalendarDialog({ open, onOpenChange }: Props) {
  const { embeds, createEmbed, deleteEmbed } = useGoogleCalendarEmbeds();
  const [nome, setNome] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    if (!url.trim()) return;
    createEmbed.mutate(
      { nome: nome.trim() || 'Google Calendar', embed_url: url.trim() },
      { onSuccess: () => { setNome(''); setUrl(''); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Google Calendar</DialogTitle>
          <DialogDescription>
            Adicione calendários do Google para exibir os eventos junto com o planejamento.
            O calendário precisa estar compartilhado publicamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing embeds */}
          {embeds?.map((embed) => (
            <div key={embed.id} className="flex items-center gap-2 p-2 rounded-lg border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{embed.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{embed.embed_url}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteEmbed.mutate(embed.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {/* Add new */}
          <div className="space-y-2 border-t pt-4">
            <div>
              <Label className="text-xs">Nome (opcional)</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Agenda Gilson"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Email ou URL do calendário</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="gilson@empresa.com ou URL embed/iCal"
                className="h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!url.trim() || createEmbed.isPending}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>

          <div className="text-xs text-muted-foreground flex items-start gap-1.5 bg-muted/50 p-2 rounded">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Informe o email do calendário (ex: usuario@gmail.com) ou a URL embed/iCal.
              O calendário precisa estar público: Configurações → Permissões de acesso → Disponibilizar para o público.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
