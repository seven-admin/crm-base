import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Map,
  Settings,
  ChevronDown,
  LogOut,
  Menu,
  X,
  UserCog,
  Building,
  UserCheck,
  TrendingUp,
  Handshake,
  Kanban,
  ClipboardList,
  FileSignature,
  DollarSign,
  GitBranch,
  Calculator,
  Shield,
  Palette,
  CalendarDays,
  Gift,
  Wallet,
  User,
  Target,
  FileCheck,
  FilePlus,
  Variable,
  ClipboardCheck,
  BarChart2,
  Calendar,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS } from '@/types/auth.types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import logo from '@/assets/logo.png';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  moduleName: string;
  adminOnly?: boolean;
}

interface MenuGroup {
  label: string | null;
  icon?: LucideIcon;
  items: MenuItem[];
  color?: string;
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Planejamento',
    icon: ClipboardList,
    color: '#10B981',
    items: [
      { icon: ClipboardList, label: 'Cronograma', path: '/planejamento', moduleName: 'planejamento' },
      { icon: Settings, label: 'Configurações', path: '/planejamento/configuracoes', moduleName: 'planejamento_config', adminOnly: true },
    ],
  },
  {
    label: 'Empreendimentos',
    icon: Building2,
    color: '#10B981',
    items: [
      { icon: Building2, label: 'Listagem', path: '/empreendimentos', moduleName: 'empreendimentos' },
      { icon: Map, label: 'Mapa de Unidades', path: '/mapa-unidades', moduleName: 'unidades' },
    ],
  },
  {
    label: 'Clientes',
    icon: Users,
    color: '#8B5CF6',
    items: [
      { icon: Users, label: 'Cadastro de Clientes', path: '/clientes', moduleName: 'clientes' },
    ],
  },
  {
    label: 'Forecast',
    icon: TrendingUp,
    color: '#06B6D4',
    items: [
      { icon: BarChart2, label: 'Dashboard', path: '/forecast', moduleName: 'forecast' },
      { icon: ClipboardList, label: 'Atividades', path: '/atividades', moduleName: 'atividades' },
      { icon: Target, label: 'Metas Comerciais', path: '/metas-comerciais', moduleName: 'forecast' },
    ],
  },
  {
    label: 'Comercial',
    icon: Target,
    color: '#F5941E',
    items: [
      { icon: Kanban, label: 'Fichas de Proposta', path: '/negociacoes', moduleName: 'negociacoes' },
      { icon: ClipboardCheck, label: 'Solicitações', path: '/solicitacoes', moduleName: 'solicitacoes', adminOnly: true },
    ],
  },
  {
    label: 'Contratos',
    icon: FileSignature,
    color: '#60A5FA',
    items: [
      { icon: FileCheck, label: 'Gestão de Contratos', path: '/contratos', moduleName: 'contratos' },
      { icon: FilePlus, label: 'Templates', path: '/contratos?tab=templates', moduleName: 'contratos_templates' },
      { icon: Variable, label: 'Variáveis', path: '/contratos?tab=variaveis', moduleName: 'contratos_variaveis' },
      { icon: ClipboardCheck, label: 'Tipos de Parcela', path: '/tipos-parcela', moduleName: 'contratos_tipos_parcela' },
    ],
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    color: '#F59E0B',
    items: [
      { icon: Wallet, label: 'Fluxo de Caixa', path: '/financeiro', moduleName: 'financeiro_fluxo' },
      { icon: BarChart2, label: 'DRE', path: '/dre', moduleName: 'financeiro_dre' },
      { icon: DollarSign, label: 'Comissões', path: '/comissoes', moduleName: 'comissoes' },
      { icon: Gift, label: 'Bonificações', path: '/bonificacoes', moduleName: 'bonificacoes' },
    ],
  },
  {
    label: 'Parceiros',
    icon: Handshake,
    color: '#EC4899',
    items: [
      { icon: Building2, label: 'Incorporadoras', path: '/incorporadoras', moduleName: 'incorporadoras' },
      { icon: Building, label: 'Imobiliárias', path: '/imobiliarias', moduleName: 'imobiliarias' },
      { icon: UserCheck, label: 'Corretores', path: '/corretores', moduleName: 'corretores' },
    ],
  },
  {
    label: 'Marketing',
    icon: Palette,
    color: '#EC4899',
    items: [
      { icon: BarChart2, label: 'Dashboard', path: '/marketing/dashboard', moduleName: 'projetos_marketing' },
      { icon: Palette, label: 'Atividades', path: '/marketing', moduleName: 'projetos_marketing' },
      { icon: Users, label: 'Equipe de Criação', path: '/marketing/equipe', moduleName: 'projetos_marketing' },
      { icon: Calendar, label: 'Calendário', path: '/marketing/calendario', moduleName: 'projetos_marketing' },
      { icon: Kanban, label: 'Etapas de Atividades', path: '/marketing/etapas', moduleName: 'projetos_marketing_config', adminOnly: true },
    ],
  },
  {
    label: 'Eventos',
    icon: CalendarDays,
    color: '#06B6D4',
    items: [
      { icon: CalendarDays, label: 'Listagem', path: '/eventos', moduleName: 'eventos' },
      { icon: Calendar, label: 'Calendário', path: '/eventos/calendario', moduleName: 'eventos' },
      { icon: ClipboardList, label: 'Templates', path: '/eventos/templates', moduleName: 'eventos_templates', adminOnly: true },
    ],
  },
  {
    label: 'Sistema',
    icon: Settings,
    color: '#94A3B8',
    items: [
      { icon: Shield, label: 'Auditoria', path: '/auditoria', moduleName: 'auditoria', adminOnly: true },
      { icon: UserCog, label: 'Usuários', path: '/usuarios', moduleName: 'usuarios', adminOnly: true },
      { icon: GitBranch, label: 'Configurar Negociações', path: '/configuracoes/negociacoes', moduleName: 'negociacoes_config' },
      { icon: Settings, label: 'Configurações', path: '/configuracoes', moduleName: 'configuracoes' },
    ],
  },
];

