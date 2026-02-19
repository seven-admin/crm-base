import { MoreHorizontal } from 'lucide-react';

const team = [
  { initials: 'AR', name: 'Ana Ribeiro', role: 'Product Designer', status: 'Online', statusColor: '#22C55E', bg: '#EEF2FF', color: '#6366F1' },
  { initials: 'MC', name: 'Marco Costa', role: 'Frontend Dev', status: 'Away', statusColor: '#F59E0B', bg: '#FEF3C7', color: '#F59E0B' },
];

export function TestTeamCard() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Team</p>
        <button style={{ fontSize: 13, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
          See all
        </button>
      </div>

      <div className="flex flex-col flex-1 justify-center">
        {team.map((m, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 40, height: 40, borderRadius: '50%', background: m.bg, fontSize: 13, fontWeight: 600, color: m.color }}
              >
                {m.initials}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{m.name}</p>
                <p style={{ fontSize: 12, color: '#94A3B8' }}>{m.role}</p>
              </div>
              {/* Badge */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: m.statusColor,
                  background: `${m.statusColor}15`,
                  borderRadius: 20,
                  padding: '3px 10px',
                }}
              >
                {m.status}
              </span>
              {/* Action */}
              <button
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#F8FAFC',
                  border: '1px solid #F1F5F9',
                  cursor: 'pointer',
                }}
              >
                <MoreHorizontal size={14} style={{ color: '#94A3B8' }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
