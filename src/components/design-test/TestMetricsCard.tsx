import { ChevronDown } from 'lucide-react';

const metrics = [
  {
    label: 'Revenue',
    value: '$12.4K',
    bars: [40, 65, 50, 80, 55, 70, 45, 90, 60, 75],
    color: '#6366F1',
  },
  {
    label: 'Orders',
    value: '284',
    bars: [55, 35, 70, 60, 45, 80, 50, 65, 75, 40],
    color: '#22C55E',
  },
  {
    label: 'Visitors',
    value: '14.2K',
    bars: [70, 50, 60, 85, 40, 75, 55, 65, 45, 80],
    color: '#F59E0B',
  },
];

export function TestMetricsCard() {
  return (
    <div
      style={{
        background: 'transparent',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Overview</p>
        <button
          className="flex items-center gap-1"
          style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', borderRadius: 16, padding: '5px 12px', border: 'none', cursor: 'pointer' }}
        >
          Last 30 days <ChevronDown size={12} />
        </button>
      </div>

      <div className="flex flex-1" style={{ gap: 0 }}>
        {metrics.map((m, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-between"
            style={{
              borderRight: i < metrics.length - 1 ? '1px solid #F1F5F9' : undefined,
              padding: '0 16px',
            }}
          >
            <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
              {m.label}
            </span>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#1E293B', margin: '8px 0' }}>
              {m.value}
            </p>
            {/* Mini bar chart */}
            <div className="flex items-end gap-1" style={{ height: 48, width: '100%', justifyContent: 'center' }}>
              {m.bars.map((b, bi) => (
                <div
                  key={bi}
                  style={{
                    width: 6,
                    height: `${(b / 100) * 48}px`,
                    borderRadius: 3,
                    background: bi === m.bars.indexOf(Math.max(...m.bars)) ? m.color : `${m.color}30`,
                    transition: 'height 0.3s',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
