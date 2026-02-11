import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function Sparkline({ 
  data, 
  color = 'hsl(var(--primary))', 
  height = 24,
  className 
}: SparklineProps) {
  // Converter array de números para formato do Recharts
  const chartData = data.map((value, index) => ({ value, index }));

  if (data.length < 2) return null;

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
