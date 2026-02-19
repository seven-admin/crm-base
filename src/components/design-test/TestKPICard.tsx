import { LucideIcon } from 'lucide-react';

interface TestKPICardProps {
  title: string;
  value: string;
  variation?: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: 'none',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  borderRadius: 16,
  padding: 24,
};

export function TestKPICard({ title, value, variation, icon: Icon, iconBg, iconColor, subtitle }: TestKPICardProps) {
  return (
    <div style={cardStyle}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94A3B8' }}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2" style={{ color: '#1E293B' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{subtitle}</p>
          )}
          {variation !== undefined && (
            <span
              className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full mt-2"
              style={{
                background: variation >= 0 ? '#DCFCE7' : '#FEE2E2',
                color: variation >= 0 ? '#16A34A' : '#DC2626',
              }}
            >
              {variation >= 0 ? '↑' : '↓'} {Math.abs(variation)}%
            </span>
          )}
        </div>
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: iconBg,
          }}
        >
          <Icon size={22} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}
