import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2, Users, Map, Settings, LogOut, Menu, FileText,
  UserCog, Shield, ChevronDown, Target, Kanban, GitBranch, TrendingUp, CalendarDays,
  Home, Handshake, User as UserIcon, ExternalLink,
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
      { icon: CalendarDays, label: 'Atividades', path: '/arqo/atividades', moduleName: 'arqo_atividades' },
      { icon: TrendingUp, label: 'Forecast', path: '/arqo/forecast', moduleName: 'arqo_forecast' },
      { icon: Shield, label: 'Admin', path: '/arqo/admin', moduleName: 'arqo_admin' },
      { icon: Settings, label: 'Configurações', path: '/arqo/config', moduleName: 'arqo_config' },
    ],
  },
  {
    label: 'Nexa', icon: CalendarDays,
    items: [
      { icon: CalendarDays, label: 'Atividades', path: '/nexa/agenda', moduleName: 'nexa_agenda' },
      { icon: Map, label: 'Disponibilidade', path: '/nexa/disponibilidade', moduleName: 'nexa_disponibilidade' },
      { icon: FileText, label: 'Contratos', path: '/nexa/contratos', moduleName: 'nexa_contratos' },
      { icon: FileText, label: 'Modelos de Contrato', path: '/nexa/contratos/modelos', moduleName: 'nexa_contratos_modelos' },
      { icon: FileText, label: 'Blocos de Texto', path: '/nexa/contratos/blocos', moduleName: 'nexa_contratos_blocos' },
      { icon: Settings, label: 'Variáveis de Contrato', path: '/nexa/contratos/variaveis', moduleName: 'nexa_contratos_variaveis' },
      { icon: ExternalLink, label: 'Render Vithória', path: '/nexa/render-vithoria', moduleName: '__nexa_only__' },
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
  const { isExterno, empresa, canAccessGroup } = useEmpresaAccess();
  const tenantLogo = empresa === 'arqo'
    ? { src: logoArqo, alt: 'Arqo', className: 'h-6' }
    : empresa === 'nexa'
    ? { src: logoNexa, alt: 'Nexa', className: 'h-6' }
    : { src: logoSeven, alt: 'SevenGroup', className: 'h-5' };
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroups, setMobileGroups] = useState<string[]>([]);

  const filterItems = (items: MenuItem[]) =>
    items.filter((item) => {
      if (item.moduleName === '__self__') return true;
      // Não depende de módulo cadastrado (ex: iframe "Render Vithória"), mas só
      // deve aparecer para quem realmente tem vínculo com o grupo Nexa/Seven —
      // '__self__' era universal demais e vazava pra usuários Arqo.
      if (item.moduleName === '__nexa_only__') return isAdmin() || canAccessGroup('nexa');
      if (item.adminOnly) return isAdmin();
      return canAccessModule(item.moduleName);
    });


  // Visibilidade baseada em permissões efetivas (canAccessModule).
  // O vínculo de empresa (empresa) define apenas o default de permissões via role,
  // mas permissões customizadas em outros grupos passam a exibir o menu correspondente.
  const visibleGroups = menuGroups
    .map((g) => ({ ...g, items: filterItems(g.items) }))
    .filter((g) => g.items.length > 0)
    .filter((g) => {
      // "Sistema" continua bloqueado para vínculos externos (sem sistema algum).
      if (g.label === 'Sistema') return !isExterno;
      return true;
    });

  const sevenVisible: SevenMenuCategory[] = sevenCategories
    .map((c) => ({ ...c, items: filterItems(c.items) }))
    .filter((c) => c.items.length > 0);
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
    <header className="sticky top-0 z-40 w-full border-b border-white/[.06] bg-[#171411]/95 text-white shadow-topbar backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-4 px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center rounded-full bg-[#f7f3ed] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7417]/60" aria-label="Ir para a página inicial">
          <img src={tenantLogo.src} alt={tenantLogo.alt} className={tenantLogo.className} />
        </Link>

        {/* Desktop nav (right aligned) */}
        <nav className="ml-auto hidden items-center gap-1 overflow-x-auto lg:flex" aria-label="Navegação principal">
          <SevenMegaMenu categories={sevenVisible} hasActive={sevenHasActive} dark />
          {visibleGroups.filter((group) => group.label !== 'Sistema').map((group) => {
            const hasActive = group.items.some((i) => isPathActive(i, location.pathname, location.search));
            return (
              <DropdownMenu key={group.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      'inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors outline-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring/40',
                      hasActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/[.07] hover:text-white'
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {group.label}
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[240px]">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[.05] px-2 pr-3 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7417]/60 lg:flex" aria-label="Abrir menu do usuário">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff7417] text-xs font-bold text-[#21150d]">
                {userName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
              </span>
              <span className="min-w-0 max-w-36">
                <span className="block truncate text-xs font-semibold text-white">{userName}</span>
                <span className="block truncate text-[10px] text-white/40">{userRole}</span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-white/40" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/meu-perfil"><UserIcon className="mr-2 h-4 w-4" />Meu perfil</Link></DropdownMenuItem>
            {isAdmin() && <DropdownMenuItem asChild><Link to="/usuarios"><UserCog className="mr-2 h-4 w-4" />Usuários</Link></DropdownMenuItem>}
            {isAdmin() && <DropdownMenuItem asChild><Link to="/configuracoes"><Settings className="mr-2 h-4 w-4" />Configurações</Link></DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right actions (mobile only) */}
        <div className="flex items-center gap-2 shrink-0 lg:hidden">


          {/* Mobile trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white lg:hidden" aria-label="Abrir menu de navegação">
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-card">
              <div className="flex h-16 items-center border-b border-border px-4 pr-16">
                <img src={tenantLogo.src} alt={tenantLogo.alt} className={tenantLogo.className} />
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
