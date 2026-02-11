import { useState, useCallback } from 'react';
import { Upload, X, Link2, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBriefingReferencias, useAddBriefingReferencia, useDeleteBriefingReferencia } from '@/hooks/useBriefingReferencias';
import type { BriefingReferencia } from '@/types/briefings.types';

interface BriefingReferenciasProps {
  briefingId: string;
  readOnly?: boolean;
}

export function BriefingReferencias({ briefingId, readOnly = false }: BriefingReferenciasProps) {
  const { data: referencias = [], isLoading } = useBriefingReferencias(briefingId);
  const { mutate: addRef, isPending: isAdding } = useAddBriefingReferencia();
  const { mutate: deleteRef } = useDeleteBriefingReferencia();

  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitulo, setLinkTitulo] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      addRef({ briefingId, tipo: 'imagem', file });
    });
  }, [briefingId, addRef]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    addRef({ briefingId, tipo: 'link', url: linkUrl.trim(), titulo: linkTitulo.trim() || undefined });
    setLinkUrl('');
    setLinkTitulo('');
  };

  const imagens = referencias.filter(r => r.tipo === 'imagem');
  const links = referencias.filter(r => r.tipo === 'link');

  if (isLoading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando referências...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {!readOnly && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            input.onchange = () => input.files && handleFiles(input.files);
            input.click();
          }}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isAdding ? 'Enviando...' : 'Arraste imagens ou clique para selecionar'}
          </p>
        </div>
      )}

      {/* Image gallery */}
      {imagens.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Imagens de Referência</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {imagens.map(img => (
              <ImageCard key={img.id} referencia={img} onDelete={!readOnly ? () => deleteRef(img) : undefined} />
            ))}
          </div>
        </div>
      )}

      {/* Add link */}
      {!readOnly && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Adicionar Link de Referência</p>
          <div className="flex gap-2">
            <Input
              placeholder="https://..."
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Título (opcional)"
              value={linkTitulo}
              onChange={e => setLinkTitulo(e.target.value)}
              className="w-40"
            />
            <Button type="button" size="icon" variant="outline" onClick={handleAddLink} disabled={!linkUrl.trim() || isAdding}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Links list */}
      {links.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Links de Referência</p>
          <div className="space-y-1">
            {links.map(link => (
              <div key={link.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">
                  {link.titulo || link.url}
                </a>
                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                {!readOnly && (
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteRef(link)}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImageCard({ referencia, onDelete }: { referencia: BriefingReferencia; onDelete?: () => void }) {
  return (
    <div className="relative group rounded-lg overflow-hidden border">
      <a href={referencia.url} target="_blank" rel="noopener noreferrer">
        <img src={referencia.url} alt={referencia.titulo || 'Referência'} className="w-full h-32 object-cover hover:opacity-80 transition-opacity" />
      </a>
      {onDelete && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onDelete}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
