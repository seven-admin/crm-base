import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2, Users, Map, Settings, LogOut, Menu, X, FileText,
  UserCog, Shield, ChevronDown, Target, Kanban, GitBranch, TrendingUp, CalendarDays,
  Home, Handshake, User as UserIcon,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmpresaAccess } from '@/hooks/useEmpresaAccess';

import { ROLE_LABELS } from '@/types/auth.types';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SevenMegaMenu, type SevenMenuCategory } from './SevenMegaMenu';
import logoSeven from '@/assets/logo-sevengroup.png';
import logoArqo from '@/assets/logo-arqo.png';
import logoNexa from '@/assets/logo-nexa.png';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  moduleName: string;
  adminOnly?: boolean;
  description?: string;
}

interface MenuGroup {
  label: string;
  icon: LucideIcon;
  items: MenuItem[];
}

// Grupo Seven agrupado por categoria (mega-menu)
const sevenCategories: { label: string; items: MenuItem[] }[] = [
  {
    label: 'Portfólio',
    items: [
      { icon: Building2, label: 'Empreendimentos', path: '/empreendimentos', moduleName: 'empreendimentos', description: 'Projetos e obras' },
      { icon: Map, label: 'Disponibilidade', path: '/mapa-unidades', moduleName: 'unidades', description: 'Mapa de unidades' },
    ],
  },
  {
    label: 'Pessoas',
    items: [
      { icon: Users, label: 'Clientes', path: '/clientes', moduleName: 'clientes', description: 'Cadastro geral' },
    ],
  },
  {
    label: 'Parceiros',
    items: [
      { icon: Building2, label: 'Incorporadoras', path: '/incorporadoras', moduleName: 'incorporadoras', description: 'Empresas parceiras' },
      { icon: Handshake, label: 'Imobiliárias', path: '/imobiliarias', moduleName: 'imobiliarias', description: 'Rede parceira' },
      { icon: UserCog, label: 'Corretores', path: '/corretores', moduleName: 'corretores', description: 'Time comercial externo' },
    ],
  },
];

