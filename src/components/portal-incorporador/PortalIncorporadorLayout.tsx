import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, LogOut, BarChart3, TrendingUp, Palette, ArrowRight, ClipboardList, Map, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import logo from '@/assets/logo-full.png';

const routeTitles: Record<string, { title: string; subtitle?: string }> = {
  '/portal-incorporador': { 
    title: 'Portal do Incorporador', 
    subtitle: 'Visão geral dos seus empreendimentos' 
  },
  '/portal-incorporador/executivo': { 
    title: 'Dashboard Executivo', 
    subtitle: 'KPIs e métricas consolidadas' 
  },
  '/portal-incorporador/forecast': { 
    title: 'Resumo', 
    subtitle: 'Resumo de vendas e indicadores comerciais' 
  },
  '/portal-incorporador/marketing': { 
    title: 'Produção de Marketing', 
    subtitle: 'Acompanhe os tickets de criação' 
  },
  '/portal-incorporador/planejamento': { 
    title: 'Planejamento', 
    subtitle: 'Cronograma de tarefas dos empreendimentos' 
  },
  '/portal-incorporador/disponibilidade': { 
    title: 'Disponibilidade', 
    subtitle: 'Visualize a disponibilidade de unidades por empreendimento' 
  },
  '/portal-incorporador/propostas': { 
    title: 'Aprovação de Propostas e Negociações',
    subtitle: 'Analise e aprove propostas comerciais'
  },
};

export function PortalIncorporadorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const { title, subtitle } = routeTitles[location.pathname] || { title: 'Portal' };
  const isInternalPage = location.pathname !== '/portal-incorporador';

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Simplified */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center justify-between">
          {/* Logo + Title */}
          <Link to="/portal-incorporador" className="flex flex-col">
            <img src={logo} alt="Logo" className="h-8 brightness-0" />
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
              Portal do Incorporador
            </span>
          </Link>
          
          {/* User Info + Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <div className="mb-6">
          {isInternalPage && (
            <>
              <Link 
                to="/portal-incorporador" 
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            </>
          )}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>

        {/* KPIs (Outlet) antes dos cards na home */}
        <Outlet />
      
        {/* Cards de navegação compactos - apenas na página principal */}
        {!isInternalPage && (
          <div className="grid gap-3 grid-cols-3 lg:grid-cols-6">
            {[
              { to: '/portal-incorporador/executivo', icon: BarChart3, title: 'Executivo', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
              { to: '/portal-incorporador/forecast', icon: TrendingUp, title: 'Forecast', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
              { to: '/portal-incorporador/disponibilidade', icon: Map, title: 'Disponibilidade', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
              { to: '/portal-incorporador/propostas', icon: FileText, title: 'Negociações/Propostas', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
              { to: '/portal-incorporador/marketing', icon: Palette, title: 'Marketing', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
              { to: '/portal-incorporador/planejamento', icon: ClipboardList, title: 'Planejamento', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
            ].map((item) => (
              <Link key={item.to} to={item.to}>
                <Card className="hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer border h-full">
                  <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                    <div className={`p-2.5 rounded-lg ${item.bg}`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <span className="text-xs font-medium leading-tight">{item.title}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </main>
    </div>
  );
}
