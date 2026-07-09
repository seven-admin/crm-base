import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, FileDown, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useArqoEtapas, useArqoGrupos, useArqoSources } from '@/hooks/useArqo';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { useQueryClient } from '@tanstack/react-query';

interface Row {
  nome: string;
  telefone?: string;
  email?: string;
  origem?: string;
  empreendimento?: string;
  valor_estimado?: number;
  __error?: string;
}

function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const sep = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const idx = (name: string) => headers.findIndex(h => h === name || h.startsWith(name));
  const iNome = idx('nome');
  const iTel = idx('telefone');
  const iEmail = idx('email');
  const iOrig = idx('origem');
  const iEmp = idx('empreendimento');
  const iVal = idx('valor');
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
    const nome = iNome >= 0 ? cols[iNome] : '';
    if (!nome) continue;
    const valStr = iVal >= 0 ? cols[iVal]?.replace(/\./g, '').replace(',', '.') : '';
    const valor = valStr ? Number(valStr) : undefined;
    rows.push({
      nome,
      telefone: iTel >= 0 ? cols[iTel] || undefined : undefined,
      email: iEmail >= 0 ? cols[iEmail] || undefined : undefined,
      origem: iOrig >= 0 ? cols[iOrig] || undefined : undefined,
      empreendimento: iEmp >= 0 ? cols[iEmp] || undefined : undefined,
      valor_estimado: valor && !Number.isNaN(valor) ? valor : undefined,
    });
  }
  return rows;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ArqoImportarLeadsDialog({ open, onOpenChange }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [grupoId, setGrupoId] = useState<string>('none');
  const [etapaId, setEtapaId] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null);

  const { data: etapas = [] } = useArqoEtapas();
  const { data: grupos = [] } = useArqoGrupos();
  const { data: sources = [] } = useArqoSources();
  const { data: empreendimentos = [] } = useEmpreendimentosSelect();
  const qc = useQueryClient();

  const etapasAtivas = useMemo(() => etapas.filter(e => e.categoria === 'ativa'), [etapas]);
  const defaultEtapaId = etapasAtivas[0]?.id ?? '';
  const selectedEtapa = etapaId || defaultEtapaId;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    setRows(parsed);
    setResult(null);
    if (parsed.length === 0) toast.error('Nenhuma linha válida encontrada. Verifique o cabeçalho.');
  };

  const downloadTemplate = () => {
    const csv = 'nome,telefone,email,origem,empreendimento,valor_estimado\nJoão Silva,11999998888,joao@ex.com,Site,,500000\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'modelo_leads_arqo.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const findEmpreendimento = (nome?: string) =>
    nome ? empreendimentos.find(e => e.nome.toLowerCase().includes(nome.toLowerCase()))?.id ?? null : null;
  const findSource = (nome?: string) =>
    nome ? sources.find(s => s.nome.toLowerCase() === nome.toLowerCase())?.id ?? null : null;

  const handleImport = async () => {
    if (rows.length === 0 || !selectedEtapa) return;
    setIsImporting(true);
    let ok = 0, fail = 0;
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id ?? null;

    for (const row of rows) {
      try {
        const { data: cliente, error: cErr } = await supabase
          .from('seven_clientes')
          .insert({
            nome: row.nome,
            telefone: row.telefone ?? null,
            email: row.email ?? null,
            nivel_cadastro: 'lead',
            origem: row.origem ?? null,
          } as any)
          .select('id')
          .single();
        if (cErr || !cliente) throw cErr ?? new Error('cliente');

        const { data: lead, error: lErr } = await supabase
          .from('arqo_leads')
          .insert({
            cliente_id: cliente.id,
            etapa_id: selectedEtapa,
            source_id: findSource(row.origem),
            empreendimento_id: findEmpreendimento(row.empreendimento),
            valor_estimado: row.valor_estimado ?? null,
            grupo_id: grupoId !== 'none' ? grupoId : null,
            created_by: userId,
          } as any)
          .select('id')
          .single();
        if (lErr || !lead) throw lErr ?? new Error('lead');

        if (grupoId !== 'none') {
          await supabase.rpc('arqo_atribuir_lead_roleta', {
            p_grupo_id: grupoId, p_lead_id: lead.id, p_tipo_atribuicao: 'roleta',
          });
        }
        ok++;
      } catch (e) {
        console.error('import row failed', row, e);
        fail++;
      }
    }
    setResult({ ok, fail });
    setIsImporting(false);
    qc.invalidateQueries({ queryKey: ['arqo', 'leads'] });
    if (ok > 0) toast.success(`${ok} lead(s) importado(s)`);
    if (fail > 0) toast.error(`${fail} falha(s) na importação`);
  };

  const close = () => {
    setRows([]); setResult(null); setGrupoId('none'); setEtapaId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar leads</DialogTitle>
          <DialogDescription>
            Envie um CSV com as colunas: nome, telefone, email, origem, empreendimento, valor_estimado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <FileDown className="h-4 w-4 mr-2" /> Baixar modelo
            </Button>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer border border-input px-3 py-1.5 rounded-md hover:bg-muted">
              <Upload className="h-4 w-4" /> Selecionar CSV
              <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            </label>
            {rows.length > 0 && <span className="text-sm text-muted-foreground">{rows.length} linha(s) carregada(s)</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Etapa inicial</Label>
              <Select value={selectedEtapa} onValueChange={setEtapaId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {etapasAtivas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Grupo (opcional — atribui via roleta)</Label>
              <Select value={grupoId} onValueChange={setGrupoId}>
                <SelectTrigger><SelectValue placeholder="Sem grupo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem grupo</SelectItem>
                  {grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {rows.length > 0 && (
            <div className="max-h-72 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.nome}</TableCell>
                      <TableCell>{r.telefone ?? '—'}</TableCell>
                      <TableCell>{r.email ?? '—'}</TableCell>
                      <TableCell>{r.origem ?? '—'}</TableCell>
                      <TableCell>{r.empreendimento ?? '—'}</TableCell>
                      <TableCell className="text-right">{r.valor_estimado?.toLocaleString('pt-BR') ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 50 && (
                <div className="text-xs text-muted-foreground p-2 text-center">
                  Exibindo 50 de {rows.length}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="text-sm flex items-center gap-2 p-3 rounded-md bg-muted">
              <AlertCircle className="h-4 w-4" />
              Importação concluída: <strong>{result.ok}</strong> sucesso · <strong>{result.fail}</strong> falha(s).
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={isImporting}>Fechar</Button>
          <Button onClick={handleImport} disabled={rows.length === 0 || !selectedEtapa || isImporting}>
            {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Importar {rows.length > 0 ? `(${rows.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
