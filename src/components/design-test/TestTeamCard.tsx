import { MoreHorizontal } from 'lucide-react';

const team = [
  { initials: 'RS', name: 'Rafael Santos', role: 'Corretor Pleno', status: 'Disponível', statusColor: '#22C55E', bg: '#E0EAFF', color: '#6d93c5' },
  { initials: 'CM', name: 'Carla Mendes', role: 'Gerente Comercial', status: 'Ausente', statusColor: '#F59E0B', bg: '#FEF3C7', color: '#F59E0B' },
];

export function TestTeamCard() {
  return (
    <div style={{ background: 'transparent', padding: 24, display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-5">
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Corretores</p>
        <button style={{ fontSize: 13, color: '#6d93c5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Ver todos</button>
      </div>
      <div className="flex flex-col flex-1 justify-center">
        {team.map((m, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: '50%', background: m.bg, fontSize: 13, fontWeight: 600, color: m.color }}>{m.initials}</div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{m.name}</p>
                <p style={{ fontSize: 12, color: '#94A3B8' }}>{m.role}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: m.statusColor, background: `${m.statusColor}15`, borderRadius: 20, padding: '3px 10px' }}>{m.status}</span>
              <button className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: '50%', background: '#F8FAFC', border: '1px solid #F1F5F9', cursor: 'pointer' }}>
                <MoreHorizontal size={14} style={{ color: '#94A3B8' }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
