import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAtividadesPorTipoPorSemana } from '@/hooks/useForecast';
import { BarChart3 } from 'lucide-react';
import { ATIVIDADE_TIPO_LABELS } from '@/types/atividades.types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const TIPO_CORES: Record<string, string> = {
  visita: 'hsl(var(--chart-1))',
  ligacao: 'hsl(var(--chart-5))',
  reuniao: 'hsl(var(--chart-4))',
  atendimento: 'hsl(var(--chart-2))',
};

interface AtividadesPorTipoProps {
  gestorId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  empreendimentoIds?: string[];
}

export function AtividadesPorTipo({ gestorId, dataInicio, dataFim, empreendimentoIds }: AtividadesPorTipoProps) {
  const { data: semanas, isLoading } = useAtividadesPorTipoPorSemana(gestorId, dataInicio, dataFim, empreendimentoIds);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            Atividades por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const total = semanas?.reduce((acc, s) => 
    acc + s.visita + s.ligacao + s.reuniao + s.atendimento, 0
  ) || 0;

  const hasData = semanas && semanas.length > 0 && total > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            Atividades por Tipo
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            Total: {total}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-6 text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma atividade registrada este mês</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={semanas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="semana" 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    ATIVIDADE_TIPO_LABELS[name as keyof typeof ATIVIDADE_TIPO_LABELS] || name
                  ]}
                />
                <Bar dataKey="visita" stackId="a" fill={TIPO_CORES.visita} radius={[0, 0, 0, 0]} />
                <Bar dataKey="ligacao" stackId="a" fill={TIPO_CORES.ligacao} radius={[0, 0, 0, 0]} />
                <Bar dataKey="reuniao" stackId="a" fill={TIPO_CORES.reuniao} radius={[0, 0, 0, 0]} />
                <Bar dataKey="atendimento" stackId="a" fill={TIPO_CORES.atendimento} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Legenda */}
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
              {Object.entries(TIPO_CORES).map(([tipo, cor]) => (
                <div key={tipo} className="flex items-center gap-1.5">
                  <span 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: cor }} 
                  />
                  <span className="text-muted-foreground">
                    {ATIVIDADE_TIPO_LABELS[tipo as keyof typeof ATIVIDADE_TIPO_LABELS] || tipo}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
