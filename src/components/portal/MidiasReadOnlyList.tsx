import { Loader2, Link as LinkIcon, ExternalLink, Image } from 'lucide-react';
import { useEmpreendimentoMidias } from '@/hooks/useEmpreendimentoMidias';

interface MidiasReadOnlyListProps {
  empreendimentoId: string;
}

export function MidiasReadOnlyList({ empreendimentoId }: MidiasReadOnlyListProps) {
  const { data: midias, isLoading } = useEmpreendimentoMidias(empreendimentoId);

  const links = midias?.filter(m => m.tipo === 'link') || [];
  const imagensVideos = midias?.filter(m => m.tipo !== 'link') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!midias?.length) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Nenhuma mídia disponível para este empreendimento.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Links */}
      {links.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Links ({links.length})
          </h4>
          <div className="space-y-2">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{link.nome}</p>
                  <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Galeria de imagens/vídeos */}
      {imagensVideos.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Image className="h-4 w-4" />
            Galeria ({imagensVideos.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {imagensVideos.map((midia) => (
              <div
                key={midia.id}
                className="relative aspect-video rounded-lg overflow-hidden bg-muted"
              >
                {midia.tipo === 'video' ? (
                  <video
                    src={midia.url}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <a href={midia.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={midia.url}
                      alt={midia.nome || 'Mídia do empreendimento'}
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
