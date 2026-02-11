import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Upload, Image, Trash2, Copy, Loader2 } from 'lucide-react';
import { useTemplateImagens, useUploadTemplateImagem, useDeleteTemplateImagem } from '@/hooks/useContratoTemplateImagens';
import { toast } from 'sonner';

interface TemplateImageUploadProps {
  templateId: string;
  onInsertImage?: (imgTag: string) => void;
}

export function TemplateImageUpload({ templateId, onInsertImage }: TemplateImageUploadProps) {
  const { data: imagens = [], isLoading } = useTemplateImagens(templateId);
  const { mutate: uploadImagem, isPending: isUploading } = useUploadTemplateImagem();
  const { mutate: deleteImagem } = useDeleteTemplateImagem();

  const [nome, setNome] = useState('');
  const [largura, setLargura] = useState('');
  const [altura, setAltura] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    // Get image dimensions
    const img = new window.Image();
    img.onload = () => {
      setLargura(String(img.width));
      setAltura(String(img.height));
    };
    img.src = URL.createObjectURL(file);

    if (!nome) {
      setNome(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !nome) {
      toast.error('Preencha o nome e selecione um arquivo');
      return;
    }

    uploadImagem({
      templateId,
      file,
      nome,
      largura: largura ? parseInt(largura) : undefined,
      altura: altura ? parseInt(altura) : undefined,
    }, {
      onSuccess: () => {
        setNome('');
        setLargura('');
        setAltura('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
    });
  };

  const handleCopyTag = (imagem: typeof imagens[0]) => {
    const imgTag = `<img src="${imagem.arquivo_url}" alt="${imagem.nome}"${imagem.largura ? ` width="${imagem.largura}"` : ''}${imagem.altura ? ` height="${imagem.altura}"` : ''} />`;
    navigator.clipboard.writeText(imgTag);
    toast.success('Tag HTML copiada!');
  };

  const handleInsertImage = (imagem: typeof imagens[0]) => {
    const imgTag = `<img src="${imagem.arquivo_url}" alt="${imagem.nome}"${imagem.largura ? ` width="${imagem.largura}"` : ''}${imagem.altura ? ` height="${imagem.altura}"` : ''} style="max-width: 100%;" />`;
    if (onInsertImage) {
      onInsertImage(imgTag);
    } else {
      navigator.clipboard.writeText(imgTag);
      toast.success('Tag HTML copiada para a área de transferência');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Image className="h-4 w-4" />
          Imagens do Template
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Form */}
        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Imagem</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Logo da Empresa"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="largura">Largura (px)</Label>
              <Input
                id="largura"
                type="number"
                value={largura}
                onChange={(e) => setLargura(e.target.value)}
                placeholder="auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altura">Altura (px)</Label>
              <Input
                id="altura"
                type="number"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                placeholder="auto"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="arquivo">Arquivo</Label>
            <Input
              id="arquivo"
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={isUploading || !nome}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Imagem
              </>
            )}
          </Button>
        </div>

        {/* Images List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : imagens.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma imagem cadastrada
          </p>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {imagens.map((imagem) => (
                <div
                  key={imagem.id}
                  className="flex items-center gap-3 p-2 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <img
                    src={imagem.arquivo_url}
                    alt={imagem.nome}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{imagem.nome}</p>
                    {imagem.largura && imagem.altura && (
                      <p className="text-xs text-muted-foreground">
                        {imagem.largura} x {imagem.altura}px
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleInsertImage(imagem)}
                      title="Inserir no editor"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover imagem?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A imagem será removida permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteImagem(imagem.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
