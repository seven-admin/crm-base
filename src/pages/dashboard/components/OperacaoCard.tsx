import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { useArqoOperacao } from '../useDashboardData';
import { useNexaDashboard } from '@/hooks/useNexaDashboard';

function Linha({ label, valor }: { label: string; valor: number | string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-black/[.06] py-1.5 last:border-0">
      <span className="text-sm text-black/55">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-[#181613]">{valor}</span>
    </div>
  );
}

function Bloco({ marca, className, children }: { marca: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col', className)}>
      <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-[#181613]">{marca}</p>
      {children}
    </div>
  );
}

function VgvTag({ valor }: { valor: number }) {
  return (
    <div className="mt-auto flex items-baseline justify-between gap-2 rounded-xl bg-[#181613] px-3 py-2 text-white">
      <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#ff8a39]">VGV</span>
      <span className="text-lg font-semibold tracking-[-0.03em] tabular-nums">{formatarMoedaCompacta(valor)}</span>
    </div>
  );
}

export function OperacaoCard({ month }: { month: Date }) {
  const { data: arqo, isLoading: la } = useArqoOperacao(month);
  const { data: nexa, isLoading: ln } = useNexaDashboard(month);

  if (la || ln || !arqo || !nexa) return <Skeleton className="h-72 rounded-[2rem]" />;

  return (
    <section className="grid gap-8 rounded-[2rem] bg-[#f7f3ed] p-6 shadow-[0_18px_55px_-35px_rgba(37,24,14,.45)] sm:p-8 lg:grid-cols-2 lg:gap-10">
      {/* PRODUÇÃO */}
      <div className="flex flex-col">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[.2em] text-[#f47418]">Produção</p>
        <div className="grid flex-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <Bloco marca="Arqo">
            <Linha label="Prospecção" valor={arqo.producao.prospeccao} />
            <Linha label="Agendamento" valor={arqo.producao.agendamento} />
            <Linha label="Atendimento" valor={arqo.producao.atendimento} />
          </Bloco>
          <Bloco marca="Nexa">
            <Linha label="Propostas" valor={nexa.producao.propostas} />
            <Linha label="Análise de crédito" valor={nexa.producao.analiseCredito} />
            <Linha label="Treinamento" valor="—" />
          </Bloco>
        </div>
      </div>

      {/* CARTEIRA DE NEGÓCIOS */}
      <div className="flex flex-col lg:border-l lg:border-black/[.08] lg:pl-10">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[.2em] text-[#f47418]">Carteira de negócios</p>
        <div className="grid flex-1 items-stretch gap-x-6 gap-y-2 sm:grid-cols-2">
          <Bloco marca="Arqo" className="h-full">
            <Linha label="Proposta" valor={arqo.carteira.proposta_qtd + nexa.arqo.carteira.propostaQtd} />
            <Linha label="Assinado" valor={arqo.carteira.assinado_qtd + nexa.arqo.carteira.assinadoQtd} />
            <VgvTag valor={arqo.carteira.vgv + nexa.arqo.carteira.vgv} />
          </Bloco>
          <Bloco marca="Nexa" className="h-full">
            <Linha label="Proposta" valor={nexa.carteira.propostaQtd} />
            <Linha label="Em contrato" valor={nexa.carteira.emContratoQtd} />
            <Linha label="Assinado" valor={nexa.carteira.assinadoQtd} />
            <VgvTag valor={nexa.carteira.vgv} />
          </Bloco>
        </div>
      </div>
    </section>
  );
}
