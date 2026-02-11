import { useState, useMemo, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2, ArrowRight, Plus, Link2 } from 'lucide-react';
import { useBlocos, useCreateBlocoSilent, useAtualizarContagemBlocos } from '@/hooks/useBlocos';
import { useTipologias, useCreateTipologiaSilent } from '@/hooks/useTipologias';
import { useCreateUnidadesBulk, useUnidades, useUpdateUnidadesBulk } from '@/hooks/useUnidades';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { UnidadeFormData, UnidadeStatus, Unidade } from '@/types/empreendimentos.types';

interface ImportarUnidadesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  tipoEmpreendimento?: string;
}

type Etapa = 'upload' | 'mapear-colunas' | 'mapear-valores' | 'preview' | 'resultado';

interface LinhaImportacao {
  linha: number;
  dados: Partial<UnidadeFormData>;
  valido: boolean;
  erros: string[];
  avisos: string[];
  duplicata?: boolean;
  unidadeExistenteId?: string;
}

interface MapeamentoColunas {
  numero?: string;
  bloco?: string;
  tipologia?: string;
  andar?: string;
  area_privativa?: string;
  valor?: string;
  status?: string;
  descricao?: string;
  observacoes?: string;
}

interface ValorMapeado {
  valorExcel: string;
  idSistema: string | null;
  criarNovo: boolean;
  similaridade: number;
  sugestaoNome?: string;
}

const STATUS_VALIDOS: UnidadeStatus[] = ['disponivel', 'reservada', 'vendida', 'bloqueada'];

const CAMPOS_SISTEMA = [
  { key: 'numero', label: 'Número', obrigatorio: true },
  { key: 'bloco', label: 'Bloco/Quadra', obrigatorio: false },
  { key: 'tipologia', label: 'Tipologia', obrigatorio: false },
  { key: 'andar', label: 'Andar', obrigatorio: false },
  { key: 'area_privativa', label: 'Área Privativa', obrigatorio: false },
  { key: 'valor', label: 'Valor', obrigatorio: false },
  { key: 'status', label: 'Status', obrigatorio: false },
  { key: 'descricao', label: 'Descrição/Memorial', obrigatorio: false },
  { key: 'observacoes', label: 'Observações', obrigatorio: false },
];

// Função para calcular similaridade entre strings (Levenshtein simplificado)
function calcularSimilaridade(a: string, b: string): number {
  const strA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const strB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (strA === strB) return 1;
  if (strA.includes(strB) || strB.includes(strA)) return 0.85;
  
  // Comparação por palavras
  const wordsA = strA.split(/\s+/);
  const wordsB = strB.split(/\s+/);
  const commonWords = wordsA.filter(w => wordsB.some(wb => wb.includes(w) || w.includes(wb)));
  if (commonWords.length > 0) {
    return 0.6 + (0.3 * commonWords.length / Math.max(wordsA.length, wordsB.length));
  }
  
  // Levenshtein distance simplificado
  if (Math.abs(strA.length - strB.length) > 5) return 0;
  
  let matches = 0;
  const minLen = Math.min(strA.length, strB.length);
  for (let i = 0; i < minLen; i++) {
    if (strA[i] === strB[i]) matches++;
  }
  
  return matches / Math.max(strA.length, strB.length);
}

// Detectar automaticamente qual campo do sistema uma coluna representa
function detectarCampo(coluna: string): string | null {
  const col = coluna.toLowerCase().trim();
  
  // Mapeamentos diretos
  const mapeamentos: Record<string, string[]> = {
    numero: ['numero', 'num', 'número', 'nº', 'unidade', 'lote', 'un'],
    bloco: ['bloco', 'quadra', 'qd', 'torre', 'blk', 'block'],
    tipologia: ['tipologia', 'tipo', 'category', 'categoria'],
    andar: ['andar', 'pavimento', 'floor', 'pav'],
    area_privativa: ['area', 'área', 'area_privativa', 'm2', 'metragem'],
    valor: ['valor', 'preco', 'preço', 'price', 'vgv'],
    status: ['status', 'situacao', 'situação', 'state'],
    descricao: ['descricao', 'descrição', 'memorial', 'desc'],
    observacoes: ['observacoes', 'observações', 'obs', 'notas', 'notes'],
  };
  
  for (const [campo, aliases] of Object.entries(mapeamentos)) {
    if (aliases.some(alias => col === alias || col.includes(alias))) {
      return campo;
    }
  }
  
  return null;
}

