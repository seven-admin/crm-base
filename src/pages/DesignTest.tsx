import {
  DollarSign, TrendingUp, Users, Building2,
  ShoppingCart, BarChart3, Target, Percent,
  AlertTriangle, Clock, CheckCircle2,
} from 'lucide-react';
import { TestKPICard } from '@/components/design-test/TestKPICard';
import { TestTrendChart } from '@/components/design-test/TestTrendChart';
import { TestDonutChart } from '@/components/design-test/TestDonutChart';
import { TestFunnelMini } from '@/components/design-test/TestFunnelMini';

// Mock data
const kpis = [
  { title: 'VGV Total', value: 'R$ 48,2M', variation: 12.5, icon: DollarSign, iconBg: '#FDE8D0', iconColor: '#F4A261', subtitle: '142 unidades' },
  { title: 'Vendas do Mês', value: '23', variation: 8.3, icon: ShoppingCart, iconBg: '#D4EDDA', iconColor: '#81C784', subtitle: 'R$ 7,8M' },
  { title: 'Taxa de Conversão', value: '18,4%', variation: -2.1, icon: Target, iconBg: '#D6EAF8', iconColor: '#7EC8E3', subtitle: '84 leads ativos' },
  { title: 'Ticket Médio', value: 'R$ 339K', variation: 5.7, icon: BarChart3, iconBg: '#E8DAEF', iconColor: '#B39DDB', subtitle: 'por unidade' },
  { title: 'Comissões Pendentes', value: 'R$ 1,2M', variation: -4.2, icon: Percent, iconBg: '#FCE4EC', iconColor: '#E8A0BF', subtitle: '18 registros' },
  { title: 'Clientes Ativos', value: '347', variation: 15.8, icon: Users, iconBg: '#D4EDDA', iconColor: '#81C784', subtitle: '+12 esta semana' },
  { title: 'Empreendimentos', value: '8', variation: 0, icon: Building2, iconBg: '#D6EAF8', iconColor: '#64B5F6', subtitle: '5 em vendas' },
  { title: 'Forecast Mês', value: 'R$ 12,5M', variation: 22.1, icon: TrendingUp, iconBg: '#FFF9C4', iconColor: '#FFD54F', subtitle: '68% da meta' },
];

const trendData = [
  { name: 'Set', value: 3200, prev: 2800 },
  { name: 'Out', value: 4100, prev: 3100 },
  { name: 'Nov', value: 3800, prev: 3500 },
  { name: 'Dez', value: 5200, prev: 4000 },
  { name: 'Jan', value: 4800, prev: 4200 },
  { name: 'Fev', value: 6100, prev: 4500 },
];

const donutData = [
  { name: 'Fechadas', value: 42, color: '#81C784' },
  { name: 'Em negociação', value: 28, color: '#7EC8E3' },
  { name: 'Propostas', value: 18, color: '#FFD54F' },
  { name: 'Perdidas', value: 12, color: '#E8A0BF' },
];

const funnelSteps = [
  { label: 'Leads', value: 340, color: '#64B5F6' },
  { label: 'Qualificados', value: 185, color: '#7EC8E3' },
  { label: 'Visitas', value: 98, color: '#B39DDB' },
  { label: 'Propostas', value: 52, color: '#FFD54F' },
  { label: 'Fechamento', value: 23, color: '#81C784' },
];

const alerts = [
  { icon: AlertTriangle, text: '5 propostas vencem em 48h', color: '#F4A261', bg: '#FDE8D0' },
  { icon: Clock, text: '12 follow-ups atrasados', color: '#E8A0BF', bg: '#FCE4EC' },
  { icon: CheckCircle2, text: 'Meta mensal 68% atingida', color: '#81C784', bg: '#D4EDDA' },
];

export default function DesignTest() {
  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ background: '#F5F6FA' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#1E293B' }}>
          Dashboard Executivo
        </h1>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
          Visão geral do desempenho comercial — Fevereiro 2026
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {kpis.map((kpi, i) => (
          <TestKPICard key={i} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <TestTrendChart title="Vendas — Últimos 6 meses" data={trendData} color="#7EC8E3" />
        </div>
        <TestDonutChart title="Status das Negociações" data={donutData} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TestFunnelMini title="Funil de Vendas" steps={funnelSteps} />

        {/* Alerts Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <p className="text-sm font-semibold mb-5" style={{ color: '#1E293B' }}>
            Alertas & Pendências
          </p>
          <div className="flex flex-col gap-4">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 36, height: 36, borderRadius: '50%', background: alert.bg }}
                >
                  <alert.icon size={16} style={{ color: alert.color }} />
                </div>
                <span className="text-sm" style={{ color: '#475569' }}>
                  {alert.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
