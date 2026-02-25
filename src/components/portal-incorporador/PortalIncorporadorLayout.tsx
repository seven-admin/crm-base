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
    title: 'Forecast', 
    subtitle: 'Previsões e atividades comerciais' 
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
    title: 'Aprovação de Propostas', 
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
      
      {/* Cards de navegação - apenas na página principal */}
      {!isInternalPage && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Link to="/portal-incorporador/executivo" className="h-full">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4 h-full">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">Dashboard Executivo</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">KPIs e métricas detalhadas</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/portal-incorporador/forecast" className="h-full">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4 h-full">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">Forecast</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">Previsões e atividades</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/portal-incorporador/marketing" className="h-full">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4 h-full">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                  <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">Marketing</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">Tickets de criação</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/portal-incorporador/planejamento" className="h-full">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4 h-full">
                <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
                  <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">Planejamento</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">Cronograma de tarefas</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/portal-incorporador/disponibilidade" className="h-full">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4 h-full">
                <div className="p-3 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex-shrink-0">
                  <Map className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">Disponibilidade</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">Mapa de unidades</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/portal-incorporador/propostas" className="h-full">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4 h-full">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
                  <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">Propostas</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">Aprovação de propostas</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
      
      <Outlet />
    </main>
    </div>
  );
}
