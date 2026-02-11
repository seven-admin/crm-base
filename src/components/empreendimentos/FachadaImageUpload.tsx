import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FachadaImageUploadProps {
  empreendimentoId: string;
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
}

export function FachadaImageUpload({
  empreendimentoId,
  currentImageUrl,
  onUploadComplete,
  onRemove,
}: FachadaImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem (JPEG, PNG, etc.)');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
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
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${empreendimentoId}/fachada-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('empreendimentos-midias')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('empreendimentos-midias')
        .getPublicUrl(fileName);

      onUploadComplete(publicUrl);
      setPreview(null);
      setFile(null);
      toast.success('Imagem enviada com sucesso!');
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
  };

  const inputId = `fachada-upload-${empreendimentoId}`;

  // Show current image if exists and no new file selected
  if (currentImageUrl && !preview) {
    return (
      <div className="space-y-2">
        <div className="relative inline-block">
          <img
            src={currentImageUrl}
            alt="Imagem da fachada"
            className="max-h-40 rounded-lg border border-border object-contain"
          />
          {onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Arraste uma nova imagem para substituir
        </p>
        <div
          className={`
            flex items-center justify-center p-4 border-2 border-dashed rounded-lg transition-colors cursor-pointer
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <Upload className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Substituir imagem</span>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      </div>
    );
  }

  // Show upload area or preview
  return (
    <div className="space-y-3">
      {!preview ? (
        <div
          className={`
            flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">
            Arraste a imagem aqui
          </p>
          <p className="text-xs text-muted-foreground">
            ou clique para selecionar (JPEG, PNG)
          </p>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview da fachada"
              className="max-h-40 rounded-lg border border-border object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
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
        </div>
      )}
    </div>
  );
}
