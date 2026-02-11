import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CORES_ARRAY, TOOLTIP_STYLE } from '@/lib/chartColors';

interface DonutChartProps {
  title: string;
  data: { name: string; value: number; color?: string }[];
  height?: number;
  formatValue?: (value: number) => string;
  showLegend?: boolean;
}

export function DonutChart({ 
  title, 
  data, 
  height = 220,
  formatValue = (v) => v.toLocaleString('pt-BR'),
  showLegend = true
}: DonutChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color?: string } }[] }) => {
    if (!active || !payload?.[0]) return null;
    const item = payload[0];
    const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
    return (
      <div style={TOOLTIP_STYLE} className="p-3">
        <p className="font-medium text-sm">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatValue(item.value)} ({percent}%)
        </p>
      </div>
    );
  };

  // Calcular altura do gráfico vs legenda
  const chartHeight = showLegend ? height - 60 : height - 20;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div style={{ minHeight: height }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || CORES_ARRAY[index % CORES_ARRAY.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legenda horizontal padronizada */}
          {showLegend && (
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2">
              {data.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 text-xs"
                >
                  <span 
                    className="w-3 h-3 rounded-sm shrink-0" 
                    style={{ backgroundColor: item.color || CORES_ARRAY[index % CORES_ARRAY.length] }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
