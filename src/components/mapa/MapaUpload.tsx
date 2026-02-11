import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MapaUploadProps {
  empreendimentoId: string;
  onUploadComplete: (url: string, width: number, height: number) => void;
  onCancel?: () => void;
}

export const MapaUpload = React.forwardRef<HTMLDivElement, MapaUploadProps>(
  function MapaUpload({ empreendimentoId, onUploadComplete, onCancel }, ref) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFile = useCallback((selectedFile: File) => {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem (JPEG, PNG, etc.)');
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);

        // Get image dimensions
        const img = new window.Image();
        img.onload = () => {
          setDimensions({ width: img.width, height: img.height });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(selectedFile);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFile(droppedFile);
      },
      [handleFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
      setIsDragging(false);
    }, []);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) handleFile(selectedFile);
      },
      [handleFile]
    );

    const handleUpload = async () => {
      if (!file || !dimensions) return;

      setIsUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${empreendimentoId}/mapa-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('empreendimentos-midias')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('empreendimentos-midias')
          .getPublicUrl(fileName);

        onUploadComplete(publicUrl, dimensions.width, dimensions.height);
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        toast.error('Erro ao fazer upload da imagem');
      } finally {
        setIsUploading(false);
      }
    };

    const handleClear = () => {
      setPreview(null);
      setFile(null);
      setDimensions(null);
    };

    return (
      <Card ref={ref} className="border-dashed">
        <CardContent className="p-6">
          {!preview ? (
            <div
              className={`
                flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-colors cursor-pointer
                ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('mapa-upload-input')?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-1">
                Arraste a imagem do mapa aqui
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique para selecionar (JPEG, PNG)
              </p>
              <input
                id="mapa-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview do mapa"
                  className="w-full max-h-[400px] object-contain rounded-lg border border-border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {dimensions && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Image className="h-4 w-4" />
                  <span>
                    {dimensions.width} x {dimensions.height} pixels
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Confirmar Upload
                    </>
                  )}
                </Button>
                {onCancel && (
                  <Button variant="outline" onClick={onCancel} disabled={isUploading}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
