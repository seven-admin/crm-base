import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  LogOut,
  UserCog,
} from 'lucide-react';
import logo from '@/assets/logo-full.png';

const baseMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/portal-corretor' },
  { icon: Building2, label: 'Empreendimentos', path: '/portal-corretor/empreendimentos' },
  { icon: Calendar, label: 'Solicitações', path: '/portal-corretor/solicitacoes' },
  { icon: Users, label: 'Clientes', path: '/portal-corretor/clientes' },
];

const gestorExtraItems = [
  { icon: UserCog, label: 'Meus Corretores', path: '/portal-corretor/corretores' },
  { icon: Building2, label: 'Minha Imobiliária', path: '/portal-corretor/minha-imobiliaria' },
];

const routeTitles: Record<string, { title: string; subtitle?: string }> = {
  '/portal-corretor': { 
    title: 'Dashboard', 
    subtitle: 'Bem-vindo ao Portal' 
  },
  '/portal-corretor/empreendimentos': { 
    title: 'Empreendimentos', 
    subtitle: 'Veja os empreendimentos disponíveis e solicite reservas' 
  },
  '/portal-corretor/solicitacoes': { 
    title: 'Solicitações', 
    subtitle: 'Acompanhe o status das suas solicitações de reserva' 
  },
  '/portal-corretor/clientes': { 
    title: 'Clientes', 
    subtitle: 'Gerencie seus clientes e leads' 
  },
  '/portal-corretor/corretores': { 
    title: 'Meus Corretores', 
    subtitle: 'Gerencie os corretores da sua imobiliária' 
  },
  '/portal-corretor/minha-imobiliaria': { 
    title: 'Minha Imobiliária', 
    subtitle: 'Visualize e edite os dados cadastrais da sua imobiliária' 
  },
};

export function PortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, role } = useAuth();

  const isGestor = role === 'gestor_imobiliaria';
  const menuItems = isGestor ? [...baseMenuItems, ...gestorExtraItems] : baseMenuItems;
  const roleLabel = isGestor ? 'Gestor de Imobiliária' : 'Corretor';

  const { title, subtitle } = routeTitles[location.pathname] || { title: 'Portal' };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const isEmpreendimentoDetalhe = location.pathname.startsWith('/portal-corretor/empreendimentos/');
  const showLayoutTitle = !isEmpreendimentoDetalhe;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-sidebar">
        {/* Row 1: Logo + User Info */}
        <div className="container flex h-14 items-center justify-between border-b border-sidebar-border">
          <Link to="/portal-corretor" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-sidebar-foreground">{profile?.full_name}</p>
              <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
        {/* Row 2: Navigation */}
        <nav className="border-b border-sidebar-border overflow-x-auto">
          <div className="container flex items-center gap-1 h-12">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {showLayoutTitle && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
