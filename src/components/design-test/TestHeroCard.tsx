import { BarChart3, ChevronDown } from 'lucide-react';

const chartData = [
  { day: 'Seg', value: 65 },
  { day: 'Ter', value: 45 },
  { day: 'Qua', value: 80 },
  { day: 'Qui', value: 55 },
  { day: 'Sex', value: 90 },
  { day: 'Sáb', value: 40 },
  { day: 'Dom', value: 70 },
];

const maxVal = Math.max(...chartData.map(d => d.value));

export function TestHeroCard() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: '#E0EAFF' }}>
            <BarChart3 size={20} style={{ color: '#6d93c5' }} />
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 700, color: '#1E293B', lineHeight: 1.1 }}>
            Painel Executivo
          </h1>
        </div>
        <button
          className="flex items-center gap-2"
          style={{ background: '#F1F5F9', borderRadius: 20, padding: '8px 16px', fontSize: 13, color: '#64748B', border: 'none', cursor: 'pointer' }}
        >
          Esta semana <ChevronDown size={14} />
        </button>
      </div>
      <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.5, maxWidth: 360 }}>
        Acompanhe os indicadores de desempenho e metas comerciais.
        <br />
        Compare resultados semanais com períodos anteriores.
      </p>

      <div className="flex-1 flex items-end justify-end mt-4" style={{ minHeight: 0 }}>
        <div className="flex items-end gap-6" style={{ height: '70%', width: '85%' }}>
          {chartData.map((d, i) => {
            const h = (d.value / maxVal) * 100;
            const isMax = d.value === maxVal;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2" style={{ height: '100%', justifyContent: 'flex-end' }}>
                {isMax && (
                  <div style={{ background: '#1E293B', color: '#fff', fontSize: 11, fontWeight: 600, borderRadius: 12, padding: '4px 10px', whiteSpace: 'nowrap' }}>
                    R$ {(d.value * 320).toLocaleString('pt-BR')}
                  </div>
                )}
                <div className="relative flex flex-col items-center" style={{ height: `${h}%`, width: '100%' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: isMax ? '#6d93c5' : '#94A3B8', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', zIndex: 1, flexShrink: 0 }} />
                  <div style={{ flex: 1, width: 2, background: isMax ? 'linear-gradient(to bottom, #6d93c5, rgba(109,147,197,0.1))' : 'linear-gradient(to bottom, #CBD5E1, rgba(203,213,225,0.1))', borderRadius: 1 }} />
                </div>
                <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-4">
        <p style={{ fontSize: 72, fontWeight: 700, color: '#1E293B', lineHeight: 1 }}>
          R$ 2.847.500
        </p>
        <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 8, lineHeight: 1.5 }}>
          VGV total desta semana
          <br />
          <span style={{ color: '#22C55E', fontWeight: 600 }}>↑ 12,5%</span>{' '}
          <span>vs semana anterior</span>
        </p>
      </div>
    </div>
  );
}
