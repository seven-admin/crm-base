import { Card, CardContent } from '@/components/ui/card';
import { Users, PlayCircle, CheckCircle2, Clock, Target } from 'lucide-react';

interface EquipeKPIsProps {
  kpis: {
    totalMembros: number;
    totalEmProducao: number;
    totalConcluidos: number;
    tempoMedioGeral: number | null;
    taxaNoPrazoGeral: number;
  };
}

export function EquipeKPIs({ kpis }: EquipeKPIsProps) {
  const cards = [
    {
      label: 'Membros Ativos',
      value: kpis.totalMembros,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Em Produção',
      value: kpis.totalEmProducao,
      icon: PlayCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Concluídos no Período',
      value: kpis.totalConcluidos,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      label: 'Tempo Médio',
      value: kpis.tempoMedioGeral !== null ? `${kpis.tempoMedioGeral}d` : '-',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10'
    },
    {
      label: 'Taxa no Prazo',
      value: `${kpis.taxaNoPrazoGeral}%`,
      icon: Target,
      color: kpis.taxaNoPrazoGeral >= 80 
        ? 'text-emerald-600 dark:text-emerald-400' 
        : kpis.taxaNoPrazoGeral >= 50 
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-destructive',
      bgColor: kpis.taxaNoPrazoGeral >= 80 
        ? 'bg-emerald-500/10' 
        : kpis.taxaNoPrazoGeral >= 50 
          ? 'bg-amber-500/10'
          : 'bg-destructive/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
