import { ChevronRight, Clock, Users } from 'lucide-react';

const projects = [
  {
    name: 'Residencial Aurora',
    subtitle: 'Goiânia, GO — Incorporadora Visão',
    status: 'Ativo',
    statusColor: '#22C55E',
    statusBg: '#DCFCE7',
    iconBg: '#E0EAFF',
    iconColor: '#6d93c5',
    expanded: true,
    tags: ['Apartamento', '2 e 3 quartos', 'Alto padrão'],
    description: 'Empreendimento residencial com 4 torres, 240 unidades. Lançamento previsto para Abril/2026 com VGV estimado de R$ 180M.',
    meta: [
      { icon: Clock, text: 'Lançamento Abr/26' },
      { icon: Users, text: '12 corretores' },
    ],
  },
  {
    name: 'Comercial Centro',
    subtitle: 'Setor Central — Incorporadora Plano',
    status: 'Em Revisão',
    statusColor: '#F59E0B',
    statusBg: '#FEF3C7',
    iconBg: '#FEF3C7',
    iconColor: '#F59E0B',
    expanded: false,
  },
  {
    name: 'Loteamento Vista Verde',
    subtitle: 'Aparecida de Goiânia — Terra Nova',
    status: 'Rascunho',
    statusColor: '#94A3B8',
    statusBg: '#F1F5F9',
    iconBg: '#F1F5F9',
    iconColor: '#64748B',
    expanded: false,
  },
];

export function TestProjectList() {
  return (
    <div style={{ background: 'transparent', padding: 24, display: 'flex', flexDirection: 'column', borderRadius: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)' }}>
      <div className="flex items-center justify-between mb-4">
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Empreendimentos</p>
        <button style={{ fontSize: 13, color: '#6d93c5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
          Ver todos
        </button>
      </div>

      <div className="flex flex-col flex-1 overflow-auto" style={{ gap: 0 }}>
        {projects.map((p, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: '#bebfc0' }} />}
            <div className="flex items-start gap-3 py-4" style={{ cursor: 'pointer' }}>
              <div className="flex items-center justify-center shrink-0" style={{ width: 48, height: 48, borderRadius: 14, background: p.iconBg }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: p.iconColor, opacity: 0.7 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{p.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span style={{ fontSize: 12, fontWeight: 500, color: p.statusColor, background: p.statusBg, borderRadius: 20, padding: '4px 12px' }}>{p.status}</span>
                    <ChevronRight size={16} style={{ color: '#CBD5E1', transform: p.expanded ? 'rotate(90deg)' : undefined, transition: 'transform 0.2s' }} />
                  </div>
                </div>
                {p.expanded && p.tags && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {p.tags.map((tag, ti) => (
                        <span key={ti} style={{ fontSize: 11, color: '#64748B', background: '#F1F5F9', borderRadius: 12, padding: '3px 10px', fontWeight: 500 }}>{tag}</span>
                      ))}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 10 }}>{p.description}</p>
                    <div className="flex items-center gap-4">
                      {p.meta?.map((m, mi) => (
                        <div key={mi} className="flex items-center gap-1.5">
                          <m.icon size={13} style={{ color: '#94A3B8' }} />
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>{m.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
