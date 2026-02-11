import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

export interface ForecastChartDataItem {
  nome: string;
  valor: number;
  cor: string;
  [key: string]: unknown;
}

interface ForecastBarChartProps {
  data: ForecastChartDataItem[];
  height?: number;
  barSize?: number;
  showLabels?: boolean;
  tooltipFormatter?: (value: number, payload: ForecastChartDataItem) => [string, string];
  onBarClick?: (data: ForecastChartDataItem) => void;
}

export function ForecastBarChart({ 
  data, 
  height = 160, 
  barSize = 24,
  showLabels = true,
  tooltipFormatter,
  onBarClick 
}: ForecastBarChartProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
          <XAxis 
            dataKey="nome" 
            tick={false}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            formatter={(value: number, _name: string, props: { payload: ForecastChartDataItem }) => 
              tooltipFormatter 
                ? tooltipFormatter(value, props.payload) 
                : [`${value}`, '']
            }
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '12px'
            }}
            cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
          />
          <Bar 
            dataKey="valor" 
            barSize={barSize}
            radius={[4, 4, 0, 0]}
            onClick={(barData) => onBarClick?.(barData as ForecastChartDataItem)}
          >
            {showLabels && (
              <LabelList 
                dataKey="valor" 
                position="top" 
                fill="hsl(var(--foreground))"
                fontSize={11}
                fontWeight={500}
              />
            )}
            {data.map((item, index) => (
              <Cell 
                key={index} 
                fill={item.cor}
                cursor={onBarClick ? 'pointer' : 'default'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legenda horizontal */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
        {data.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onBarClick?.(item)}
          >
            <span 
              className="w-3 h-3 rounded-sm shrink-0" 
              style={{ backgroundColor: item.cor }}
            />
            <span className="text-muted-foreground font-medium">{item.nome}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
