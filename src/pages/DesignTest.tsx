import { Search, Bell, MessageSquare, Settings } from 'lucide-react';
import { TestHeroCard } from '@/components/design-test/TestHeroCard';
import { TestProjectList } from '@/components/design-test/TestProjectList';
import { TestTeamCard } from '@/components/design-test/TestTeamCard';
import { TestDarkCard } from '@/components/design-test/TestDarkCard';
import { TestMetricsCard } from '@/components/design-test/TestMetricsCard';

const navLinks = ['Dashboard', 'Projects', 'Inbox', 'Schedule', 'Reports'];
const activeLink = 'Dashboard';

export default function DesignTest() {
  return (
    <div className="min-h-screen" style={{ background: '#F5F6FA' }}>
      {/* Top Nav */}
      <nav
        className="flex items-center justify-between px-6"
        style={{ height: 64, background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366F1' }}
          >
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>S</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>Starter</span>
        </div>

        {/* Center links */}
        <div className="flex items-center gap-8">
          {navLinks.map(link => (
            <button
              key={link}
              style={{
                fontSize: 14,
                fontWeight: link === activeLink ? 600 : 400,
                color: link === activeLink ? '#1E293B' : '#94A3B8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                paddingBottom: 4,
                borderBottom: link === activeLink ? '2px solid #6366F1' : '2px solid transparent',
              }}
            >
              {link}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative">
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              placeholder="Search..."
              style={{
                width: 260,
                height: 36,
                borderRadius: 10,
                border: '1px solid #F1F5F9',
                background: '#F8FAFC',
                paddingLeft: 36,
                paddingRight: 12,
                fontSize: 13,
                color: '#1E293B',
                outline: 'none',
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
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEF2FF', fontSize: 13, fontWeight: 600, color: '#6366F1', cursor: 'pointer' }}
          >
            JD
          </div>
        </div>
      </nav>

      {/* Body */}
      <div className="flex gap-4 p-4" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Left column 62% */}
        <div className="flex flex-col gap-4" style={{ width: '62%' }}>
          {/* Hero — 58% */}
          <div style={{ flex: '0 0 58%', minHeight: 0 }}>
            <TestHeroCard />
          </div>
          {/* Bottom row — 42% */}
          <div className="flex gap-4" style={{ flex: '0 0 calc(42% - 16px)', minHeight: 0 }}>
            <div style={{ width: '50%' }}>
              <TestTeamCard />
            </div>
            <div style={{ width: '50%' }}>
              <TestDarkCard />
            </div>
          </div>
        </div>

        {/* Right column 38% */}
        <div className="flex flex-col gap-4" style={{ width: '38%' }}>
          {/* Project list — 58% */}
          <div style={{ flex: '0 0 58%', minHeight: 0 }}>
            <TestProjectList />
          </div>
          {/* Metrics — 42% */}
          <div style={{ flex: '0 0 calc(42% - 16px)', minHeight: 0 }}>
            <TestMetricsCard />
          </div>
        </div>
      </div>
    </div>
  );
}
