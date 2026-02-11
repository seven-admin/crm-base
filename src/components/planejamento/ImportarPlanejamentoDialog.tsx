import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  X 
} from 'lucide-react';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { usePlanejamentoStatus } from '@/hooks/usePlanejamentoStatus';
import { useFuncionariosSeven } from '@/hooks/useFuncionariosSeven';
import { usePlanejamentoItens } from '@/hooks/usePlanejamentoItens';
import type { PlanejamentoItemCreate } from '@/types/planejamento.types';

interface ImportarPlanejamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
}

type Step = 'upload' | 'map-columns' | 'map-values' | 'preview' | 'result';

interface ColumnMapping {
  item: string;
  fase: string;
  status: string;
  responsavel: string;
  data_inicio: string;
  data_fim: string;
  obs: string;
}

interface ValueMapping {
  fases: Record<string, string>;
  status: Record<string, string>;
  responsaveis: Record<string, string>;
}

interface ParsedRow {
  item: string;
  fase: string;
  status: string;
  responsavel: string;
  data_inicio: string;
  data_fim: string;
  obs: string;
  errors: string[];
  warnings: string[];
}

interface ImportResult {
  total: number;
  success: number;
  errors: number;
  errorDetails: string[];
}

const COLUMN_ALIASES: Record<keyof ColumnMapping, string[]> = {
  item: ['tarefa', 'task', 'item', 'nome', 'descricao', 'descrição', 'atividade'],
  fase: ['fase', 'etapa', 'phase', 'categoria'],
  status: ['status', 'situacao', 'situação', 'estado', 'state'],
  responsavel: ['responsavel', 'responsável', 'owner', 'assignee', 'dono'],
  data_inicio: ['inicio', 'início', 'data_inicio', 'start', 'data inicio'],
  data_fim: ['fim', 'término', 'termino', 'data_fim', 'end', 'prazo', 'data fim'],
  obs: ['obs', 'observacao', 'observação', 'observações', 'notes', 'comentario', 'comentário'],
};

const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const parseDate = (value: string | number): string | null => {
  if (!value) return null;
  
  // Handle Excel serial date numbers
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  
  const str = String(value).trim();
  if (!str) return null;
  
  // Try dd/mm/yyyy
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try yyyy-mm-dd
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try mm/dd/yyyy
  const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
};

