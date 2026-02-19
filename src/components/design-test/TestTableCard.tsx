import { Filter } from 'lucide-react';

const transactions = [
  { name: 'Acme Corp', status: 'Completed', statusColor: '#22C55E', statusBg: '#DCFCE7', value: 'R$ 12.450,00', date: '12 Feb 2026' },
  { name: 'Globex Inc', status: 'Pending', statusColor: '#F59E0B', statusBg: '#FEF3C7', value: 'R$ 8.900,00', date: '11 Feb 2026' },
  { name: 'Stark Industries', status: 'Completed', statusColor: '#22C55E', statusBg: '#DCFCE7', value: 'R$ 24.100,00', date: '10 Feb 2026' },
  { name: 'Wayne Enterprises', status: 'Failed', statusColor: '#EF4444', statusBg: '#FEE2E2', value: 'R$ 5.320,00', date: '09 Feb 2026' },
  { name: 'Umbrella Corp', status: 'Completed', statusColor: '#22C55E', statusBg: '#DCFCE7', value: 'R$ 18.750,00', date: '08 Feb 2026' },
  { name: 'Cyberdyne Systems', status: 'Pending', statusColor: '#F59E0B', statusBg: '#FEF3C7', value: 'R$ 3.200,00', date: '07 Feb 2026' },
];

export function TestTableCard() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        padding: 24,
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>Recent Transactions</p>
        <button
          className="flex items-center gap-1.5"
          style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', borderRadius: 16, padding: '5px 12px', border: 'none', cursor: 'pointer' }}
        >
          <Filter size={12} /> Filter
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Name', 'Status', 'Value', 'Date'].map(h => (
              <th
                key={h}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={i} style={{ borderBottom: i < transactions.length - 1 ? '1px solid #F1F5F9' : undefined }}>
              <td style={{ padding: '12px', fontSize: 14, fontWeight: 500, color: '#1E293B' }}>{t.name}</td>
              <td style={{ padding: '12px' }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: t.statusColor,
                    background: t.statusBg,
                    borderRadius: 20,
                    padding: '3px 10px',
                  }}
                >
                  {t.status}
                </span>
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
