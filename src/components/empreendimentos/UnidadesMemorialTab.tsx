import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Copy, ClipboardPaste, FileText } from 'lucide-react';
import { useUnidades } from '@/hooks/useUnidades';
import { useBlocos } from '@/hooks/useBlocos';
import { useFachadas } from '@/hooks/useFachadas';
import { useUpdateUnidadesMemorial } from '@/hooks/useUnidades';
import { UNIDADE_STATUS_LABELS, UNIDADE_STATUS_COLORS } from '@/types/empreendimentos.types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { parseDecimalInput } from '@/lib/utils';

interface UnidadesMemorialTabProps {
  empreendimentoId: string;
}

interface EditedMemorial {
  descricao?: string;
  observacoes?: string;
  fachada_id?: string | null;
  area_privativa?: number;
}

export function UnidadesMemorialTab({ empreendimentoId }: UnidadesMemorialTabProps) {
  const [blocoFilter, setBlocoFilter] = useState<string>('all');
  const [editedValues, setEditedValues] = useState<Record<string, EditedMemorial>>({});
  const [areaInputs, setAreaInputs] = useState<Record<string, string>>({});
  const [copiedDescricao, setCopiedDescricao] = useState<string | null>(null);
  const [copiedObservacoes, setCopiedObservacoes] = useState<string | null>(null);
  const [copiedFachada, setCopiedFachada] = useState<{ id: string; nome: string } | null>(null);

  const { data: unidades = [], isLoading } = useUnidades(empreendimentoId, {
    blocoId: blocoFilter !== 'all' ? blocoFilter : undefined,
  });
  const { data: blocos = [] } = useBlocos(empreendimentoId);
  const { data: fachadas = [] } = useFachadas(empreendimentoId);
  const updateMemorial = useUpdateUnidadesMemorial();

  const hasChanges = Object.keys(editedValues).length > 0;

  const handleAreaChange = (unidadeId: string, value: string) => {
    if (/^[\d.,]*$/.test(value)) {
      setAreaInputs(prev => ({ ...prev, [unidadeId]: value }));
      const numValue = parseDecimalInput(value);
      setEditedValues(prev => ({
        ...prev,
        [unidadeId]: {
          ...prev[unidadeId],
          area_privativa: numValue > 0 ? numValue : undefined,
        },
      }));
    }
  };

  const handleDescricaoChange = (unidadeId: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [unidadeId]: {
        ...prev[unidadeId],
        descricao: value,
      },
    }));
  };

  const handleObservacoesChange = (unidadeId: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [unidadeId]: {
        ...prev[unidadeId],
        observacoes: value,
      },
    }));
  };

  const handleFachadaChange = (unidadeId: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [unidadeId]: {
        ...prev[unidadeId],
        fachada_id: value === 'none' ? null : value,
      },
    }));
  };

  const copyDescricao = (value: string) => {
    setCopiedDescricao(value);
    toast.success('Descrição copiada!');
  };

  const pasteDescricaoToAll = () => {
    if (!copiedDescricao) return;
    
    const newEditedValues = { ...editedValues };
    unidades.forEach(unidade => {
      newEditedValues[unidade.id] = {
        ...newEditedValues[unidade.id],
        descricao: copiedDescricao,
      };
    });
    setEditedValues(newEditedValues);
    toast.success(`Descrição colada em ${unidades.length} unidades!`);
  };

  const copyObservacoes = (value: string) => {
    setCopiedObservacoes(value);
    toast.success('Observações copiadas!');
  };

  const pasteObservacoesToAll = () => {
    if (!copiedObservacoes) return;
    
    const newEditedValues = { ...editedValues };
    unidades.forEach(unidade => {
      newEditedValues[unidade.id] = {
        ...newEditedValues[unidade.id],
        observacoes: copiedObservacoes,
      };
    });
    setEditedValues(newEditedValues);
    toast.success(`Observações coladas em ${unidades.length} unidades!`);
  };

  const copyFachada = (id: string, nome: string) => {
    setCopiedFachada({ id, nome });
    toast.success(`Fachada "${nome}" copiada!`);
  };

  const pasteFachadaToAll = () => {
    if (!copiedFachada) return;
    
    const newEditedValues = { ...editedValues };
    unidades.forEach(unidade => {
      newEditedValues[unidade.id] = {
        ...newEditedValues[unidade.id],
        fachada_id: copiedFachada.id,
      };
    });
    setEditedValues(newEditedValues);
    toast.success(`Fachada "${copiedFachada.nome}" aplicada em ${unidades.length} unidades!`);
  };

  const handleSave = () => {
    const updates = Object.entries(editedValues)
      .filter(([_, values]) => 
        values.descricao !== undefined || 
        values.observacoes !== undefined ||
        values.fachada_id !== undefined ||
        values.area_privativa !== undefined
      )
      .map(([id, values]) => ({
        id,
        descricao: values.descricao,
        observacoes: values.observacoes,
        fachada_id: values.fachada_id,
        area_privativa: values.area_privativa,
      }));

    if (updates.length > 0) {
      updateMemorial.mutate(
        { empreendimentoId, updates },
        {
          onSuccess: () => {
            setEditedValues({});
            setAreaInputs({});
          },
        }
      );
    }
  };

  const getDisplayArea = (unidadeId: string, originalArea?: number | null) => {
    if (areaInputs[unidadeId] !== undefined) {
      return areaInputs[unidadeId];
    }
    return originalArea?.toString().replace('.', ',') || '';
  };

  const getDisplayDescricao = (unidadeId: string, originalDescricao?: string | null) => {
    if (editedValues[unidadeId]?.descricao !== undefined) {
      return editedValues[unidadeId].descricao;
    }
    return originalDescricao || '';
  };

  const getDisplayObservacoes = (unidadeId: string, originalObservacoes?: string | null) => {
    if (editedValues[unidadeId]?.observacoes !== undefined) {
      return editedValues[unidadeId].observacoes;
    }
    return originalObservacoes || '';
  };

  const getDisplayFachadaId = (unidadeId: string, originalFachadaId?: string | null) => {
    if (editedValues[unidadeId]?.fachada_id !== undefined) {
      return editedValues[unidadeId].fachada_id || undefined;
    }
    return originalFachadaId || undefined;
  };

  const isModified = (unidadeId: string) => !!editedValues[unidadeId];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Memorial, Fachadas e Observações
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Edite fachadas, descrições e observações em lote. Use os botões de copiar/colar para replicar valores.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros e Ações */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={blocoFilter} onValueChange={setBlocoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os blocos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os blocos/quadras</SelectItem>
                {blocos.map((bloco) => (
                  <SelectItem key={bloco.id} value={bloco.id}>
                    {bloco.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {copiedFachada && (
              <Button
                variant="outline"
                size="sm"
                onClick={pasteFachadaToAll}
              >
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Colar Fachada ({copiedFachada.nome})
              </Button>
            )}
            {copiedDescricao && (
              <Button
                variant="outline"
                size="sm"
                onClick={pasteDescricaoToAll}
              >
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Colar Descrição
              </Button>
            )}
            {copiedObservacoes && (
              <Button
                variant="outline"
                size="sm"
                onClick={pasteObservacoesToAll}
              >
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Colar Obs.
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || updateMemorial.isPending}
            >
              {updateMemorial.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Número</TableHead>
                <TableHead className="w-[100px]">Bloco</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[120px]">Área (m²)</TableHead>
                <TableHead className="w-[180px]">Fachada</TableHead>
                <TableHead className="min-w-[280px]">Descrição / Memorial</TableHead>
                <TableHead className="min-w-[220px]">Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma unidade encontrada
                  </TableCell>
                </TableRow>
              ) : (
                unidades.map((unidade) => {
                  const currentFachadaId = getDisplayFachadaId(unidade.id, unidade.fachada_id);
                  const currentFachada = fachadas.find(f => f.id === currentFachadaId);
                  
                  return (
                    <TableRow 
                      key={unidade.id}
                      className={cn(isModified(unidade.id) && 'bg-amber-50 dark:bg-amber-950/20')}
                    >
                      <TableCell className="font-medium">{unidade.numero}</TableCell>
                      <TableCell>{unidade.bloco?.nome || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={cn('text-xs', UNIDADE_STATUS_COLORS[unidade.status])}
                        >
                          {UNIDADE_STATUS_LABELS[unidade.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={getDisplayArea(unidade.id, unidade.area_privativa)}
                          onChange={(e) => handleAreaChange(unidade.id, e.target.value)}
                          className="h-8 w-full"
                          placeholder="0,00"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Select 
                            value={currentFachadaId || 'none'} 
                            onValueChange={(value) => handleFachadaChange(unidade.id, value)}
                          >
                            <SelectTrigger className="w-[140px] h-9 text-sm">
                              <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma</SelectItem>
                              {fachadas.map((fachada) => (
                                <SelectItem key={fachada.id} value={fachada.id}>
                                  {fachada.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {currentFachada && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0"
                              onClick={() => copyFachada(currentFachada.id, currentFachada.nome)}
                              title="Copiar fachada"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Textarea
                            value={getDisplayDescricao(unidade.id, unidade.descricao)}
                            onChange={(e) => handleDescricaoChange(unidade.id, e.target.value)}
                            className="min-h-[60px] text-sm resize-y"
                            placeholder="Descrição do lote/unidade..."
                          />
                          {getDisplayDescricao(unidade.id, unidade.descricao) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => copyDescricao(getDisplayDescricao(unidade.id, unidade.descricao) || '')}
                              title="Copiar descrição"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Textarea
                            value={getDisplayObservacoes(unidade.id, unidade.observacoes)}
                            onChange={(e) => handleObservacoesChange(unidade.id, e.target.value)}
                            className="min-h-[60px] text-sm resize-y"
                            placeholder="Observações internas..."
                          />
                          {getDisplayObservacoes(unidade.id, unidade.observacoes) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => copyObservacoes(getDisplayObservacoes(unidade.id, unidade.observacoes) || '')}
                              title="Copiar observações"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {hasChanges && (
          <p className="text-sm text-muted-foreground">
            {Object.keys(editedValues).length} unidade(s) modificada(s)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