export function ImportarPlanejamentoDialog({
  open,
  onOpenChange,
  empreendimentoId,
}: ImportarPlanejamentoDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [fileData, setFileData] = useState<Record<string, unknown>[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    item: '',
    fase: '',
    status: '',
    responsavel: '',
    data_inicio: '',
    data_fim: '',
    obs: '',
  });
  const [valueMapping, setValueMapping] = useState<ValueMapping>({
    fases: {},
    status: {},
    responsaveis: {},
  });
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { fases } = usePlanejamentoFases();
  const { statusList } = usePlanejamentoStatus();
  const { data: funcionarios } = useFuncionariosSeven();
  const { createItemsBulk } = usePlanejamentoItens({ empreendimento_id: empreendimentoId });

  const resetState = useCallback(() => {
    setStep('upload');
    setFileData([]);
    setFileColumns([]);
    setColumnMapping({
      item: '',
      fase: '',
      status: '',
      responsavel: '',
      data_inicio: '',
      data_fim: '',
      obs: '',
    });
    setValueMapping({
      fases: {},
      status: {},
      responsaveis: {},
    });
    setParsedRows([]);
    setImportResult(null);
    setIsImporting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        if (jsonData.length === 0) {
          return;
        }

        const columns = Object.keys(jsonData[0] as Record<string, unknown>);
        setFileColumns(columns);
        setFileData(jsonData as Record<string, unknown>[]);

        // Auto-detect column mappings
        const autoMapping: ColumnMapping = {
          item: '',
          fase: '',
          status: '',
          responsavel: '',
          data_inicio: '',
          data_fim: '',
          obs: '',
        };

        columns.forEach((col) => {
          const normalizedCol = normalizeString(col);
          (Object.keys(COLUMN_ALIASES) as (keyof ColumnMapping)[]).forEach((field) => {
            if (!autoMapping[field]) {
              const aliases = COLUMN_ALIASES[field];
              if (aliases.some((alias) => normalizedCol.includes(normalizeString(alias)))) {
                autoMapping[field] = col;
              }
            }
          });
        });

        setColumnMapping(autoMapping);
        setStep('map-columns');
      } catch (error) {
        console.error('Error parsing file:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = document.createElement('input');
      input.type = 'file';
      input.files = e.dataTransfer.files;
      handleFileUpload({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  }, [handleFileUpload]);

  const extractUniqueValues = useCallback(() => {
    const fasesSet = new Set<string>();
    const statusSet = new Set<string>();
    const responsaveisSet = new Set<string>();

    fileData.forEach((row) => {
      if (columnMapping.fase && row[columnMapping.fase]) {
        fasesSet.add(String(row[columnMapping.fase]).trim());
      }
      if (columnMapping.status && row[columnMapping.status]) {
        statusSet.add(String(row[columnMapping.status]).trim());
      }
      if (columnMapping.responsavel && row[columnMapping.responsavel]) {
        responsaveisSet.add(String(row[columnMapping.responsavel]).trim());
      }
    });

    // Auto-map values
    const newValueMapping: ValueMapping = {
      fases: {},
      status: {},
      responsaveis: {},
    };

    fasesSet.forEach((value) => {
      const normalized = normalizeString(value);
      const match = fases?.find((f) => normalizeString(f.nome) === normalized);
      if (match) {
        newValueMapping.fases[value] = match.id;
      }
    });

    statusSet.forEach((value) => {
      const normalized = normalizeString(value);
      const match = statusList?.find((s) => normalizeString(s.nome) === normalized);
      if (match) {
        newValueMapping.status[value] = match.id;
      }
    });

    responsaveisSet.forEach((value) => {
      const normalized = normalizeString(value);
      const match = funcionarios?.find((f) => normalizeString(f.full_name || '') === normalized);
      if (match) {
        newValueMapping.responsaveis[value] = match.id;
      }
    });

    setValueMapping(newValueMapping);
  }, [fileData, columnMapping, fases, statusList, funcionarios]);

  const handleNextFromColumns = useCallback(() => {
    extractUniqueValues();
    setStep('map-values');
  }, [extractUniqueValues]);

  const processRows = useCallback(() => {
    const rows: ParsedRow[] = fileData.map((row) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      const item = columnMapping.item ? String(row[columnMapping.item] || '').trim() : '';
      const faseValue = columnMapping.fase ? String(row[columnMapping.fase] || '').trim() : '';
      const statusValue = columnMapping.status ? String(row[columnMapping.status] || '').trim() : '';
      const responsavelValue = columnMapping.responsavel ? String(row[columnMapping.responsavel] || '').trim() : '';
      const dataInicioValue = columnMapping.data_inicio ? row[columnMapping.data_inicio] : '';
      const dataFimValue = columnMapping.data_fim ? row[columnMapping.data_fim] : '';
      const obs = columnMapping.obs ? String(row[columnMapping.obs] || '').trim() : '';

      if (!item) errors.push('Item obrigatório');
      if (!faseValue) errors.push('Fase obrigatória');
      if (!statusValue) errors.push('Status obrigatório');

      if (faseValue && !valueMapping.fases[faseValue]) {
        errors.push(`Fase "${faseValue}" não mapeada`);
      }
      if (statusValue && !valueMapping.status[statusValue]) {
        errors.push(`Status "${statusValue}" não mapeado`);
      }
      if (responsavelValue && !valueMapping.responsaveis[responsavelValue]) {
        warnings.push(`Responsável "${responsavelValue}" não mapeado`);
      }

      const dataInicio = parseDate(dataInicioValue as string | number);
      const dataFim = parseDate(dataFimValue as string | number);

      if (dataInicioValue && !dataInicio) {
        warnings.push('Data início inválida');
      }
      if (dataFimValue && !dataFim) {
        warnings.push('Data fim inválida');
      }

      return {
        item,
        fase: faseValue,
        status: statusValue,
        responsavel: responsavelValue,
        data_inicio: dataInicio || '',
        data_fim: dataFim || '',
        obs,
        errors,
        warnings,
      };
    });

    setParsedRows(rows);
    setStep('preview');
  }, [fileData, columnMapping, valueMapping]);

  const handleImport = useCallback(async () => {
    setIsImporting(true);

    const validRows = parsedRows.filter((row) => row.errors.length === 0);
    const itemsToCreate: PlanejamentoItemCreate[] = validRows.map((row, index) => ({
      empreendimento_id: empreendimentoId,
      item: row.item,
      fase_id: valueMapping.fases[row.fase],
      status_id: valueMapping.status[row.status],
      responsavel_tecnico_id: valueMapping.responsaveis[row.responsavel] || null,
      data_inicio: row.data_inicio || null,
      data_fim: row.data_fim || null,
      obs: row.obs || null,
      ordem: index + 1,
    }));

    try {
      await createItemsBulk.mutateAsync(itemsToCreate);
      setImportResult({
        total: parsedRows.length,
        success: validRows.length,
        errors: parsedRows.length - validRows.length,
        errorDetails: parsedRows
          .filter((row) => row.errors.length > 0)
          .map((row) => `Linha "${row.item}": ${row.errors.join(', ')}`),
      });
      setStep('result');
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  }, [parsedRows, valueMapping, empreendimentoId, createItemsBulk]);

  const getStepProgress = () => {
    switch (step) {
      case 'upload': return 0;
      case 'map-columns': return 25;
      case 'map-values': return 50;
      case 'preview': return 75;
      case 'result': return 100;
      default: return 0;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'upload': return 'Upload do Arquivo';
      case 'map-columns': return 'Mapear Colunas';
      case 'map-values': return 'Mapear Valores';
      case 'preview': return 'Preview';
      case 'result': return 'Resultado';
      default: return '';
    }
  };

  const uniqueFases = [...new Set(fileData.map((row) => columnMapping.fase ? String(row[columnMapping.fase] || '').trim() : '').filter(Boolean))];
  const uniqueStatus = [...new Set(fileData.map((row) => columnMapping.status ? String(row[columnMapping.status] || '').trim() : '').filter(Boolean))];
  const uniqueResponsaveis = [...new Set(fileData.map((row) => columnMapping.responsavel ? String(row[columnMapping.responsavel] || '').trim() : '').filter(Boolean))];

  const canProceedFromColumns = columnMapping.item && columnMapping.fase && columnMapping.status;
  const canProceedFromValues = uniqueFases.every((f) => valueMapping.fases[f]) && uniqueStatus.every((s) => valueMapping.status[s]);
  const validRowCount = parsedRows.filter((r) => r.errors.length === 0).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Planejamento - {getStepTitle()}
          </DialogTitle>
        </DialogHeader>

        <Progress value={getStepProgress()} className="h-2" />

        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <div
              className="h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium">Arraste um arquivo Excel ou CSV</p>
                <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
              </div>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {step === 'map-columns' && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Associe as colunas do arquivo aos campos do sistema. Campos com * são obrigatórios.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'item', label: 'Item/Tarefa *', required: true },
                    { key: 'fase', label: 'Fase *', required: true },
                    { key: 'status', label: 'Status *', required: true },
                    { key: 'responsavel', label: 'Responsável' },
                    { key: 'data_inicio', label: 'Data Início' },
                    { key: 'data_fim', label: 'Data Fim' },
                    { key: 'obs', label: 'Observações' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-medium">{label}</label>
                      <Select
                        value={columnMapping[key as keyof ColumnMapping] || '__none__'}
                        onValueChange={(value) =>
                          setColumnMapping((prev) => ({ ...prev, [key]: value === '__none__' ? '' : value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma coluna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Não mapear</SelectItem>
                          {fileColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    {fileData.length} linhas encontradas no arquivo
                  </p>
                </div>
              </div>
            </ScrollArea>
          )}

          {step === 'map-values' && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {uniqueFases.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Mapear Fases</h3>
                    <div className="space-y-2">
                      {uniqueFases.map((value) => (
                        <div key={value} className="flex items-center gap-4">
                          <span className="w-48 text-sm truncate">{value}</span>
                          <Select
                            value={valueMapping.fases[value] || ''}
                            onValueChange={(id) =>
                              setValueMapping((prev) => ({
                                ...prev,
                                fases: { ...prev.fases, [value]: id },
                              }))
                            }
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Selecione a fase" />
                            </SelectTrigger>
                            <SelectContent>
                              {fases?.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {valueMapping.fases[value] ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uniqueStatus.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Mapear Status</h3>
                    <div className="space-y-2">
                      {uniqueStatus.map((value) => (
                        <div key={value} className="flex items-center gap-4">
                          <span className="w-48 text-sm truncate">{value}</span>
                          <Select
                            value={valueMapping.status[value] || ''}
                            onValueChange={(id) =>
                              setValueMapping((prev) => ({
                                ...prev,
                                status: { ...prev.status, [value]: id },
                              }))
                            }
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusList?.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {valueMapping.status[value] ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uniqueResponsaveis.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Mapear Responsáveis (opcional)</h3>
                    <div className="space-y-2">
                      {uniqueResponsaveis.map((value) => (
                        <div key={value} className="flex items-center gap-4">
                          <span className="w-48 text-sm truncate">{value}</span>
                          <Select
                            value={valueMapping.responsaveis[value] || '__none__'}
                            onValueChange={(id) =>
                              setValueMapping((prev) => ({
                                ...prev,
                                responsaveis: { ...prev.responsaveis, [value]: id === '__none__' ? '' : id },
                              }))
                            }
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Selecione o responsável" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Não atribuir</SelectItem>
                              {funcionarios?.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {valueMapping.responsaveis[value] && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Badge variant="outline" className="text-green-600">
                    {validRowCount} válidos
                  </Badge>
                  {parsedRows.length - validRowCount > 0 && (
                    <Badge variant="outline" className="text-destructive">
                      {parsedRows.length - validRowCount} com erros
                    </Badge>
                  )}
                </div>
              </div>

              <ScrollArea className="h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Fase</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="w-24">Início</TableHead>
                      <TableHead className="w-24">Fim</TableHead>
                      <TableHead className="w-32">Validação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, idx) => (
                      <TableRow key={idx} className={row.errors.length > 0 ? 'bg-destructive/10' : ''}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.item}</TableCell>
                        <TableCell>{row.fase}</TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell>{row.responsavel || '-'}</TableCell>
                        <TableCell>{row.data_inicio || '-'}</TableCell>
                        <TableCell>{row.data_fim || '-'}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              {row.errors.length} erro(s)
                            </Badge>
                          ) : row.warnings.length > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {row.warnings.length} aviso(s)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-green-600">
                              OK
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                {importResult.success > 0 ? (
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <X className="h-16 w-16 text-destructive mx-auto mb-4" />
                )}
                <h3 className="text-xl font-semibold">
                  {importResult.success > 0 ? 'Importação Concluída!' : 'Falha na Importação'}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{importResult.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                  <p className="text-sm text-muted-foreground">Sucesso</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10">
                  <p className="text-2xl font-bold text-destructive">{importResult.errors}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              </div>

              {importResult.errorDetails.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Detalhes dos erros:</h4>
                  <ScrollArea className="h-32">
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {importResult.errorDetails.map((detail, idx) => (
                        <li key={idx}>• {detail}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {step !== 'upload' && step !== 'result' && (
              <Button
                variant="outline"
                onClick={() => {
                  if (step === 'map-columns') setStep('upload');
                  if (step === 'map-values') setStep('map-columns');
                  if (step === 'preview') setStep('map-values');
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {step === 'result' ? 'Fechar' : 'Cancelar'}
            </Button>

            {step === 'map-columns' && (
              <Button onClick={handleNextFromColumns} disabled={!canProceedFromColumns}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {step === 'map-values' && (
              <Button onClick={processRows} disabled={!canProceedFromValues}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {step === 'preview' && (
              <Button onClick={handleImport} disabled={validRowCount === 0 || isImporting}>
                {isImporting ? 'Importando...' : `Importar ${validRowCount} itens`}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