const menuGroups: MenuGroup[] = [
  {
    label: 'Arqo', icon: Target,
    items: [
      { icon: Kanban, label: 'Roleta', path: '/arqo/roleta', moduleName: 'arqo_roleta' },
      { icon: GitBranch, label: 'Kanban de Leads', path: '/arqo/leads', moduleName: 'arqo_leads' },
      { icon: TrendingUp, label: 'Forecast', path: '/arqo/forecast', moduleName: 'arqo_forecast' },
      { icon: Shield, label: 'Admin', path: '/arqo/admin', moduleName: 'arqo_admin' },
      { icon: Settings, label: 'Configurações', path: '/arqo/config', moduleName: 'arqo_config' },
    ],
  },
  {
    label: 'Nexa', icon: CalendarDays,
    items: [
      { icon: CalendarDays, label: 'Agenda de Visitas', path: '/nexa/agenda', moduleName: 'nexa_agenda' },
      { icon: Map, label: 'Disponibilidade', path: '/nexa/disponibilidade', moduleName: 'nexa_disponibilidade' },
      { icon: FileText, label: 'Contratos', path: '/nexa/contratos', moduleName: 'nexa_contratos' },
      { icon: FileText, label: 'Modelos de Contrato', path: '/nexa/contratos/modelos', moduleName: 'nexa_contratos_modelos' },
      { icon: FileText, label: 'Blocos de Texto', path: '/nexa/contratos/blocos', moduleName: 'nexa_contratos_blocos' },
      { icon: Settings, label: 'Variáveis de Contrato', path: '/nexa/contratos/variaveis', moduleName: 'nexa_contratos_variaveis' },
    ],
  },
  {
    label: 'Sistema', icon: Settings,
    items: [
      { icon: UserIcon, label: 'Meu Perfil', path: '/meu-perfil', moduleName: '__self__' },
      { icon: Shield, label: 'Perfis de Acesso', path: '/usuarios?tab=perfis', moduleName: 'usuarios', adminOnly: true },
      { icon: Shield, label: 'Auditoria', path: '/auditoria', moduleName: 'auditoria', adminOnly: true },
      { icon: UserCog, label: 'Usuários', path: '/usuarios', moduleName: 'usuarios', adminOnly: true },
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
  const { profile, role, signOut } = useAuth();
  const { canAccessModule, isAdmin } = usePermissions();
  const { canAccessGroup, isExterno, empresa } = useEmpresaAccess();
  const tenantLogo = empresa === 'arqo'
    ? { src: logoArqoAsset.url, alt: 'Arqo', className: 'h-6' }
    : empresa === 'nexa'
    ? { src: logoNexaAsset.url, alt: 'Nexa', className: 'h-6' }
    : { src: logoSeven, alt: 'SevenGroup', className: 'h-5' };
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroups, setMobileGroups] = useState<string[]>([]);

  const filterItems = (items: MenuItem[]) =>
    items.filter((item) => {
      if (item.moduleName === '__self__') return true;
      if (item.adminOnly) return isAdmin();
      return canAccessModule(item.moduleName);
    });


  const visibleGroups = menuGroups
    .map((g) => ({ ...g, items: filterItems(g.items) }))
    .filter((g) => g.items.length > 0)
    .filter((g) => {
      if (g.label === 'Arqo') return canAccessGroup('arqo');
      if (g.label === 'Nexa') return canAccessGroup('nexa');
      if (g.label === 'Sistema') return canAccessGroup('sistema') && !isExterno;
      return true;
    });

  const sevenVisible: SevenMenuCategory[] = canAccessGroup('seven')
    ? sevenCategories
        .map((c) => ({ ...c, items: filterItems(c.items) }))
        .filter((c) => c.items.length > 0)
    : [];
  const sevenHasActive = sevenVisible.some((c) =>
    c.items.some((i) => isPathActive(i, location.pathname, location.search)),
  );


  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const userName = profile?.full_name || 'Usuário';
  const userRole = role ? ROLE_LABELS[role] : '';



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
          <img src={tenantLogo.src} alt={tenantLogo.alt} className={tenantLogo.className} />
        </Link>

        {/* Desktop nav (right aligned) */}
        <nav className="hidden lg:flex items-center gap-1 ml-auto overflow-x-auto">
          <SevenMegaMenu categories={sevenVisible} hasActive={sevenHasActive} />
          {visibleGroups.map((group) => {
            const hasActive = group.items.some((i) => isPathActive(i, location.pathname, location.search));
            const isSistema = group.label === 'Sistema';
            return (
              <DropdownMenu key={group.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      'relative px-3 h-16 text-sm transition-colors outline-none whitespace-nowrap uppercase tracking-wide',
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
                <DropdownMenuContent align="end" className="min-w-[240px] rounded-xl border-border shadow-popover">
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
                  {isSistema && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-3 py-2">
                        <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{userRole}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Sair
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </nav>

        {/* Right actions (mobile only) */}
        <div className="flex items-center gap-2 shrink-0 lg:hidden">


          {/* Mobile trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden h-9 w-9 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-card">
              <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                <img src={tenantLogo.src} alt={tenantLogo.alt} className={tenantLogo.className} />
                <button onClick={() => setMobileOpen(false)} className="h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
                {sevenVisible.length > 0 && (
                  <Collapsible
                    open={mobileGroups.includes('Seven')}
                    onOpenChange={() => toggleMobileGroup('Seven')}
                  >
                    <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary text-sm font-medium text-foreground uppercase tracking-wide">
                      <span className="flex items-center gap-2.5">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        Seven
                      </span>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', mobileGroups.includes('Seven') && 'rotate-180')} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-3 py-1 space-y-2">
                      {sevenVisible.map((cat) => (
                        <div key={cat.label} className="space-y-0.5">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-3 pt-1">
                            {cat.label}
                          </p>
                          {cat.items.map((item) => {
                            const active = location.pathname === item.path;
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm',
                                  active
                                    ? 'bg-primary-soft text-primary font-medium'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                                )}
                              >
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
                {visibleGroups.map((group) => {
                  const isOpen = mobileGroups.includes(group.label);
                  return (
                    <Collapsible key={group.label} open={isOpen} onOpenChange={() => toggleMobileGroup(group.label)}>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary text-sm font-medium text-foreground uppercase tracking-wide">
                        <span className="flex items-center gap-2.5">
                          <group.icon className="h-4 w-4 text-muted-foreground" />
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
                              <item.icon className="h-4 w-4 text-muted-foreground" />
                              {item.label}
                            </Link>
                          );
                        })}
                        {group.label === 'Sistema' && (
                          <>
                            <div className="mt-2 pt-2 border-t border-border px-3">
                              <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                              <p className="text-xs text-muted-foreground truncate">{userRole}</p>
                            </div>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10"
                            >
                              <LogOut className="h-4 w-4" /> Sair
                            </button>
                          </>
                        )}
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
