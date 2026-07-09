// TODO: substituir por dados reais
import { Users, Percent, TrendingUp, Home, type LucideIcon } from 'lucide-react';

export interface MockKPI {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor: 'orange' | 'green' | 'blue' | 'purple' | 'red';
}

export const mockKPIs: MockKPI[] = [
  {
    title: 'Leads novos no mês',
    value: '342',
    change: '+12,4% vs mês anterior',
    changeType: 'positive',
    icon: Users,
    iconColor: 'blue',
  },
  {
    title: 'Taxa de conversão',
    value: '8,4%',
    change: '+0,6 p.p.',
    changeType: 'positive',
    icon: Percent,
    iconColor: 'purple',
  },
  {
    title: 'VGV em negociação',
    value: 'R$ 18,2M',
    change: '23 propostas ativas',
    changeType: 'neutral',
    icon: TrendingUp,
    iconColor: 'orange',
  },
  {
    title: 'Vendas no mês',
    value: '7 unidades',
    change: 'Ticket médio R$ 612K',
    changeType: 'positive',
    icon: Home,
    iconColor: 'green',
  },
];

export interface FunilEtapa {
  etapa: string;
  quantidade: number;
  tipo: 'ativo' | 'ganho' | 'perdido';
}

export const mockFunilArqo: FunilEtapa[] = [
  { etapa: 'Novo', quantidade: 342, tipo: 'ativo' },
  { etapa: 'Qualificado', quantidade: 198, tipo: 'ativo' },
  { etapa: 'Reunião', quantidade: 96, tipo: 'ativo' },
  { etapa: 'Proposta', quantidade: 41, tipo: 'ativo' },
  { etapa: 'Ganho', quantidade: 29, tipo: 'ganho' },
  { etapa: 'Perdido', quantidade: 12, tipo: 'perdido' },
];

export interface TopEmpreendimento {
  nome: string;
  tipo: 'Vertical' | 'Loteamento' | 'Comercial';
  leadsAtivos: number;
  propostas: number;
  vendasMes: number;
  vgvNegociado: number;
}

export const mockTopEmpreendimentos: TopEmpreendimento[] = [
  { nome: 'Residencial Aurora', tipo: 'Vertical',   leadsAtivos: 84, propostas: 9, vendasMes: 3, vgvNegociado: 6_400_000 },
  { nome: 'Loteamento Vista Verde', tipo: 'Loteamento', leadsAtivos: 61, propostas: 6, vendasMes: 2, vgvNegociado: 3_900_000 },
  { nome: 'Edifício Marésia',    tipo: 'Vertical',   leadsAtivos: 47, propostas: 4, vendasMes: 1, vgvNegociado: 3_100_000 },
  { nome: 'Business Center Norte', tipo: 'Comercial', leadsAtivos: 38, propostas: 3, vendasMes: 1, vgvNegociado: 2_800_000 },
  { nome: 'Loteamento Parque das Águas', tipo: 'Loteamento', leadsAtivos: 32, propostas: 1, vendasMes: 0, vgvNegociado: 2_000_000 },
];
