import { Filter } from 'lucide-react';

const transactions = [
  { cliente: 'João Martins', empreendimento: 'Residencial Aurora', status: 'Aprovada', statusColor: '#22C55E', statusBg: '#DCFCE7', value: 'R$ 485.000,00', date: '12 Fev 2026' },
  { cliente: 'Maria Oliveira', empreendimento: 'Comercial Centro', status: 'Pendente', statusColor: '#F59E0B', statusBg: '#FEF3C7', value: 'R$ 320.000,00', date: '11 Fev 2026' },
  { cliente: 'Carlos Ribeiro', empreendimento: 'Residencial Aurora', status: 'Aprovada', statusColor: '#22C55E', statusBg: '#DCFCE7', value: 'R$ 612.000,00', date: '10 Fev 2026' },
  { cliente: 'Ana Paula Costa', empreendimento: 'Loteamento Vista Verde', status: 'Cancelada', statusColor: '#EF4444', statusBg: '#FEE2E2', value: 'R$ 185.000,00', date: '09 Fev 2026' },
  { cliente: 'Fernando Alves', empreendimento: 'Residencial Aurora', status: 'Aprovada', statusColor: '#22C55E', statusBg: '#DCFCE7', value: 'R$ 540.000,00', date: '08 Fev 2026' },
  { cliente: 'Luciana Ferreira', empreendimento: 'Comercial Centro', status: 'Em Análise', statusColor: '#8B5CF6', statusBg: '#EDE9FE', value: 'R$ 275.000,00', date: '07 Fev 2026' },
];

export function TestTableCard() {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)', padding: 24 }}>
      <div className="flex items-center justify-between mb-5">
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Negociações Recentes</p>
        <button className="flex items-center gap-1.5" style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', borderRadius: 16, padding: '5px 12px', border: 'none', cursor: 'pointer' }}>
          <Filter size={12} /> Filtrar
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Cliente', 'Empreendimento', 'Status', 'Valor', 'Data'].map(h => (
              <th key={h} style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={i} style={{ borderBottom: i < transactions.length - 1 ? '1px solid #F1F5F9' : undefined }}>
              <td style={{ padding: '12px', fontSize: 14, fontWeight: 500, color: '#1E293B' }}>{t.cliente}</td>
              <td style={{ padding: '12px', fontSize: 13, color: '#64748B' }}>{t.empreendimento}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: t.statusColor, background: t.statusBg, borderRadius: 20, padding: '3px 10px' }}>{t.status}</span>
              </td>
              <td style={{ padding: '12px', fontSize: 14, color: '#1E293B' }}>{t.value}</td>
              <td style={{ padding: '12px', fontSize: 13, color: '#94A3B8' }}>{t.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
