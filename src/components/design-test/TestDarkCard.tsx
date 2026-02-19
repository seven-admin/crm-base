import { ArrowRight } from 'lucide-react';

export function TestDarkCard() {
  return (
    <div
      style={{
        background: '#1E293B',
        borderRadius: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div className="flex-1">
        <p style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
          Upgrade your plan
        </p>
        <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
          Get access to advanced analytics, priority support, and unlimited team members with our Pro plan.
        </p>
      </div>

      <button
        className="flex items-center justify-center gap-2 w-full mt-4"
        style={{
          background: '#F8FAFC',
          color: '#1E293B',
          borderRadius: 14,
          padding: '12px 20px',
          fontSize: 14,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Learn more <ArrowRight size={16} />
      </button>
    </div>
  );
}
