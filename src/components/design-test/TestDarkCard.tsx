import { ArrowRight } from 'lucide-react';

export function TestDarkCard() {
  return (
    <div
      style={{
        background: '#d0d6dd',
        borderRadius: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div className="flex-1">
        <p style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
          Novo Empreendimento
        </p>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
          Configure unidades, tabelas de preço e regras comerciais para lançar seu próximo empreendimento.
        </p>
      </div>
      <button
        className="flex items-center justify-center gap-2 w-full mt-4"
        style={{ background: '#FFFFFF', color: '#1E293B', borderRadius: 14, padding: '12px 20px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
      >
        Cadastrar Empreendimento <ArrowRight size={16} />
      </button>
    </div>
  );
}