const STORAGE_KEY = 'sidebar-open-groups';

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const { canAccessModule, isAdmin, isSuperAdmin } = usePermissions();

  // Load saved open groups from localStorage
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save open groups to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  // Auto-expand group containing active route
  useEffect(() => {
    menuGroups.forEach((group) => {
      if (group.label && group.items.some((item) => item.path === location.pathname)) {
        if (!openGroups.includes(group.label)) {
          setOpenGroups((prev) => [...prev, group.label as string]);
        }
      }
    });
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const filterItems = useCallback((items: MenuItem[]) =>
    items.filter((item) => {
      if (item.path === '/marketing/etapas') return isSuperAdmin();
      if (item.adminOnly) return isAdmin();
      return canAccessModule(item.moduleName);
    }), [isSuperAdmin, isAdmin, canAccessModule]);

  const visibleGroups = useMemo(() => menuGroups
    .map((group) => ({
      ...group,
      items: filterItems(group.items),
    }))
    .filter((group) => group.items.length > 0), [filterItems]);

  const userName = profile?.full_name || 'Usuário';
  const userRole = role ? ROLE_LABELS[role] : 'Carregando...';

  const renderMenuItem = (item: MenuItem, showLabel: boolean, groupColor?: string) => {
    const [basePath, queryString] = item.path.split('?');
    const isActive = queryString 
      ? location.pathname === basePath && location.search === `?${queryString}`
      : location.pathname === item.path && !location.search;
    
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'sidebar-nav-item',
          isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
        )}
        title={!showLabel ? item.label : undefined}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" style={groupColor ? { color: groupColor } : undefined} />
        {showLabel && <span>{item.label}</span>}
      </Link>
    );
  };

  const renderGroup = (group: MenuGroup) => {
    if (!group.label) {
      return group.items.map((item) => renderMenuItem(item, true));
    }

    const isOpen = openGroups.includes(group.label);
    const hasActiveItem = group.items.some((item) => item.path === location.pathname);
    const GroupIcon = group.icon;

    return (
      <Collapsible 
        key={group.label} 
        open={isOpen} 
        onOpenChange={() => toggleGroup(group.label)}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'sidebar-nav-item w-full justify-between',
              hasActiveItem ? 'text-sidebar-foreground font-semibold' : 'sidebar-nav-item-inactive'
            )}
          >
            <div className="flex items-center gap-3">
              {GroupIcon && <GroupIcon className="h-4 w-4 flex-shrink-0" style={{ color: group.color }} />}
              <span>{group.label}</span>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200 text-sidebar-foreground/50',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-0.5 mt-1 overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          {group.items.map((item) => renderMenuItem(item, true, group.color))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
        <img src={logo} alt="Seven Group" className="h-6 object-contain brightness-0 invert opacity-90" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {mobileOpen ? (
            <X className="h-5 w-5 text-sidebar-foreground" />
          ) : (
            <Menu className="h-5 w-5 text-sidebar-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col',
          'hidden lg:flex lg:w-64',
          mobileOpen && 'flex w-64 top-14'
        )}
        style={mobileOpen ? { height: 'calc(100vh - 3.5rem)' } : undefined}
      >
        {/* Logo - Desktop only */}
        <div className="hidden lg:flex items-center justify-center h-16 px-4 border-b border-sidebar-border">
          <img src={logo} alt="Seven Group" className="h-8 object-contain brightness-0 invert opacity-90" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {visibleGroups.map((group, index) => (
            <div key={group.label || `group-${index}`}>
              {renderGroup(group)}
            </div>
          ))}
        </nav>

        {/* User Profile with Dropdown */}
        <div className="p-3 border-t border-sidebar-border" ref={userDropdownRef}>
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-all w-full text-left',
                userDropdownOpen && 'bg-sidebar-accent'
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-sidebar-foreground flex items-center justify-center text-sidebar text-sm font-semibold flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userName}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{userRole}</p>
              </div>
              <ChevronDown className={cn(
                'h-4 w-4 text-sidebar-foreground/50 transition-transform',
                userDropdownOpen && 'rotate-180'
              )} />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute bottom-full mb-2 bg-popover border border-border rounded-xl shadow-xl p-1 min-w-[180px] animate-fade-in left-0 right-0">
                <Link
                  to="/configuracoes?tab=perfil"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setMobileOpen(false);
                  }}
                  className="user-dropdown-item"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Meu Perfil</span>
                </Link>
                <div className="h-px bg-border my-1" />
                <button
                  onClick={handleLogout}
                  className="user-dropdown-item w-full text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}