export function ImportarUnidadesDialog({ 
  open, 
  onOpenChange, 
  empreendimentoId,
  tipoEmpreendimento 
}: ImportarUnidadesDialogProps) {
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dadosBrutos, setDadosBrutos] = useState<Record<string, unknown>[]>([]);
  const [colunasExcel, setColunasExcel] = useState<string[]>([]);
  const [mapeamentoColunas, setMapeamentoColunas] = useState<MapeamentoColunas>({});
  const [mapeamentoBlocos, setMapeamentoBlocos] = useState<ValorMapeado[]>([]);
  const [mapeamentoTipologias, setMapeamentoTipologias] = useState<ValorMapeado[]>([]);
  const [linhas, setLinhas] = useState<LinhaImportacao[]>([]);
  const [resultado, setResultado] = useState<{ sucesso: number; erros: number; atualizados: number }>({ sucesso: 0, erros: 0, atualizados: 0 });
  const [acaoDuplicatas, setAcaoDuplicatas] = useState<'ignorar' | 'atualizar'>('ignorar');
  const [criandoEntidades, setCriandoEntidades] = useState(false);
  const [erroImportacaoGeral, setErroImportacaoGeral] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: blocos = [] } = useBlocos(empreendimentoId);
  const { data: tipologias = [] } = useTipologias(empreendimentoId);
  const { data: unidadesExistentes = [] } = useUnidades(empreendimentoId);
  const createBulk = useCreateUnidadesBulk();
  const updateBulk = useUpdateUnidadesBulk();
  const createBlocoSilent = useCreateBlocoSilent();
  const createTipologiaSilent = useCreateTipologiaSilent();
  const atualizarContagemBlocos = useAtualizarContagemBlocos();

  const isLoteamento = tipoEmpreendimento === 'loteamento' || tipoEmpreendimento === 'condominio';
  const agrupamentoLabel = isLoteamento ? 'Quadra' : 'Bloco';
  const unidadeLabel = isLoteamento ? 'Lote' : 'Unidade';

  const linhasValidas = useMemo(() => linhas.filter(l => l.valido && (!l.duplicata || acaoDuplicatas === 'atualizar')), [linhas, acaoDuplicatas]);
  const linhasComErro = useMemo(() => linhas.filter(l => !l.valido), [linhas]);
  const linhasDuplicadas = useMemo(() => linhas.filter(l => l.duplicata), [linhas]);

  const resetDialog = useCallback(() => {
    setEtapa('upload');
    setArquivo(null);
    setDadosBrutos([]);
    setColunasExcel([]);
    setMapeamentoColunas({});
    setMapeamentoBlocos([]);
    setMapeamentoTipologias([]);
    setLinhas([]);
    setResultado({ sucesso: 0, erros: 0, atualizados: 0 });
    setAcaoDuplicatas('ignorar');
    setErroImportacaoGeral(null);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  }, [onOpenChange, resetDialog]);

  // Processar arquivo Excel e extrair colunas
  const processarArquivo = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

        if (jsonData.length === 0) {
          setLinhas([{
            linha: 0,
            dados: {},
            valido: false,
            erros: ['Arquivo vazio ou sem dados válidos.'],
            avisos: [],
          }]);
          setEtapa('preview');
          return;
        }

        // Extrair colunas do primeiro registro
        const colunas = Object.keys(jsonData[0]);
        setColunasExcel(colunas);
        setDadosBrutos(jsonData);

        // Detectar mapeamento automático
        const mapeamentoAuto: MapeamentoColunas = {};
        colunas.forEach(col => {
          const campo = detectarCampo(col);
          if (campo && !Object.values(mapeamentoAuto).includes(col)) {
            (mapeamentoAuto as Record<string, string>)[campo] = col;
          }
        });
        setMapeamentoColunas(mapeamentoAuto);

        setEtapa('mapear-colunas');
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        setLinhas([{
          linha: 0,
          dados: {},
          valido: false,
          erros: ['Erro ao processar arquivo. Verifique se é um arquivo Excel válido.'],
          avisos: [],
        }]);
        setEtapa('preview');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // Extrair valores únicos para mapeamento
  const processarMapeamentoValores = useCallback(() => {
    const valoresBlocos = new Set<string>();
    const valoresTipologias = new Set<string>();

    dadosBrutos.forEach(row => {
      if (mapeamentoColunas.bloco) {
        const valor = String(row[mapeamentoColunas.bloco] || '').trim();
        if (valor) valoresBlocos.add(valor);
      }
      if (mapeamentoColunas.tipologia) {
        const valor = String(row[mapeamentoColunas.tipologia] || '').trim();
        if (valor) valoresTipologias.add(valor);
      }
    });

    // Mapear blocos com sugestões
    const blocosMapeados: ValorMapeado[] = Array.from(valoresBlocos).map(valorExcel => {
      // Match exato
      const matchExato = blocos.find(b => b.nome.toLowerCase() === valorExcel.toLowerCase());
      if (matchExato) {
        return { valorExcel, idSistema: matchExato.id, criarNovo: false, similaridade: 1 };
      }

      // Match por similaridade
      let melhorMatch: { id: string; nome: string; sim: number } | null = null;
      blocos.forEach(b => {
        const sim = calcularSimilaridade(valorExcel, b.nome);
        if (sim > 0.6 && (!melhorMatch || sim > melhorMatch.sim)) {
          melhorMatch = { id: b.id, nome: b.nome, sim };
        }
      });

      if (melhorMatch) {
        return { valorExcel, idSistema: melhorMatch.id, criarNovo: false, similaridade: melhorMatch.sim, sugestaoNome: melhorMatch.nome };
      }

      return { valorExcel, idSistema: null, criarNovo: false, similaridade: 0 };
    });

    // Mapear tipologias com sugestões
    const tipologiasMapeadas: ValorMapeado[] = Array.from(valoresTipologias).map(valorExcel => {
      const matchExato = tipologias.find(t => t.nome.toLowerCase() === valorExcel.toLowerCase());
      if (matchExato) {
        return { valorExcel, idSistema: matchExato.id, criarNovo: false, similaridade: 1 };
      }

      let melhorMatch: { id: string; nome: string; sim: number } | null = null;
      tipologias.forEach(t => {
        const sim = calcularSimilaridade(valorExcel, t.nome);
        if (sim > 0.6 && (!melhorMatch || sim > melhorMatch.sim)) {
          melhorMatch = { id: t.id, nome: t.nome, sim };
        }
      });

      if (melhorMatch) {
        return { valorExcel, idSistema: melhorMatch.id, criarNovo: false, similaridade: melhorMatch.sim, sugestaoNome: melhorMatch.nome };
      }

      return { valorExcel, idSistema: null, criarNovo: false, similaridade: 0 };
    });

    setMapeamentoBlocos(blocosMapeados);
    setMapeamentoTipologias(tipologiasMapeadas);
  }, [dadosBrutos, mapeamentoColunas, blocos, tipologias]);

  // Processar dados finais com mapeamentos aplicados
  const processarDadosFinais = useCallback(async () => {
    // Criar blocos/tipologias novos se necessário
    const novosBlocos: Record<string, string> = {};
    const novasTipologias: Record<string, string> = {};

    for (const m of mapeamentoBlocos.filter(m => m.criarNovo && !m.idSistema)) {
      try {
        const result = await createBlocoSilent.mutateAsync({
          empreendimentoId,
          data: { nome: m.valorExcel }
        });
        novosBlocos[m.valorExcel] = result.id;
      } catch (e) {
        console.error('Erro ao criar bloco:', e);
      }
    }

    for (const m of mapeamentoTipologias.filter(m => m.criarNovo && !m.idSistema)) {
      try {
        const result = await createTipologiaSilent.mutateAsync({
          empreendimentoId,
          data: { 
            nome: m.valorExcel,
            categoria: isLoteamento ? 'terreno' : 'apartamento'
          }
        });
        novasTipologias[m.valorExcel] = result.id;
      } catch (e) {
        console.error('Erro ao criar tipologia:', e);
      }
    }

    // Criar mapa para lookup rápido
    const mapaBloco: Record<string, string> = {};
    mapeamentoBlocos.forEach(m => {
      if (m.idSistema) mapaBloco[m.valorExcel] = m.idSistema;
      else if (novosBlocos[m.valorExcel]) mapaBloco[m.valorExcel] = novosBlocos[m.valorExcel];
    });

    const mapaTipologia: Record<string, string> = {};
    mapeamentoTipologias.forEach(m => {
      if (m.idSistema) mapaTipologia[m.valorExcel] = m.idSistema;
      else if (novasTipologias[m.valorExcel]) mapaTipologia[m.valorExcel] = novasTipologias[m.valorExcel];
    });

    // Processar linhas - usar Set para rastrear duplicatas (evita referência circular)
    const combinacoesVistas = new Set<string>();
    const linhasProcessadas: LinhaImportacao[] = dadosBrutos.map((row, index) => {
      const erros: string[] = [];
      const avisos: string[] = [];

      // Extrair número
      const numero = mapeamentoColunas.numero 
        ? String(row[mapeamentoColunas.numero] || '').trim()
        : '';
      if (!numero) {
        erros.push('Número é obrigatório');
      }

      // Mapear bloco
      const blocoNome = mapeamentoColunas.bloco 
        ? String(row[mapeamentoColunas.bloco] || '').trim()
        : '';
      const blocoId = blocoNome ? mapaBloco[blocoNome] : undefined;
      if (blocoNome && !blocoId) {
        avisos.push(`${agrupamentoLabel} "${blocoNome}" não mapeado`);
      }

      // Mapear tipologia
      const tipologiaNome = mapeamentoColunas.tipologia 
        ? String(row[mapeamentoColunas.tipologia] || '').trim()
        : '';
      const tipologiaId = tipologiaNome ? mapaTipologia[tipologiaNome] : undefined;
      if (tipologiaNome && !tipologiaId) {
        avisos.push(`Tipologia "${tipologiaNome}" não mapeada`);
      }

      // Extrair andar
      const andarRaw = mapeamentoColunas.andar ? row[mapeamentoColunas.andar] : undefined;
      const andar = andarRaw ? parseInt(String(andarRaw), 10) : undefined;

      // Extrair área
      const areaRaw = mapeamentoColunas.area_privativa ? row[mapeamentoColunas.area_privativa] : undefined;
      let area: number | undefined;
      if (areaRaw) {
        const areaStr = String(areaRaw).replace(',', '.');
        area = parseFloat(areaStr);
        if (isNaN(area)) {
          erros.push('Área deve ser numérica');
          area = undefined;
        }
      }

      // Extrair valor
      const valorRaw = mapeamentoColunas.valor ? row[mapeamentoColunas.valor] : undefined;
      let valor: number | undefined;
      if (valorRaw) {
        const valorStr = String(valorRaw).replace(/[^\d.,]/g, '').replace(',', '.');
        valor = parseFloat(valorStr);
        if (isNaN(valor)) {
          erros.push('Valor deve ser numérico');
          valor = undefined;
        }
      }

      // Validar status
      const statusRaw = mapeamentoColunas.status 
        ? String(row[mapeamentoColunas.status] || '').trim()
        : '';
      let status: UnidadeStatus = 'disponivel';
      if (statusRaw) {
        const statusLower = statusRaw.toLowerCase();
        if (!STATUS_VALIDOS.includes(statusLower as UnidadeStatus)) {
          erros.push(`Status inválido: "${statusRaw}". Valores aceitos: ${STATUS_VALIDOS.join(', ')}`);
        } else {
          status = statusLower as UnidadeStatus;
        }
      }

      // Descrição e observações
      const descricao = mapeamentoColunas.descricao 
        ? String(row[mapeamentoColunas.descricao] || '').trim() || undefined
        : undefined;
      const observacoes = mapeamentoColunas.observacoes 
        ? String(row[mapeamentoColunas.observacoes] || '').trim() || undefined
        : undefined;

      // Verificar duplicata interna (mesmo Excel) usando Set
      const chaveUnidade = `${numero}__${blocoId || 'NULL'}`;
      const jaExisteNoLote = combinacoesVistas.has(chaveUnidade);
      combinacoesVistas.add(chaveUnidade);

      if (jaExisteNoLote) {
        erros.push('Linha duplicada no arquivo Excel');
      }

        // Verificar duplicata no banco
        const unidadeExistente = unidadesExistentes.find(u => {
          const mesmoNumero = u.numero === numero;
          // Comparar blocos: ambos null/undefined ou mesmos IDs
          const mesmoBlocoNull = !u.bloco_id && !blocoId;
          const mesmoBlocoId = u.bloco_id === blocoId;
          return mesmoNumero && (mesmoBlocoNull || mesmoBlocoId);
        });

      const dados: Partial<UnidadeFormData> = {
        numero,
        bloco_id: blocoId,
        tipologia_id: tipologiaId,
        andar,
        area_privativa: area,
        valor,
        status,
        descricao,
        observacoes,
      };

      return {
        linha: index + 2,
        dados,
        valido: erros.length === 0,
        erros,
        avisos,
        duplicata: !!unidadeExistente,
        unidadeExistenteId: unidadeExistente?.id,
      };
    });

    setLinhas(linhasProcessadas);
    setEtapa('preview');
  }, [dadosBrutos, mapeamentoColunas, mapeamentoBlocos, mapeamentoTipologias, unidadesExistentes, agrupamentoLabel, createBlocoSilent, createTipologiaSilent, empreendimentoId, isLoteamento]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivo(file);
      processarArquivo(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setArquivo(file);
      processarArquivo(file);
    }
  }, [processarArquivo]);

  const handleDownloadModelo = () => {
    const modelo = [
      {
        numero: '01',
        [isLoteamento ? 'quadra' : 'bloco']: isLoteamento ? 'Quadra A' : 'Bloco A',
        tipologia: 'Padrão',
        andar: isLoteamento ? '' : '1',
        area_privativa: '360',
        valor: '150000',
        status: 'disponivel',
        descricao: 'Descrição opcional',
        observacoes: 'Observações opcionais',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(modelo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, `modelo_importacao_${isLoteamento ? 'lotes' : 'unidades'}.xlsx`);
  };

  const handleAvancarColunas = () => {
    if (!mapeamentoColunas.numero) {
      return; // Número é obrigatório
    }
    processarMapeamentoValores();
    setEtapa('mapear-valores');
  };

  const handleAvancarValores = async () => {
    setCriandoEntidades(true);
    try {
      await processarDadosFinais();
    } finally {
      setCriandoEntidades(false);
    }
  };

  const handleImportar = async () => {
    // Limpar erro anterior
    setErroImportacaoGeral(null);
    
    // Separar linhas novas e atualizações
    const linhasNovas = linhasValidas.filter(l => !l.duplicata);
    const linhasAtualizar = linhasValidas.filter(l => l.duplicata && acaoDuplicatas === 'atualizar');

    let sucessoCount = 0;
    let atualizadosCount = 0;

    try {
      // Criar novas unidades
      if (linhasNovas.length > 0) {
        const unidadesNovas = linhasNovas.map(l => l.dados as UnidadeFormData);
        await createBulk.mutateAsync({ 
          empreendimentoId, 
          unidades: unidadesNovas 
        });
        sucessoCount = linhasNovas.length;
      }

      // Atualizar unidades existentes
      if (linhasAtualizar.length > 0) {
        const atualizacoes = linhasAtualizar.map(l => ({
          id: l.unidadeExistenteId!,
          valor: l.dados.valor,
          area_privativa: l.dados.area_privativa,
        }));
        await updateBulk.mutateAsync({
          empreendimentoId,
          updates: atualizacoes,
          motivo: 'Importação via Excel',
        });
        atualizadosCount = linhasAtualizar.length;
      }

      // Atualizar contagem de lotes/unidades por bloco
      await atualizarContagemBlocos.mutateAsync(empreendimentoId);

      setResultado({ 
        sucesso: sucessoCount, 
        erros: linhasComErro.length,
        atualizados: atualizadosCount 
      });
      
      // Invalidar queries após importação completa
      queryClient.invalidateQueries({ queryKey: ['blocos', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['blocos-contagem', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['tipologias', empreendimentoId] });
      
      setEtapa('resultado');
    } catch (error: unknown) {
      console.error('Erro na importação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar no banco de dados';
      setErroImportacaoGeral(errorMessage);
    }
  };

  const updateMapeamentoBloco = (valorExcel: string, idSistema: string | null, criarNovo: boolean) => {
    setMapeamentoBlocos(prev => prev.map(m => 
      m.valorExcel === valorExcel 
        ? { ...m, idSistema, criarNovo }
        : m
    ));
  };

  const updateMapeamentoTipologia = (valorExcel: string, idSistema: string | null, criarNovo: boolean) => {
    setMapeamentoTipologias(prev => prev.map(m => 
      m.valorExcel === valorExcel 
        ? { ...m, idSistema, criarNovo }
        : m
    ));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar {isLoteamento ? 'Lotes' : 'Unidades'} via Excel
          </DialogTitle>
          <DialogDescription>
            {etapa === 'upload' && `Faça upload de uma planilha Excel`}
            {etapa === 'mapear-colunas' && `Mapeie as colunas do Excel para os campos do sistema`}
            {etapa === 'mapear-valores' && `Correlacione os valores com os cadastros existentes`}
            {etapa === 'preview' && `Revise os dados antes de confirmar a importação`}
            {etapa === 'resultado' && `Resultado da importação`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-2 border-b">
          {['upload', 'mapear-colunas', 'mapear-valores', 'preview'].map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                etapa === step ? "bg-primary text-primary-foreground" :
                ['upload', 'mapear-colunas', 'mapear-valores', 'preview'].indexOf(etapa) > i 
                  ? "bg-green-500 text-white" 
                  : "bg-muted text-muted-foreground"
              )}>
                {['upload', 'mapear-colunas', 'mapear-valores', 'preview'].indexOf(etapa) > i ? '✓' : i + 1}
              </div>
              {i < 3 && <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Etapa 1: Upload */}
          {etapa === 'upload' && (
            <div className="flex-1 flex flex-col gap-4 py-4">
              <div
                className="flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 p-8 transition-colors hover:border-primary/50 cursor-pointer min-h-[200px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
                  <p className="text-sm text-muted-foreground">Suporta arquivos .xlsx, .xls e .csv</p>
                </div>
                <Input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <Button variant="outline" className="self-start" onClick={handleDownloadModelo}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Modelo de Planilha
              </Button>
            </div>
          )}

          {/* Etapa 2: Mapeamento de Colunas */}
          {etapa === 'mapear-colunas' && (
            <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
              <Alert>
                <AlertDescription>
                  Mapeie as colunas do seu arquivo Excel para os campos do sistema. 
                  As colunas detectadas automaticamente estão marcadas com ✓
                </AlertDescription>
              </Alert>

              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                  {CAMPOS_SISTEMA.map(campo => (
                    <div key={campo.key} className="flex items-center gap-4">
                      <Label className="w-40 text-right">
                        {campo.label}
                        {campo.obrigatorio && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Select
                        value={(mapeamentoColunas as Record<string, string>)[campo.key] || '__none__'}
                        onValueChange={(value) => {
                          setMapeamentoColunas(prev => ({
                            ...prev,
                            [campo.key]: value === '__none__' ? undefined : value
                          }));
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione a coluna..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Nenhuma</SelectItem>
                          {colunasExcel.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(mapeamentoColunas as Record<string, string>)[campo.key] && 
                       detectarCampo((mapeamentoColunas as Record<string, string>)[campo.key]) === campo.key && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <DialogFooter className="flex-shrink-0">
                <Button variant="outline" onClick={() => setEtapa('upload')}>
                  Voltar
                </Button>
                <Button 
                  onClick={handleAvancarColunas}
                  disabled={!mapeamentoColunas.numero}
                >
                  Avançar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Etapa 3: Mapeamento de Valores */}
          {etapa === 'mapear-valores' && (
          <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4 min-h-0">
              {/*
                Scroll do mapeamento: usamos overflow-y-auto (CSS puro) porque o Radix ScrollArea
                depende de heights percentuais (Viewport h-full) e pode não calcular corretamente
                quando o Root só tem max-height.
              */}
              <div className="max-h-[50vh] w-full overflow-y-auto">
                <div className="space-y-6 pr-4 pb-4">
                  {/* Mapeamento de Blocos */}
                  {mapeamentoBlocos.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Mapeamento de {agrupamentoLabel}s
                      </h3>
                      <div className="space-y-3">
                        {mapeamentoBlocos.map(m => (
                          <div key={m.valorExcel} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-32 truncate font-medium" title={m.valorExcel}>
                              "{m.valorExcel}"
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Select
                              value={m.criarNovo ? '__criar__' : (m.idSistema || '__none__')}
                              onValueChange={(value) => {
                                if (value === '__criar__') {
                                  updateMapeamentoBloco(m.valorExcel, null, true);
                                } else if (value === '__none__') {
                                  updateMapeamentoBloco(m.valorExcel, null, false);
                                } else {
                                  updateMapeamentoBloco(m.valorExcel, value, false);
                                }
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Ignorar</SelectItem>
                                <SelectItem value="__criar__">
                                  <span className="flex items-center gap-2">
                                    <Plus className="h-3 w-3" />
                                    Criar "{m.valorExcel}"
                                  </span>
                                </SelectItem>
                                {blocos.map(b => (
                                  <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {m.similaridade === 1 && (
                              <Badge variant="outline" className="text-green-600 flex-shrink-0">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Exato
                              </Badge>
                            )}
                            {m.similaridade > 0.6 && m.similaridade < 1 && (
                              <Badge variant="outline" className="text-amber-600 flex-shrink-0">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Similar
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mapeamento de Tipologias */}
                  {mapeamentoTipologias.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Mapeamento de Tipologias
                      </h3>
                      <div className="space-y-3">
                        {mapeamentoTipologias.map(m => (
                          <div key={m.valorExcel} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-32 truncate font-medium" title={m.valorExcel}>
                              "{m.valorExcel}"
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Select
                              value={m.criarNovo ? '__criar__' : (m.idSistema || '__none__')}
                              onValueChange={(value) => {
                                if (value === '__criar__') {
                                  updateMapeamentoTipologia(m.valorExcel, null, true);
                                } else if (value === '__none__') {
                                  updateMapeamentoTipologia(m.valorExcel, null, false);
                                } else {
                                  updateMapeamentoTipologia(m.valorExcel, value, false);
                                }
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Ignorar</SelectItem>
                                <SelectItem value="__criar__">
                                  <span className="flex items-center gap-2">
                                    <Plus className="h-3 w-3" />
                                    Criar "{m.valorExcel}"
                                  </span>
                                </SelectItem>
                                {tipologias.map(t => (
                                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {m.similaridade === 1 && (
                              <Badge variant="outline" className="text-green-600 flex-shrink-0">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Exato
                              </Badge>
                            )}
                            {m.similaridade > 0.6 && m.similaridade < 1 && (
                              <Badge variant="outline" className="text-amber-600 flex-shrink-0">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Similar
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mapeamentoBlocos.length === 0 && mapeamentoTipologias.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>Nenhum valor precisa ser mapeado.</p>
                      <p className="text-sm">Os campos de bloco e tipologia não foram mapeados ou estão vazios.</p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-shrink-0">
                <Button variant="outline" onClick={() => setEtapa('mapear-colunas')}>
                  Voltar
                </Button>
                <Button onClick={handleAvancarValores} disabled={criandoEntidades}>
                  {criandoEntidades ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando entidades...
                    </>
                  ) : (
                    <>
                      Avançar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Etapa 4: Preview */}
          {etapa === 'preview' && (
            <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4 min-h-0">
              {/* Alerta de erro geral do banco */}
              {erroImportacaoGeral && (
                <Alert variant="destructive" className="flex-shrink-0">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Erro ao salvar no banco:</strong> {erroImportacaoGeral}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-4 flex-shrink-0 flex-wrap">
                <Badge variant="secondary" className="gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  {arquivo?.name}
                </Badge>
                <Badge variant="outline" className="gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {linhasValidas.filter(l => !l.duplicata).length} nova(s)
                </Badge>
                {linhasDuplicadas.length > 0 && (
                  <Badge variant="outline" className="gap-1 text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    {linhasDuplicadas.length} duplicada(s)
                  </Badge>
                )}
                {linhasComErro.length > 0 && (
                  <Badge variant="outline" className="gap-1 text-red-600">
                    <XCircle className="h-3 w-3" />
                    {linhasComErro.length} com erro
                  </Badge>
                )}
              </div>

              {linhasDuplicadas.length > 0 && (
                <Alert className="flex-shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{linhasDuplicadas.length} unidade(s) já existem no sistema</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={acaoDuplicatas === 'atualizar'}
                          onCheckedChange={(checked) => setAcaoDuplicatas(checked ? 'atualizar' : 'ignorar')}
                        />
                        <span className="text-sm">Atualizar existentes</span>
                      </label>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Container scrollável usando CSS puro em vez de Radix ScrollArea */}
              <div className="flex-1 min-h-0 border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 sticky top-0 bg-background">Linha</TableHead>
                      <TableHead className="w-12 sticky top-0 bg-background">Status</TableHead>
                      <TableHead className="sticky top-0 bg-background">Número</TableHead>
                      <TableHead className="sticky top-0 bg-background">{agrupamentoLabel}</TableHead>
                      <TableHead className="sticky top-0 bg-background">Tipologia</TableHead>
                      {!isLoteamento && <TableHead className="sticky top-0 bg-background">Andar</TableHead>}
                      <TableHead className="sticky top-0 bg-background">Área (m²)</TableHead>
                      <TableHead className="sticky top-0 bg-background">Valor</TableHead>
                      <TableHead className="sticky top-0 bg-background">Erros/Avisos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((linha) => {
                      const bloco = blocos.find(b => b.id === linha.dados.bloco_id);
                      const tipologia = tipologias.find(t => t.id === linha.dados.tipologia_id);
                      
                      return (
                        <TableRow 
                          key={linha.linha}
                          className={cn(
                            !linha.valido && 'bg-destructive/10',
                            linha.duplicata && 'bg-amber-50'
                          )}
                        >
                          <TableCell className="font-mono text-sm">{linha.linha}</TableCell>
                          <TableCell>
                            {linha.valido ? (
                              linha.duplicata ? (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{linha.dados.numero || '-'}</TableCell>
                          <TableCell>{bloco?.nome || '-'}</TableCell>
                          <TableCell>{tipologia?.nome || '-'}</TableCell>
                          {!isLoteamento && <TableCell>{linha.dados.andar || '-'}</TableCell>}
                          <TableCell>
                            {linha.dados.area_privativa?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '-'}
                          </TableCell>
                          <TableCell>
                            {linha.dados.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-'}
                          </TableCell>
                          <TableCell className="max-w-[320px] whitespace-normal break-words">
                            {linha.duplicata && (
                              <div className="text-xs text-amber-600 flex items-start gap-1 mb-1">
                                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                Já existe no sistema
                              </div>
                            )}
                            {linha.erros.length > 0 && (
                              <ul className="text-xs text-destructive space-y-0.5 list-none p-0 m-0">
                                {linha.erros.map((erro, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span>{erro}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {linha.avisos.length > 0 && (
                              <ul className="text-xs text-amber-600 space-y-0.5 list-none p-0 m-0 mt-1">
                                {linha.avisos.map((aviso, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span>{aviso}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="flex-shrink-0">
                <Button variant="outline" onClick={() => setEtapa('mapear-valores')}>
                  Voltar
                </Button>
                <Button 
                  onClick={handleImportar}
                  disabled={linhasValidas.length === 0 || createBulk.isPending}
                >
                  {createBulk.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Importar {linhasValidas.length} {isLoteamento ? 'lote(s)' : 'unidade(s)'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Etapa 5: Resultado */}
          {etapa === 'resultado' && (
            <div className="flex-1 flex flex-col gap-6 py-4 min-h-0 overflow-hidden">
              {/* Resumo no topo */}
              <div className="flex-shrink-0 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-1">Importação Concluída!</h3>
                  <p className="text-muted-foreground text-sm">
                    {resultado.sucesso} {isLoteamento ? 'lote(s)' : 'unidade(s)'} importad{isLoteamento ? 'o(s)' : 'a(s)'} com sucesso.
                  </p>
                  {resultado.atualizados > 0 && (
                    <p className="text-muted-foreground text-sm">
                      {resultado.atualizados} atualizado(s).
                    </p>
                  )}
                  {resultado.erros > 0 && (
                    <p className="text-amber-600 text-sm">
                      {resultado.erros} linha(s) ignorada(s) por erros.
                    </p>
                  )}
                </div>
              </div>

              {/* Lista detalhada de linhas com erro */}
              {linhasComErro.length > 0 && (
                <div className="flex-1 min-h-0 flex flex-col border rounded-lg overflow-hidden">
                  <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-destructive/5 border-b">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-sm">Linhas com erro</span>
                    <Badge variant="destructive" className="ml-auto">
                      {linhasComErro.length}
                    </Badge>
                  </div>
                  <div className="flex-1 min-h-0 max-h-[40vh] overflow-y-auto">
                    <div className="divide-y">
                      {linhasComErro.map((linha) => (
                        <div key={linha.linha} className="px-4 py-3 flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 text-destructive font-mono text-sm">
                              {linha.linha}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1">
                              {isLoteamento ? 'Lote' : 'Unidade'}: {linha.dados.numero || '(sem número)'}
                            </div>
                            <ul className="text-xs text-destructive space-y-1 list-none p-0 m-0">
                              {linha.erros.map((erro, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span className="break-words">{erro}</span>
                                </li>
                              ))}
                            </ul>
                            {linha.avisos.length > 0 && (
                              <ul className="text-xs text-amber-600 space-y-1 list-none p-0 m-0 mt-2">
                                {linha.avisos.map((aviso, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span className="break-words">{aviso}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {etapa === 'resultado' && (
          <DialogFooter className="flex-shrink-0">
            <Button onClick={() => handleClose(false)}>
              Fechar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
