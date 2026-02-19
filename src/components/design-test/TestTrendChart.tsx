import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TestTrendChartProps {
  title: string;
  data: { name: string; value: number; prev?: number }[];
  color?: string;
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: 'none',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  borderRadius: 16,
  padding: 24,
};

export function TestTrendChart({ title, data, color = '#7EC8E3' }: TestTrendChartProps) {
  return (
    <div style={cardStyle}>
      <p className="text-sm font-semibold mb-4" style={{ color: '#1E293B' }}>{title}</p>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.12} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fill: '#CBD5E1', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#CBD5E1', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: 12,
              }}
            />
            {data[0]?.prev !== undefined && (
              <Area
                type="monotone"
                dataKey="prev"
                stroke="#CBD5E1"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
                dot={false}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${color.replace('#','')})`}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
