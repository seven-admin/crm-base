import { Card } from '@/components/ui/card';
import type { ArqoCarteiraBucket } from '@/hooks/useArqoCarteira';

function CarteiraCol({ titulo, cor, qtd }: { titulo: string; cor?: string; qtd: number }) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-sm font-medium text-[#181613]">
        {cor && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} />}
        <span className="truncate">{titulo}</span>
      </p>
      <p className="text-2xl font-semibold text-[#181613] tabular-nums">{qtd}</p>
    </div>
  );
}

export function ArqoCarteiraCard({ buckets, subtitle }: { buckets: ArqoCarteiraBucket[]; subtitle?: string }) {
  return (
    <Card className="p-5 shadow-none">
      <div className="rounded-xl bg-[#bcd7f2] px-4 py-2 text-sm font-semibold text-[#173a5e]">Carteira de Negócios</div>
      <p className="mt-2 text-[11px] text-muted-foreground">{subtitle ?? 'Seu funil de oportunidades em aberto'}</p>
      {buckets.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nenhuma oportunidade em aberto.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {buckets.map((b) => <CarteiraCol key={b.etapaId} titulo={b.nome} cor={b.cor} qtd={b.qtd} />)}
        </div>
      )}
    </Card>
  );
}
