import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Upload, Check, X, FileText } from 'lucide-react';
import { useCreateContratoDocumento, useUpdateContratoDocumento } from '@/hooks/useContratos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ContratoDocumento, DocumentoContratoStatus, TIPOS_DOCUMENTOS_CONTRATO } from '@/types/contratos.types';

const TIPOS_DOCUMENTOS = [
  'RG',
  'CPF',
  'Comprovante de Residência',
  'Comprovante de Renda',
  'Certidão de Casamento',
  'Procuração',
  'Contrato Assinado',
  'Outros'
] as const;

const STATUS_COLORS: Record<DocumentoContratoStatus, string> = {
  pendente: 'bg-slate-500',
  enviado: 'bg-blue-500',
  aprovado: 'bg-green-500',
  reprovado: 'bg-red-500',
};

const STATUS_LABELS: Record<DocumentoContratoStatus, string> = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
};

interface ChecklistDocumentosProps {
  contratoId: string;
  documentos: ContratoDocumento[];
}

export function ChecklistDocumentos({ contratoId, documentos }: ChecklistDocumentosProps) {
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({
    tipo: '',
    nome: '',
    obrigatorio: false,
  });
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { mutate: createDocumento } = useCreateContratoDocumento();
  const { mutate: updateDocumento } = useUpdateContratoDocumento();

  const handleAddDocument = () => {
    if (!newDoc.tipo || !newDoc.nome) return;

    createDocumento({
      contrato_id: contratoId,
      tipo: newDoc.tipo,
      nome: newDoc.nome,
      obrigatorio: newDoc.obrigatorio,
      status: 'pendente',
    }, {
      onSuccess: () => {
        setIsAddingDoc(false);
        setNewDoc({ tipo: '', nome: '', obrigatorio: false });
      },
    });
  };

  const handleFileUpload = async (docId: string, file: File) => {
    setUploadingId(docId);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${contratoId}/${docId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('contratos-documentos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contratos-documentos')
        .getPublicUrl(fileName);

      updateDocumento({
        id: docId,
        data: { arquivo_url: publicUrl, status: 'enviado' as DocumentoContratoStatus },
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload do arquivo');
    } finally {
      setUploadingId(null);
    }
  };

  const handleStatusChange = (docId: string, status: DocumentoContratoStatus) => {
    updateDocumento({ id: docId, data: { status } });
  };

  const obrigatorios = documentos.filter(d => d.obrigatorio);
  const opcionais = documentos.filter(d => !d.obrigatorio);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Checklist de Documentos</CardTitle>
        <Dialog open={isAddingDoc} onOpenChange={setIsAddingDoc}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newDoc.tipo}
                  onValueChange={(value) => setNewDoc(prev => ({ ...prev, tipo: value, nome: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTOS.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={newDoc.nome}
                  onChange={(e) => setNewDoc(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="obrigatorio"
                  checked={newDoc.obrigatorio}
                  onCheckedChange={(checked) => setNewDoc(prev => ({ ...prev, obrigatorio: !!checked }))}
                />
                <label htmlFor="obrigatorio" className="text-sm">Documento obrigatório</label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingDoc(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddDocument} disabled={!newDoc.tipo || !newDoc.nome}>
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Documentos Obrigatórios */}
        {obrigatorios.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-red-600">Obrigatórios</h4>
            <div className="space-y-2">
              {obrigatorios.map((doc) => (
                <DocumentoItem
                  key={doc.id}
                  documento={doc}
                  uploading={uploadingId === doc.id}
                  onUpload={(file) => handleFileUpload(doc.id, file)}
                  onStatusChange={(status) => handleStatusChange(doc.id, status)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Documentos Opcionais */}
        {opcionais.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Opcionais</h4>
            <div className="space-y-2">
              {opcionais.map((doc) => (
                <DocumentoItem
                  key={doc.id}
                  documento={doc}
                  uploading={uploadingId === doc.id}
                  onUpload={(file) => handleFileUpload(doc.id, file)}
                  onStatusChange={(status) => handleStatusChange(doc.id, status)}
                />
              ))}
            </div>
          </div>
        )}

        {documentos.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            Nenhum documento no checklist
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface DocumentoItemProps {
  documento: ContratoDocumento;
  uploading: boolean;
  onUpload: (file: File) => void;
  onStatusChange: (status: DocumentoContratoStatus) => void;
}

function DocumentoItem({ documento, uploading, onUpload, onStatusChange }: DocumentoItemProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">{documento.nome}</p>
          <p className="text-xs text-muted-foreground">{documento.tipo}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge className={`${STATUS_COLORS[documento.status]} text-white`}>
          {STATUS_LABELS[documento.status]}
        </Badge>
        
        {documento.status === 'pendente' && (
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <Button variant="outline" size="sm" asChild disabled={uploading}>
              <span>
                <Upload className="mr-1 h-3 w-3" />
                {uploading ? 'Enviando...' : 'Upload'}
              </span>
            </Button>
          </label>
        )}
        
        {documento.status === 'enviado' && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600"
              onClick={() => onStatusChange('aprovado')}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600"
              onClick={() => onStatusChange('reprovado')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {documento.arquivo_url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(documento.arquivo_url!, '_blank')}
          >
            Ver
          </Button>
        )}
      </div>
    </div>
  );
}
