import { Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  onSelect: (empreendimentoId: string) => void;
}

export function NegociacoesEmpreendimentoGate({ onSelect }: Props) {
  const { data: empreendimentos = [], isLoading } = useEmpreendimentosSelect();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">Selecione o Empreendimento</h2>
        <p className="text-sm text-muted-foreground">
          Escolha um empreendimento para visualizar o forecast
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {empreendimentos.map((emp) => (
            <Card
              key={emp.id}
              className="p-6 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all text-center"
              onClick={() => onSelect(emp.id)}
            >
              <Building2 className="h-8 w-8 mx-auto mb-3 text-primary" />
              <p className="font-medium">{emp.nome}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
