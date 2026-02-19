import { Search, Bell, MessageSquare, Settings } from 'lucide-react';
import { TestHeroCard } from '@/components/design-test/TestHeroCard';
import { TestProjectList } from '@/components/design-test/TestProjectList';
import { TestTeamCard } from '@/components/design-test/TestTeamCard';
import { TestDarkCard } from '@/components/design-test/TestDarkCard';
import { TestMetricsCard } from '@/components/design-test/TestMetricsCard';
import { TestTableCard } from '@/components/design-test/TestTableCard';

const navLinks = [
  { label: 'Empreendimentos', color: '#10B981' },
  { label: 'Comercial', color: '#F5941E' },
  { label: 'Financeiro', color: '#F59E0B' },
  { label: 'Contratos', color: '#60A5FA' },
  { label: 'Clientes', color: '#8B5CF6' },
];
const activeLink = 'Empreendimentos';

const statusBadges = [
  { label: 'Ativo', color: '#22C55E', bg: '#DCFCE7' },
  { label: 'Inativo', color: '#94A3B8', bg: '#F1F5F9' },
  { label: 'Pendente', color: '#F59E0B', bg: '#FEF3C7' },
  { label: 'Aprovado', color: '#f47f19', bg: '#fce0c7' },
  { label: 'Cancelado', color: '#EF4444', bg: '#FEE2E2' },
  { label: 'Em Análise', color: '#8B5CF6', bg: '#EDE9FE' },
  { label: 'Rascunho', color: '#64748B', bg: '#F1F5F9' },
  { label: 'Concluído', color: '#10B981', bg: '#D1FAE5' },
];

export default function DesignTest() {
  return (
    <div className="min-h-screen" style={{ background: '#e1e1e1' }}>
      {/* Top Nav */}
      <nav
        className="flex items-center justify-between px-6"
        style={{ height: 64, background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#f47f19' }}
          >
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>S</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Starter</span>
        </div>

        <div className="flex items-center gap-8">
          {navLinks.map(link => {
            const isActive = link.label === activeLink;
            return (
              <button
                key={link.label}
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#1E293B' : '#94A3B8',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  paddingBottom: 4,
                  borderBottom: isActive ? `2px solid ${link.color}` : '2px solid transparent',
                }}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="relative">
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              placeholder="Buscar..."
              style={{
                width: 260, height: 36, borderRadius: 10,
                border: '1px solid #F1F5F9', background: '#F8FAFC',
                paddingLeft: 36, paddingRight: 12, fontSize: 13, color: '#1E293B', outline: 'none',
              }}
            />
          </div>
          {[Bell, MessageSquare, Settings].map((Icon, i) => (
            <button
              key={i}
              className="flex items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: 10, background: '#F8FAFC', border: '1px solid #F1F5F9', cursor: 'pointer' }}
            >
              <Icon size={16} style={{ color: '#64748B' }} />
            </button>
          ))}
          <div
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#fce0c7', fontSize: 13, fontWeight: 600, color: '#f47f19', cursor: 'pointer' }}
          >
            JD
          </div>
        </div>
      </nav>

      {/* Body */}
      <div className="flex gap-4 p-4">
        <div className="flex flex-col gap-4" style={{ width: '62%' }}>
          <TestHeroCard />
          <div className="flex gap-4">
            <div style={{ width: '50%' }}><TestTeamCard /></div>
            <div style={{ width: '50%' }}><TestDarkCard /></div>
          </div>
        </div>
        <div className="flex flex-col gap-4" style={{ width: '38%' }}>
          <TestProjectList />
          <TestMetricsCard />
        </div>
      </div>

      {/* Full-width table */}
      <div className="px-4 pb-4">
        <TestTableCard />
      </div>

      {/* Labels / Badges */}
      <div className="px-4 pb-4">
        <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', marginBottom: 16 }}>Labels &amp; Badges</p>
          <div className="flex flex-wrap gap-3">
            {statusBadges.map(b => (
              <span key={b.label} style={{ fontSize: 12, fontWeight: 500, color: b.color, background: b.bg, borderRadius: 20, padding: '5px 14px' }}>
                {b.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {statusBadges.map(b => (
              <span key={b.label} style={{ fontSize: 12, fontWeight: 500, color: b.color, border: `1px solid ${b.color}40`, borderRadius: 20, padding: '4px 13px', background: 'transparent' }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form Elements */}
      <div className="px-4 pb-4">
        <div style={{ background: '#FFFFFF', borderRadius: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', marginBottom: 16 }}>Elementos de Formulário</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Text Input */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Nome do Cliente</label>
              <input placeholder="Ex: João da Silva" style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 14px', fontSize: 13, color: '#1E293B', outline: 'none', background: '#FAFBFC' }} />
            </div>
            {/* Email */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>E-mail</label>
              <input type="email" placeholder="joao@email.com" style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 14px', fontSize: 13, color: '#1E293B', outline: 'none', background: '#FAFBFC' }} />
            </div>
            {/* Select */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Empreendimento</label>
              <select style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 10px', fontSize: 13, color: '#1E293B', outline: 'none', background: '#FAFBFC', cursor: 'pointer' }}>
                <option>Selecione...</option>
                <option>Residencial Aurora</option>
                <option>Comercial Centro</option>
                <option>Loteamento Vista Verde</option>
              </select>
            </div>
            {/* CPF */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>CPF</label>
              <input placeholder="000.000.000-00" style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 14px', fontSize: 13, color: '#1E293B', outline: 'none', background: '#FAFBFC' }} />
            </div>
          </div>

          {/* Textarea */}
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Observações</label>
            <textarea placeholder="Digite suas observações aqui..." rows={3} style={{ width: '100%', borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 14px', fontSize: 13, color: '#1E293B', outline: 'none', background: '#FAFBFC', resize: 'vertical' }} />
          </div>

          {/* Checkboxes & Radios */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 8 }}>Interesse</label>
              {['Apartamento', 'Lote', 'Sala Comercial'].map(opt => (
                <label key={opt} className="flex items-center gap-2" style={{ fontSize: 13, color: '#1E293B', marginBottom: 6, cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: '#f47f19', width: 16, height: 16 }} /> {opt}
                </label>
              ))}
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 8 }}>Temperatura</label>
              {['Quente', 'Morno', 'Frio'].map(opt => (
                <label key={opt} className="flex items-center gap-2" style={{ fontSize: 13, color: '#1E293B', marginBottom: 6, cursor: 'pointer' }}>
                  <input type="radio" name="temp" style={{ accentColor: '#f47f19', width: 16, height: 16 }} /> {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3" style={{ marginTop: 20 }}>
            <button style={{ background: '#f47f19', color: '#fff', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Salvar Cliente
            </button>
            <button style={{ background: '#F1F5F9', color: '#475569', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button style={{ background: 'transparent', color: '#f47f19', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 500, border: '1px solid #f47f19', cursor: 'pointer' }}>
              Rascunho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
