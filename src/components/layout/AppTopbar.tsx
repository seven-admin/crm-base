import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2, Users, Map, Settings, LogOut, Menu, FileText,
  UserCog, Shield, ChevronDown, Target, CalendarDays, CalendarRange,
  Home, Handshake, User as UserIcon, ExternalLink, PhoneCall,
  Kanban, LayoutDashboard, Landmark, KeyRound, LayoutTemplate, Blocks, Variable,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TopMegaMenu, type MegaMenuCategory } from './TopMegaMenu';
import logoSeven from '@/assets/logo-sevengroup.png';
import logoArqo from '@/assets/logo-arqo.png';
import logoNexa from '@/assets/logo-nexa.png';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  moduleName?: string;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  description?: string;
}

interface MenuCategory {
  label: string;
  items: MenuItem[];
}

interface TopMenu {
  label: string;
  icon: LucideIcon;
  group: 'seven' | 'arqo' | 'nexa';
  categories: MenuCategory[];
}

// Os três menus de topo compartilham o mesmo formato (categorias + ícone + rótulo +
// descrição), a mesma iconografia por conceito e a mesma ação (TopMegaMenu).
const topMenus: TopMenu[] = [
  {
    label: 'Seven', icon: Home, group: 'seven',
    categories: [
      {
        label: 'Portfólio',
        items: [
          { icon: Building2, label: 'Empreendimentos', path: '/empreendimentos', moduleName: 'empreendimentos', description: 'Projetos e obras' },
          { icon: Map, label: 'Mapa', path: '/mapa-unidades', moduleName: 'unidades', description: 'Mapa de unidades' },
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
      {
        label: 'Calendários',
        items: [
          { icon: CalendarRange, label: 'Calendário geral', path: '/calendarios', superAdminOnly: true, description: 'Agenda Arqo + Nexa por usuário' },
        ],
      },
    ],
  },
  {
    label: 'Arqo', icon: Target, group: 'arqo',
    categories: [
      {
        label: 'Operação',
        items: [
          { icon: PhoneCall, label: 'Atendimento', path: '/arqo/roleta', moduleName: 'arqo_roleta', description: 'Roleta e registro de atendimento' },
          { icon: Kanban, label: 'Kanban de Leads', path: '/arqo/leads', moduleName: 'arqo_leads', description: 'Funil de oportunidades' },
        ],
      },
      {
        label: 'Agenda',
        items: [
          { icon: CalendarDays, label: 'Atividades', path: '/arqo/atividades', moduleName: 'arqo_atividades', description: 'Agendamentos e contatos' },
          { icon: CalendarRange, label: 'Calendário', path: '/arqo/calendario', moduleName: 'arqo_atividades', description: 'Agenda em calendário' },
        ],
      },
      {
        label: 'Gestão',
        items: [
          { icon: LayoutDashboard, label: 'Gestão', path: '/arqo/admin', moduleName: 'arqo_admin', description: 'Filas, equipes e métricas' },
          { icon: Settings, label: 'Configurações', path: '/arqo/config', moduleName: 'arqo_config', description: 'Etapas, grupos e regras' },
        ],
      },
    ],
  },
  {
    label: 'Nexa', icon: Landmark, group: 'nexa',
    categories: [
      {
        label: 'Agenda',
        items: [
          { icon: CalendarDays, label: 'Atividades', path: '/nexa/agenda', moduleName: 'nexa_agenda', description: 'Registro de atividades' },
          { icon: CalendarRange, label: 'Calendário', path: '/nexa/calendario', moduleName: 'nexa_agenda', description: 'Agenda em calendário' },
        ],
      },
      {
        label: 'Comercial',
        items: [
          { icon: Target, label: 'Metas', path: '/nexa/metas', moduleName: 'nexa_metas', description: 'Metas e desempenho' },
          { icon: Map, label: 'Disponibilidade', path: '/nexa/disponibilidade', moduleName: 'nexa_disponibilidade', description: 'Unidades disponíveis' },
          { icon: KeyRound, label: 'Acesso a Propostas', path: '/nexa/propostas-acesso', moduleName: 'nexa_propostas_acesso', description: 'Liberar acesso às propostas' },
          { icon: ExternalLink, label: 'Render Vithória', path: '/nexa/render-vithoria', moduleName: '__nexa_only__', description: 'Tour virtual 3D' },
        ],
      },
      {
        label: 'Contratos',
        items: [
          { icon: FileText, label: 'Contratos', path: '/nexa/contratos', moduleName: 'nexa_contratos', description: 'Contratos gerados' },
          { icon: LayoutTemplate, label: 'Modelos', path: '/nexa/contratos/modelos', moduleName: 'nexa_contratos_modelos', description: 'Modelos de contrato' },
          { icon: Blocks, label: 'Blocos de Texto', path: '/nexa/contratos/blocos', moduleName: 'nexa_contratos_blocos', description: 'Cláusulas reutilizáveis' },
          { icon: Variable, label: 'Variáveis', path: '/nexa/contratos/variaveis', moduleName: 'nexa_contratos_variaveis', description: 'Variáveis de contrato' },
        ],
      },
    ],
  },
];

// "Sistema" fica separado: some no menu de conta (desktop) e num grupo próprio (mobile).
const sistemaItems: MenuItem[] = [
  { icon: UserIcon, label: 'Meu Perfil', path: '/meu-perfil', moduleName: '__self__', description: 'Seus dados' },
  { icon: Shield, label: 'Perfis de Acesso', path: '/usuarios?tab=perfis', moduleName: 'usuarios', adminOnly: true, description: 'Papéis e permissões' },
  { icon: Shield, label: 'Auditoria', path: '/auditoria', moduleName: 'auditoria', adminOnly: true, description: 'Registro de alterações' },
  { icon: UserCog, label: 'Usuários', path: '/usuarios', moduleName: 'usuarios', adminOnly: true, description: 'Gerenciar contas' },
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
  const { canAccessModule, isAdmin, isSuperAdmin } = usePermissions();
  const { isExterno, empresa, canAccessGroup } = useEmpresaAccess();
  const tenantLogo = empresa === 'arqo'
    ? { src: logoArqo, alt: 'Arqo', className: 'h-6' }
    : empresa === 'nexa'
    ? { src: logoNexa, alt: 'Nexa', className: 'h-6' }
    : { src: logoSeven, alt: 'SevenGroup', className: 'h-5' };

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroups, setMobileGroups] = useState<string[]>([]);

  const canSeeLeaf = (item: MenuItem) => {
    if (item.moduleName === '__self__') return true;
    // Não depende de módulo cadastrado (ex: iframe "Render Vithória"), mas só deve
    // aparecer para quem tem vínculo com o grupo Nexa/Seven.
    if (item.moduleName === '__nexa_only__') return isAdmin() || canAccessGroup('nexa');
    if (item.superAdminOnly) return isSuperAdmin();
    if (item.adminOnly) return isAdmin();
    return canAccessModule(item.moduleName ?? '');
  };

  const filterCategories = (categories: MenuCategory[]): MenuCategory[] =>
    categories
      .map((c) => ({ ...c, items: c.items.filter(canSeeLeaf) }))
      .filter((c) => c.items.length > 0);

  // Menus de topo visíveis (Seven/Arqo/Nexa): só o grupo ao qual o usuário pertence
  // (Seven vê todos; admin também) e, dentro dele, apenas os itens permitidos.
  const visibleTopMenus = topMenus
    .filter((m) => isAdmin() || canAccessGroup(m.group))
    .map((m) => {
      const categories = filterCategories(m.categories);
      const hasActive = categories.some((c) =>
        c.items.some((i) => isPathActive(i, location.pathname, location.search)),
      );
      return { ...m, categories, hasActive };
    })
    .filter((m) => m.categories.length > 0);

  const sistemaVisible = isExterno ? [] : sistemaItems.filter(canSeeLeaf);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const userName = profile?.full_name || 'Usuário';
  const userRole = role ? ROLE_LABELS[role] : '';
  const userInitials = userName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

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

        {/* Desktop nav (right aligned) — três mega-menus padronizados */}
        <nav className="ml-auto hidden items-center gap-1 overflow-x-auto lg:flex" aria-label="Navegação principal">
          {visibleTopMenus.map((menu) => (
            <TopMegaMenu
              key={menu.label}
              label={menu.label}
              categories={menu.categories as MegaMenuCategory[]}
              hasActive={menu.hasActive}
              dark
            />
          ))}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[.05] px-2 pr-3 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7417]/60 lg:flex" aria-label="Abrir menu do usuário">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url || undefined} alt={`Foto de ${userName}`} />
                <AvatarFallback className="bg-[#ff7417] text-xs font-bold text-[#21150d]">{userInitials}</AvatarFallback>
              </Avatar>
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
                {/* Seven / Arqo / Nexa — mesmo formato (categorias) no mobile */}
                {visibleTopMenus.map((menu) => {
                  const isOpen = mobileGroups.includes(menu.label);
                  return (
                    <Collapsible key={menu.label} open={isOpen} onOpenChange={() => toggleMobileGroup(menu.label)}>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary text-sm font-medium text-foreground uppercase tracking-wide">
                        <span className="flex items-center gap-2.5">
                          <menu.icon className="h-4 w-4 text-muted-foreground" />
                          {menu.label}
                        </span>
                        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-3 py-1 space-y-2">
                        {menu.categories.map((cat) => (
                          <div key={cat.label} className="space-y-0.5">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-3 pt-1">
                              {cat.label}
                            </p>
                            {cat.items.map((item) => {
                              const active = isPathActive(item, location.pathname, location.search);
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
                  );
                })}

                {/* Sistema */}
                {sistemaVisible.length > 0 && (
                  <Collapsible open={mobileGroups.includes('Sistema')} onOpenChange={() => toggleMobileGroup('Sistema')}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary text-sm font-medium text-foreground uppercase tracking-wide">
                      <span className="flex items-center gap-2.5">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Sistema
                      </span>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', mobileGroups.includes('Sistema') && 'rotate-180')} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-3 py-1 space-y-0.5">
                      {sistemaVisible.map((item) => {
                        const active = isPathActive(item, location.pathname, location.search);
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
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
