import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Map, Settings, LogOut, Menu, X,
  UserCog, Building, UserCheck, TrendingUp, Handshake, Kanban,
  ClipboardList, FileSignature, DollarSign, GitBranch, Shield, Palette,
  CalendarDays, BookOpen, Gift, Wallet, User, Target, FileCheck, FilePlus,
  Variable, ClipboardCheck, BarChart2, Calendar, Search, Bell, ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS } from '@/types/auth.types';
import { NotificacaoBell } from './NotificacaoBell';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import logo from '@/assets/logo-sevengroup.png';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  moduleName: string;
  adminOnly?: boolean;
}

interface MenuGroup {
  label: string;
  icon: LucideIcon;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Empreendimentos', icon: Building2,
    items: [
      { icon: Building2, label: 'Listagem', path: '/empreendimentos', moduleName: 'empreendimentos' },
      { icon: Map, label: 'Disponibilidade', path: '/mapa-unidades', moduleName: 'unidades' },
    ],
  },
  {
    label: 'Clientes', icon: Users,
    items: [
      { icon: Users, label: 'Cadastro de Clientes', path: '/clientes', moduleName: 'clientes' },
    ],
  },
  {
    label: 'Comercial', icon: Target,
    items: [
      { icon: BookOpen, label: 'Diário de Bordo', path: '/atividades', moduleName: 'atividades' },
      { icon: TrendingUp, label: 'Resumo', path: '/forecast', moduleName: 'forecast' },
      { icon: Handshake, label: 'Forecast', path: '/negociacoes', moduleName: 'negociacoes' },
      { icon: ClipboardCheck, label: 'Solicitação de Reserva', path: '/solicitacoes', moduleName: 'solicitacoes', adminOnly: true },
      { icon: Target, label: 'Metas', path: '/metas-comerciais', moduleName: 'forecast' },
      { icon: GitBranch, label: 'Configurações Comerciais', path: '/configuracoes/negociacoes', moduleName: 'negociacoes_config', adminOnly: true },
    ],
  },
  {
    label: 'Contratos', icon: FileSignature,
    items: [
      { icon: FileCheck, label: 'Gestão de Contratos', path: '/contratos', moduleName: 'contratos' },
      { icon: FilePlus, label: 'Templates', path: '/contratos?tab=templates', moduleName: 'contratos_templates' },
      { icon: Variable, label: 'Variáveis', path: '/contratos?tab=variaveis', moduleName: 'contratos_variaveis' },
      { icon: ClipboardCheck, label: 'Tipos de Parcela', path: '/tipos-parcela', moduleName: 'contratos_tipos_parcela' },
    ],
  },
  {
    label: 'Financeiro', icon: DollarSign,
    items: [
      { icon: Wallet, label: 'Fluxo de Caixa', path: '/financeiro', moduleName: 'financeiro_fluxo' },
      { icon: BarChart2, label: 'DRE', path: '/dre', moduleName: 'financeiro_dre' },
      { icon: DollarSign, label: 'Comissões', path: '/comissoes', moduleName: 'comissoes' },
      { icon: Gift, label: 'Bonificações', path: '/bonificacoes', moduleName: 'bonificacoes' },
    ],
  },
  {
    label: 'Parceiros', icon: Handshake,
    items: [
      { icon: Building2, label: 'Incorporadoras', path: '/incorporadoras', moduleName: 'incorporadoras' },
      { icon: Building, label: 'Imobiliárias', path: '/imobiliarias', moduleName: 'imobiliarias' },
      { icon: UserCheck, label: 'Corretores', path: '/corretores', moduleName: 'corretores' },
    ],
  },
  {
    label: 'Sistema', icon: Settings,
    items: [
      { icon: Shield, label: 'Auditoria', path: '/auditoria', moduleName: 'auditoria', adminOnly: true },
      { icon: UserCog, label: 'Usuários', path: '/usuarios', moduleName: 'usuarios', adminOnly: true },
      { icon: Settings, label: 'Configurações', path: '/configuracoes', moduleName: 'configuracoes' },
    ],
  },
];


function isPathActive(item: MenuItem, pathname: string, search: string) {
  const [basePath, queryString] = item.path.split('?');
  return queryString
    ? pathname === basePath && search === `?${queryString}`
    : pathname === item.path && !search;
}

export function AppTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut, isAuthenticated } = useAuth();
  const { canAccessModule, isAdmin, isSuperAdmin } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroups, setMobileGroups] = useState<string[]>([]);

  const filterItems = (items: MenuItem[]) =>
    items.filter((item) => {
      if (item.adminOnly) return isAdmin();
      return canAccessModule(item.moduleName);
    });


  const visibleGroups = menuGroups
    .map((g) => ({ ...g, items: filterItems(g.items) }))
    .filter((g) => g.items.length > 0);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const userName = profile?.full_name || 'Usuário';
  const userRole = role ? ROLE_LABELS[role] : '';
  const userInitials = userName
    .split(' ')
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const toggleMobileGroup = (label: string) =>
    setMobileGroups((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  return (
    <header className="sticky top-0 z-40 w-full bg-card shadow-topbar border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 gap-4">
        {/* Logo */}
        <Link to="/" className="shrink-0 flex items-center">
          <img src={logo} alt="SevenGroup" className="h-7" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center overflow-x-auto">
          {visibleGroups.map((group) => {
            const hasActive = group.items.some((i) => isPathActive(i, location.pathname, location.search));
            return (
              <DropdownMenu key={group.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      'relative px-3 h-16 text-sm transition-colors outline-none whitespace-nowrap',
                      hasActive ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                    style={hasActive ? { boxShadow: 'inset 0 -2px 0 0 hsl(var(--primary))' } : undefined}
                  >
                    <span className="flex items-center gap-1.5">
                      {group.label}
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[240px] rounded-xl border-border shadow-popover">
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    {group.label}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {group.items.map((item) => {
                    const active = isPathActive(item, location.pathname, location.search);
                    return (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link
                          to={item.path}
                          className={cn(
                            'flex items-center gap-2.5 cursor-pointer rounded-lg py-2',
                            active && 'bg-primary-soft text-primary font-medium'
                          )}
                        >
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-9 w-9 rounded-full bg-primary-soft text-primary text-xs font-semibold flex items-center justify-center hover:ring-2 hover:ring-primary/20 transition"
                aria-label="Menu do usuário"
              >
                {userInitials || <User className="h-4 w-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border shadow-popover">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userRole}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/configuracoes?tab=perfil" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" /> Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden h-9 w-9 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-card">
              <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                <img src={logo} alt="SevenGroup" className="h-7" />
                <button onClick={() => setMobileOpen(false)} className="h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
                {visibleGroups.map((group) => {
                  const isOpen = mobileGroups.includes(group.label);
                  const color = `hsl(var(${group.colorVar}))`;
                  return (
                    <Collapsible key={group.label} open={isOpen} onOpenChange={() => toggleMobileGroup(group.label)}>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary text-sm font-medium text-foreground">
                        <span className="flex items-center gap-2.5">
                          <group.icon className="h-4 w-4" style={{ color }} />
                          {group.label}
                        </span>
                        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-3 py-1 space-y-0.5">
                        {group.items.map((item) => {
                          const active = isPathActive(item, location.pathname, location.search);
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={cn(
                                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm',
                                active
                                  ? 'bg-primary-soft text-primary font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                              )}
                            >
                              <item.icon className="h-4 w-4" style={{ color }} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
