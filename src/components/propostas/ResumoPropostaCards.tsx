import { Card, CardContent } from '@/components/ui/card';
import { Banknote, CreditCard, Calendar, Wallet } from 'lucide-react';

interface ResumoPropostaCardsProps {
  valorEntrada: number;
  valorPrimeiraParcela: number;
  valorBaloes: number;
  custoTotal: number;
}

export function ResumoPropostaCards({
  valorEntrada,
  valorPrimeiraParcela,
  valorBaloes,
  custoTotal,
}: ResumoPropostaCardsProps) {
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const cards = [
    {
      title: 'Valor da Entrada',
      value: valorEntrada,
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      title: 'Valor da 1ª Parcela',
      value: valorPrimeiraParcela,
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      title: 'Balões Anuais',
      value: valorBaloes,
      icon: Calendar,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    },
    {
      title: 'Custo Efetivo Total',
      value: custoTotal,
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/5',
    },
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className={card.bgColor}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <p className="text-xs text-muted-foreground">{card.title}</p>
            </div>
            <p className={`text-lg font-bold ${card.color}`}>
              {card.value > 0 ? formatCurrency(card.value) : '-'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
