import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DonutItem {
  name: string;
  value: number;
  color: string;
}

interface TestDonutChartProps {
  title: string;
  data: DonutItem[];
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: 'none',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  borderRadius: 16,
  padding: 24,
};

export function TestDonutChart({ title, data }: TestDonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={cardStyle}>
      <p className="text-sm font-semibold mb-4" style={{ color: '#1E293B' }}>{title}</p>
      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: 160, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold" style={{ color: '#1E293B' }}>{total}</span>
            <span className="text-[10px]" style={{ color: '#94A3B8' }}>Total</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="block rounded-full" style={{ width: 10, height: 10, background: d.color }} />
              <span className="text-xs" style={{ color: '#64748B' }}>{d.name}</span>
              <span className="text-xs font-semibold ml-auto" style={{ color: '#1E293B' }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
