import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, FileText, Trash2, Download } from 'lucide-react';
import { useEmpreendimentoDocumentos, useUploadDocumento, useDeleteDocumento } from '@/hooks/useEmpreendimentoDocumentos';
import { DOCUMENTO_TIPO_LABELS } from '@/types/empreendimentos.types';

interface DocumentosTabProps {
  empreendimentoId: string;
}

export function DocumentosTab({ empreendimentoId }: DocumentosTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: documentos, isLoading } = useEmpreendimentoDocumentos(empreendimentoId);
  const uploadMutation = useUploadDocumento();
  const deleteMutation = useDeleteDocumento();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadMutation.mutateAsync({
        empreendimentoId,
        file,
        tipo: 'outro',
        nome: file.name,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Documentos</h3>
            <p className="text-sm text-muted-foreground">{documentos?.length || 0} documentos</p>
          </div>
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <Plus className="h-4 w-4 mr-2" />
            Enviar Documento
          </Button>
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={handleFileSelect} />
        </div>

        {documentos && documentos.length > 0 ? (
          <div className="space-y-3">
            {documentos.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.nome}</p>
                    <p className="text-sm text-muted-foreground">{DOCUMENTO_TIPO_LABELS[doc.tipo]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: doc.id, empreendimentoId, arquivoUrl: doc.arquivo_url })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhum documento enviado</p>
        )}
      </CardContent>
    </Card>
  );
}
