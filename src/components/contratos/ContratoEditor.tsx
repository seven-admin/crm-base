import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, Eye, Code } from 'lucide-react';
import { useCreateContratoVersao, substituirVariaveisContrato } from '@/hooks/useContratos';
import { useActiveContratoVariaveis } from '@/hooks/useContratoVariaveis';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { Contrato } from '@/types/contratos.types';

interface ContratoEditorProps {
  contrato: Contrato;
  onClose: () => void;
}

export function ContratoEditor({ contrato, onClose }: ContratoEditorProps) {
  const { mutate: createVersao, isPending } = useCreateContratoVersao();
  const { data: variaveis = [] } = useActiveContratoVariaveis();
  
  const [conteudo, setConteudo] = useState(contrato.conteudo_html || contrato.template?.conteudo_html || '');
  const [motivoAlteracao, setMotivoAlteracao] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Transform variables for the RichTextEditor
  const editorVariables = variaveis.map(v => ({
    key: v.chave,
    label: v.label,
    example: v.exemplo || undefined,
  }));

  const handleSave = () => {
    createVersao({
      contrato_id: contrato.id,
      versao: contrato.versao + 1,
      conteudo_html: conteudo,
      motivo_alteracao: motivoAlteracao || undefined,
    }, {
      onSuccess: onClose,
    });
  };

  const previewContent = substituirVariaveisContrato(conteudo, contrato);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Editor de Contrato</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Editar' : 'Visualizar'}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Editor ou Preview */}
        {showPreview ? (
          <div className="border rounded-lg p-4 min-h-[400px]">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Conteúdo do Contrato</Label>
            <RichTextEditor
              value={conteudo}
              onChange={setConteudo}
              variables={editorVariables}
              placeholder="Digite o conteúdo do contrato..."
              minHeight="400px"
            />
          </div>
        )}

        {/* Motivo da alteração */}
        {!showPreview && (
          <div className="space-y-2">
            <Label>Motivo da Alteração</Label>
            <Input
              value={motivoAlteracao}
              onChange={(e) => setMotivoAlteracao(e.target.value)}
              placeholder="Descreva o que foi alterado..."
            />
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending || !conteudo}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? 'Salvando...' : 'Salvar Versão'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
