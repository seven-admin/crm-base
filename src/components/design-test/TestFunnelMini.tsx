interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface TestFunnelMiniProps {
  title: string;
  steps: FunnelStep[];
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: 'none',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  borderRadius: 16,
  padding: 24,
};

export function TestFunnelMini({ title, steps }: TestFunnelMiniProps) {
  const max = Math.max(...steps.map(s => s.value));

  return (
    <div style={cardStyle}>
      <p className="text-sm font-semibold mb-5" style={{ color: '#1E293B' }}>{title}</p>
      <div className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs w-24 shrink-0 text-right" style={{ color: '#64748B' }}>
              {step.label}
            </span>
            <div className="flex-1 h-3 rounded-full" style={{ background: '#F1F5F9' }}>
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${(step.value / max) * 100}%`,
                  background: step.color,
                }}
              />
            </div>
            <span className="text-xs font-semibold w-10" style={{ color: '#1E293B' }}>
              {step.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
