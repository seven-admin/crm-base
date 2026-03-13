import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Trash2, ImageIcon, Loader2, Car, Home, Package } from 'lucide-react';
import { useDacaoAnexos, useUploadDacaoAnexo, useDeleteDacaoAnexo } from '@/hooks/useDacaoAnexos';
import { cn } from '@/lib/utils';

interface DacaoAnexosCardProps {
  negociacaoId?: string;
  readonly?: boolean;
}

const TIPO_DACAO_OPTIONS = [
  { value: 'carro', label: 'Carro', icon: Car },
  { value: 'imovel', label: 'Imóvel', icon: Home },
  { value: 'outro', label: 'Outro', icon: Package },
];

export function DacaoAnexosCard({ negociacaoId, readonly = false }: DacaoAnexosCardProps) {
  const [enabled, setEnabled] = useState(false);
  const [tipoDacao, setTipoDacao] = useState('carro');
  const [descricao, setDescricao] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: anexos = [] } = useDacaoAnexos(negociacaoId);
  const uploadAnexo = useUploadDacaoAnexo();
  const deleteAnexo = useDeleteDacaoAnexo();

  // Auto-enable if there are existing anexos
  const isEnabled = enabled || anexos.length > 0;

  const handleFiles = (files: FileList | null) => {
    if (!files || !negociacaoId) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      uploadAnexo.mutate({
        negociacaoId,
        file,
        tipoDacao,
        descricao: descricao || undefined,
      });
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Dação em Pagamento
          </CardTitle>
          {!readonly && (
            <div className="flex items-center gap-2">
              <Label htmlFor="dacao-toggle" className="text-sm text-muted-foreground">
                Envolve dação
              </Label>
              <Switch
                id="dacao-toggle"
                checked={isEnabled}
                onCheckedChange={setEnabled}
                disabled={anexos.length > 0}
              />
            </div>
          )}
        </div>
      </CardHeader>

      {isEnabled && (
        <CardContent className="space-y-4">
          {!negociacaoId ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Salve a proposta primeiro para adicionar imagens de dação.
            </p>
          ) : (
            <>
              {!readonly && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={tipoDacao} onValueChange={setTipoDacao}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPO_DACAO_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="flex items-center gap-1.5">
                                <opt.icon className="h-3.5 w-3.5" />
                                {opt.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Ex: Honda Civic 2022"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                    )}
                  >
                    {uploadAnexo.isPending ? (
                      <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">
                          Arraste imagens ou clique para selecionar
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          JPG, PNG, WebP
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>
              )}

              {/* Gallery */}
              {anexos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {anexos.map((anexo) => {
                    const tipoInfo = TIPO_DACAO_OPTIONS.find((t) => t.value === anexo.tipo_dacao);
                    return (
                      <div key={anexo.id} className="relative group rounded-lg overflow-hidden border">
                        <img
                          src={anexo.arquivo_url}
                          alt={anexo.descricao || anexo.arquivo_nome || 'Dação'}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-1 left-1 right-1 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex flex-col gap-0.5">
                            {tipoInfo && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 w-fit">
                                {tipoInfo.label}
                              </Badge>
                            )}
                            {anexo.descricao && (
                              <span className="text-[10px] text-white truncate max-w-[120px]">
                                {anexo.descricao}
                              </span>
                            )}
                          </div>
                          {!readonly && (
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                deleteAnexo.mutate({
                                  id: anexo.id,
                                  negociacaoId: negociacaoId!,
                                  arquivoUrl: anexo.arquivo_url,
                                })
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
