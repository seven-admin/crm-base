import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Copy, Loader2, PhoneCall, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useArqoAtendimentoOpcoes, useArqoHistoricoContatos, useReabrirAtendimentoHistorico } from '@/hooks/useArqo';

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function uniquePhones(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  return values.filter((value): value is string => {
    if (!value) return false;
    const key = onlyDigits(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ContactPhone({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(phone);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs">{phone}</span>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={copy} title="Copiar número">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export function HistoricoContatosTab() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: contatos = [], isLoading } = useArqoHistoricoContatos();
  const { data: opcoes = [] } = useArqoAtendimentoOpcoes(true);
  const reopen = useReabrirAtendimentoHistorico();

  const startNewAttendance = async (atendimentoId: string) => {
    try {
      const leadId = await reopen.mutateAsync(atendimentoId);
      navigate(`/arqo/atendimento?lead=${leadId}`);
    } catch {
      // A mutation já apresenta ao usuário a mensagem específica retornada pelo banco.
    }
  };

  const statusLabels = useMemo(
    () => new Map(opcoes.filter((opcao) => opcao.grupo === 'status_ligacao').map((opcao) => [opcao.codigo, opcao.rotulo])),
    [opcoes],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    const digits = onlyDigits(term);
    if (!term) return contatos;

    return contatos.filter((contato) => {
      const phones = uniquePhones([
        contato.telefone_snapshot,
        contato.whatsapp_snapshot,
        ...contato.telefones_adicionais_snapshot,
      ]);
      return contato.lead_nome_snapshot?.toLocaleLowerCase('pt-BR').includes(term)
        || contato.observacao.toLocaleLowerCase('pt-BR').includes(term)
        || contato.status_codigo.toLocaleLowerCase('pt-BR').includes(term)
        || (digits.length > 0 && phones.some((phone) => onlyDigits(phone).includes(digits)));
    });
  }, [contatos, search]);

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-14" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="page-toolbar flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, telefone, código ou observação"
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} contato(s)</p>
      </div>

      {!filtered.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <PhoneCall className="mb-3 h-8 w-8 opacity-40" />
            <p className="font-medium text-foreground">Nenhum contato encontrado</p>
            <p className="mt-1 text-sm">Os atendimentos concluídos aparecerão aqui, mesmo após o lead ser liberado.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e hora</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Números</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((contato) => {
                  const phones = uniquePhones([
                    contato.telefone_snapshot,
                    contato.whatsapp_snapshot,
                    ...contato.telefones_adicionais_snapshot,
                  ]);
                  return (
                    <TableRow key={contato.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(contato.encerrado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{contato.lead_nome_snapshot || 'Lead não identificado'}</TableCell>
                      <TableCell>
                        {phones.length
                          ? <div className="space-y-0.5">{phones.map((phone) => <ContactPhone key={onlyDigits(phone)} phone={phone} />)}</div>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-[170px] items-center gap-2">
                          <Badge variant="outline">{contato.status_codigo}</Badge>
                          <span className="text-sm">{statusLabels.get(contato.status_codigo) || 'Status registrado'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{contato.consultor?.full_name || '—'}</TableCell>
                      <TableCell className="max-w-[320px] whitespace-normal text-sm text-muted-foreground">
                        {contato.observacao}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={reopen.isPending}
                          onClick={() => void startNewAttendance(contato.id)}
                          className="whitespace-nowrap"
                        >
                          {reopen.isPending && reopen.variables === contato.id
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <PhoneCall className="mr-2 h-4 w-4" />}
                          Novo atendimento
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
