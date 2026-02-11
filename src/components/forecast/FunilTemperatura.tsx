import { Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFunilTemperatura } from '@/hooks/useForecast';
import { CLIENTE_TEMPERATURA_LABELS, type ClienteTemperatura } from '@/types/clientes.types';
import { ForecastBarChart, type ForecastChartDataItem } from './ForecastBarChart';

const CORES_TEMPERATURA: Record<ClienteTemperatura, string> = {
  frio: 'hsl(var(--chart-1))',
  morno: 'hsl(var(--chart-3))',
  quente: 'hsl(var(--destructive))',
};

interface FunilTemperaturaProps {
  gestorId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  empreendimentoIds?: string[];
  onTemperaturaClick?: (temperatura: ClienteTemperatura) => void;
}

export function FunilTemperatura({ gestorId, dataInicio, dataFim, empreendimentoIds, onTemperaturaClick }: FunilTemperaturaProps) {
  const { data: funil, isLoading } = useFunilTemperatura(gestorId, dataInicio, dataFim, empreendimentoIds);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-primary" />
            Funil de Temperatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const total = funil?.reduce((acc, item) => acc + item.quantidade, 0) || 0;

  const dadosGrafico: ForecastChartDataItem[] = funil?.map(item => ({
    nome: CLIENTE_TEMPERATURA_LABELS[item.temperatura],
    valor: item.quantidade,
    cor: CORES_TEMPERATURA[item.temperatura],
    percentual: item.percentual,
    temperatura: item.temperatura
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base">
            <Thermometer className="h-5 w-5 text-primary" />
            Funil de Temperatura
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            Total: {total}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Thermometer className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum cliente cadastrado</p>
          </div>
        ) : (
          <ForecastBarChart
            data={dadosGrafico}
            height={160}
            barSize={24}
            showLabels
            tooltipFormatter={(value, payload) => [
              `${value} clientes (${(payload as unknown as { percentual: number }).percentual}%)`, 
              ''
            ]}
            onBarClick={(data) => onTemperaturaClick?.((data as unknown as { temperatura: ClienteTemperatura }).temperatura)}
          />
        )}
      </CardContent>
    </Card>
  );
}
