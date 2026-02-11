import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, CartesianGrid, LabelList } from 'recharts';
import { CORES_ARRAY, TOOLTIP_STYLE } from '@/lib/chartColors';

interface TrendChartProps {
  title: string;
  data: { [key: string]: string | number }[];
  dataKey: string | string[];
  xAxisKey?: string;
  type?: 'area' | 'bar' | 'line';
  colors?: string[];
  height?: number;
  formatValue?: (value: number) => string;
  stacked?: boolean;
  showLabels?: boolean;
}

const defaultColors: string[] = [...CORES_ARRAY];

export function TrendChart({ 
  title, 
  data, 
  dataKey, 
  xAxisKey = 'mes',
  type = 'area',
  colors = defaultColors,
  height = 200,
  formatValue = (v) => v.toLocaleString('pt-BR'),
  stacked = false,
  showLabels = false
}: TrendChartProps) {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];
  
  const formatLabel = (value: number) => {
    if (value === 0) return '';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string; color: string }[]; label?: string }) => {
    if (!active || !payload) return null;
    return (
      <div style={TOOLTIP_STYLE} className="p-3">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey}: {formatValue(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: showLabels ? 20 : 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(0)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {keys.map((key, index) => (
              <Bar 
                key={key}
                dataKey={key} 
                fill={colors[index % colors.length]}
                stackId={stacked ? "stack" : undefined}
                radius={[4, 4, 0, 0]}
                barSize={24}
              >
                {showLabels && keys.length === 1 && (
                  <LabelList
                    dataKey={key}
                    position="top"
                    formatter={formatLabel}
                    fill="hsl(var(--muted-foreground))"
                    fontSize={11}
                    fontWeight={500}
                  />
                )}
              </Bar>
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(0)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {keys.map((key, index) => (
              <Line 
                key={key}
                type="monotone"
                dataKey={key} 
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], r: 3 }}
              />
            ))}
          </LineChart>
        );
      default:
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(0)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {keys.map((key, index) => (
              <Area 
                key={key}
                type="monotone"
                dataKey={key} 
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
