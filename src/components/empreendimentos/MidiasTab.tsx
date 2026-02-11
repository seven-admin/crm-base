import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Star, Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { useEmpreendimentoMidias, useUploadMidia, useSetMidiaCapa, useDeleteMidia, useAddMidiaLink } from '@/hooks/useEmpreendimentoMidias';

interface MidiasTabProps {
  empreendimentoId: string;
}

export function MidiasTab({ empreendimentoId }: MidiasTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkNome, setLinkNome] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  const { data: midias, isLoading } = useEmpreendimentoMidias(empreendimentoId);
  const uploadMutation = useUploadMidia();
  const setCapaMutation = useSetMidiaCapa();
  const deleteMutation = useDeleteMidia();
  const addLinkMutation = useAddMidiaLink();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const tipo = file.type.startsWith('video/') ? 'video' : 'imagem';
      await uploadMutation.mutateAsync({ empreendimentoId, file, tipo, isCapa: !midias?.length });
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkNome.trim() || !linkUrl.trim()) return;
    
    await addLinkMutation.mutateAsync({
      empreendimentoId,
      nome: linkNome.trim(),
      url: linkUrl.trim(),
    });
    
    setLinkNome('');
    setLinkUrl('');
  };

  // Separar mídias por tipo
  const links = midias?.filter(m => m.tipo === 'link') || [];
  const imagensVideos = midias?.filter(m => m.tipo !== 'link') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seção de Links */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Links Externos
          </h3>
          
          {/* Formulário para adicionar link */}
          <form onSubmit={handleAddLink} className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Label htmlFor="linkNome" className="sr-only">Título do Link</Label>
              <Input
                id="linkNome"
                placeholder="Título do link"
                value={linkNome}
                onChange={(e) => setLinkNome(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="linkUrl" className="sr-only">URL</Label>
              <Input
                id="linkUrl"
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <Button 
              type="submit" 
              disabled={!linkNome.trim() || !linkUrl.trim() || addLinkMutation.isPending}
            >
              {addLinkMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </form>

          {/* Lista de links */}
          {links.length > 0 ? (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{link.nome}</p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                      >
                        {link.url}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate({ 
                      id: link.id, 
                      empreendimentoId, 
                      url: link.url, 
                      tipo: 'link' 
                    })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Nenhum link cadastrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Seção de Imagens e Vídeos */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Imagens e Vídeos</h3>
              <p className="text-sm text-muted-foreground">{imagensVideos.length} arquivos</p>
            </div>
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Plus className="h-4 w-4 mr-2" />
              Enviar Mídia
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          </div>

          {imagensVideos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagensVideos.map((midia) => (
                <div key={midia.id} className="relative group aspect-video rounded-lg overflow-hidden bg-muted">
                  {midia.tipo === 'video' ? (
                    <video src={midia.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={midia.url} alt={midia.nome || ''} className="w-full h-full object-cover" />
                  )}
                  {midia.is_capa && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Star className="h-3 w-3" /> Capa
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!midia.is_capa && (
                      <Button size="sm" variant="secondary" onClick={() => setCapaMutation.mutate({ id: midia.id, empreendimentoId })}>
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: midia.id, empreendimentoId, url: midia.url, tipo: midia.tipo })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma mídia enviada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
