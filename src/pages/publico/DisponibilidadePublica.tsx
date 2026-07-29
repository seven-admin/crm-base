import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const autoDownload = searchParams.get('download') !== null;
  const [data, setData] = useState<PublicData | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const baixouRef = useRef(false);

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

  const gerarPdf = async () => {
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
        boxesPorUnidade,
      });
    } finally {
      setGerando(false);
    }
  };

  // Link com ?download=1: dispara o download automaticamente ao carregar.
  useEffect(() => {
    if (autoDownload && data && data.unidades.length && !baixouRef.current) {
      baixouRef.current = true;
      gerarPdf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload, data]);

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
            {autoDownload ? (
              <div className="mt-6">
                <p className="mb-3 text-sm text-muted-foreground">O download vai começar automaticamente.</p>
                <Button variant="outline" className="w-full" onClick={() => gerarPdf()} disabled={gerando || !data.unidades.length}>
                  {gerando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                  Se não iniciar, clique aqui
                </Button>
              </div>
            ) : (
              <div className="mt-6">
                <Button className="w-full" onClick={() => gerarPdf()} disabled={gerando || !data.unidades.length}>
                  {gerando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                  Baixar tabela de vendas (PDF)
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
