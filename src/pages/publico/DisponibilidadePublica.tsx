import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { exportUnidadesPdf, type ExportUnidadeInput } from '@/lib/exportUnidadesDisponiveisPdf';
import type { UnidadeStatus } from '@/types/empreendimentos.types';

interface PublicData {
  empreendimento: {
    nome: string;
    tipo?: string;
    config_venda?: any;
    registro_incorporacao?: string | null;
    matricula_mae?: string | null;
  };
  unidades: Array<{
    id: string; numero: string; andar: number | null; area_privativa: number | null;
    valor: number | null; status: string; bloco: { nome: string } | null; tipologia: { nome: string } | null;
  }>;
  boxes: Array<{ numero: string; unidade_id: string }>;
}

export default function DisponibilidadePublica() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicData | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setLoading(true);
      const { data: res, error } = await supabase.functions.invoke('unidades-publicas', { body: { slug } });
      if (!ativo) return;
      if (error || (res as any)?.error) setErro((res as any)?.error ?? 'Não foi possível carregar a disponibilidade.');
      else setData(res as PublicData);
      setLoading(false);
    })();
    return () => { ativo = false; };
  }, [slug]);

  const boxesPorUnidade = useMemo(() => {
    const map: Record<string, string[]> = {};
    (data?.boxes ?? []).forEach((b) => { (map[b.unidade_id] ??= []).push(String(b.numero)); });
    return map;
  }, [data]);

  const isLoteamento = data?.empreendimento.tipo === 'loteamento' || data?.empreendimento.tipo === 'condominio';

  const gerarPdf = async (modelo: 'simples' | 'tabela_vendas') => {
    if (!data) return;
    setGerando(true);
    try {
      const unidades: ExportUnidadeInput[] = data.unidades.map((u) => ({
        id: u.id, numero: u.numero, andar: u.andar, area_privativa: u.area_privativa,
        valor: u.valor, status: u.status as UnidadeStatus,
        bloco: u.bloco ? { nome: u.bloco.nome } : null,
        tipologia: u.tipologia ? { nome: u.tipologia.nome } : null,
      }));
      await exportUnidadesPdf({
        empreendimento: {
          nome: data.empreendimento.nome,
          config_venda: data.empreendimento.config_venda ?? null,
          registro_incorporacao: data.empreendimento.registro_incorporacao ?? null,
          matricula_mae: data.empreendimento.matricula_mae ?? null,
        },
        unidades,
        isLoteamento,
        escopo: 'disponiveis',
        modelo,
        boxesPorUnidade,
      });
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-sm text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando disponibilidade…</span>
          </div>
        ) : erro ? (
          <p className="text-destructive">{erro}</p>
        ) : data ? (
          <>
            <h1 className="text-2xl font-bold">{data.empreendimento.nome}</h1>
            <p className="mt-1 text-muted-foreground">
              {data.unidades.length} {isLoteamento ? 'lote(s)' : 'unidade(s)'} disponível(is)
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={() => gerarPdf('tabela_vendas')} disabled={gerando || !data.unidades.length}>
                {gerando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                Baixar tabela de vendas (PDF)
              </Button>
              <Button variant="outline" onClick={() => gerarPdf('simples')} disabled={gerando || !data.unidades.length}>
                <FileDown className="h-4 w-4 mr-2" />
                Baixar lista simples (PDF)
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
