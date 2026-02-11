import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, RotateCcw, Info, Shield, Search, Eye, Plus, Edit, Trash2, Check, HelpCircle, Globe, Building2, User } from 'lucide-react';
import { AppRole, ROLE_LABELS, ScopeType } from '@/types/auth.types';
import { 
  useModulesWithPermissions, 
  useResetUserPermissions,
  useSetUserModulePermission,
  useRemoveUserModulePermission,
  ModuleWithPermission
} from '@/hooks/useUserPermissions';

interface UserPermissionsTabProps {
  userId: string;
  userRole: AppRole | null;
}

// Category labels for grouping with icons
const CATEGORY_LABELS: Record<string, string> = {
  comercial: '🎯 Vendas e Relacionamento',
  contratos: '📄 Contratos e Documentos',
  empreendimentos: '🏗️ Empreendimentos',
  marketing: '📢 Marketing e Comunicação',
  administrativo: '⚙️ Administração',
  portal: '🌐 Portais Externos',
  financeiro: '💰 Financeiro',
  mercado: '🏢 Parceiros Comerciais',
  outros: '📁 Outros'
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  comercial: 'Módulos relacionados ao processo de vendas, negociações e atendimento ao cliente',
  contratos: 'Gestão de contratos, templates, parcelas e documentação',
  empreendimentos: 'Cadastro e configuração de empreendimentos e unidades',
  marketing: 'Projetos, campanhas, briefings e materiais de marketing',
  administrativo: 'Configurações do sistema, usuários e auditoria',
  portal: 'Acesso aos portais externos para corretores e clientes',
  financeiro: 'Comissões, fluxo de caixa, DRE e bonificações',
  mercado: 'Cadastro de corretores, imobiliárias e incorporadoras parceiras',
  outros: 'Outros módulos do sistema'
};

const CATEGORY_ORDER = ['comercial', 'contratos', 'empreendimentos', 'financeiro', 'marketing', 'mercado', 'administrativo', 'portal', 'outros'];

// Enhanced scope configuration with icons and explanations
const SCOPE_CONFIG: Record<ScopeType, {
  label: string;
  shortLabel: string;
  icon: typeof Globe;
  colorClass: string;
  description: string;
  example: string;
}> = {
  global: {
    label: 'Todos os Registros',
    shortLabel: 'Todos',
    icon: Globe,
    colorClass: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    description: 'Acesso a TODOS os registros do sistema',
    example: 'Vê dados de todos os corretores e empreendimentos'
  },
  empreendimento: {
    label: 'Por Empreendimento',
    shortLabel: 'Empreend.',
    icon: Building2,
    colorClass: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    description: 'Apenas dos empreendimentos vinculados',
    example: 'Gestor vê apenas dados dos seus empreendimentos'
  },
  proprio: {
    label: 'Apenas Próprios',
    shortLabel: 'Próprios',
    icon: User,
    colorClass: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
    description: 'Somente registros que criou',
    example: 'Corretor vê apenas suas próprias negociações'
  }
};

export function UserPermissionsTab({ userId, userRole }: UserPermissionsTabProps) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const { data: modules, isLoading } = useModulesWithPermissions(userId, userRole || undefined);
  const resetPermissions = useResetUserPermissions();
  const setPermission = useSetUserModulePermission();
  const removePermission = useRemoveUserModulePermission();
  
  const customCount = modules?.filter(m => m.effective_permission.is_custom).length || 0;

  // Group modules by category
  const groupedModules = useMemo(() => {
    if (!modules) return {};
    
    const filtered = search 
      ? modules.filter(m => m.display_name.toLowerCase().includes(search.toLowerCase()))
      : modules;
    
    const groups: Record<string, ModuleWithPermission[]> = {};
    
    filtered.forEach(module => {
      const category = (module as any).category || 'outros';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(module);
    });
    
    return groups;
  }, [modules, search]);

  // Sorted categories
  const sortedCategories = useMemo(() => {
    return CATEGORY_ORDER.filter(cat => groupedModules[cat]?.length > 0);
  }, [groupedModules]);

  const handleResetAll = () => {
    if (confirm('Isso removerá todas as permissões customizadas. O usuário usará apenas as permissões do perfil. Continuar?')) {
      resetPermissions.mutate(userId);
    }
  };

  const handleToggleFullAccess = (module: ModuleWithPermission) => {
    const hasFullAccess = module.effective_permission.can_view && 
                          module.effective_permission.can_create && 
                          module.effective_permission.can_edit && 
                          module.effective_permission.can_delete;

    if (hasFullAccess && module.effective_permission.is_custom) {
      // Remove custom permission
      removePermission.mutate({ userId, moduleId: module.id });
    } else {
      // Set full access
      setPermission.mutate({
        userId,
        moduleId: module.id,
        permissions: {
          can_view: true,
          can_create: true,
          can_edit: true,
          can_delete: true,
          scope: module.effective_permission.scope
        }
      });
    }
  };

  const handleToggleSinglePermission = (
    module: ModuleWithPermission, 
    field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    value: boolean
  ) => {
    setPermission.mutate({
      userId,
      moduleId: module.id,
      permissions: {
        can_view: field === 'can_view' ? value : module.effective_permission.can_view,
        can_create: field === 'can_create' ? value : module.effective_permission.can_create,
        can_edit: field === 'can_edit' ? value : module.effective_permission.can_edit,
        can_delete: field === 'can_delete' ? value : module.effective_permission.can_delete,
        scope: module.effective_permission.scope
      }
    });
  };

  const handleRevertToRole = (module: ModuleWithPermission) => {
    removePermission.mutate({ userId, moduleId: module.id });
  };

  const isPending = setPermission.isPending || removePermission.isPending || resetPermissions.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Info Banner */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">Perfil Base: </span>
            <Badge variant="outline">
              <Shield className="mr-1 h-3 w-3" />
              {userRole ? ROLE_LABELS[userRole] : 'Sem perfil'}
            </Badge>
            <span className="text-muted-foreground">
              Personalize abaixo para sobrescrever as permissões do perfil.
            </span>
          </AlertDescription>
        </Alert>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar módulo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {customCount > 0 && (
              <>
                <Badge variant="secondary">
                  {customCount} customizado{customCount !== 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAll}
                  disabled={isPending}
                >
                  {resetPermissions.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-4 w-4" />
                  )}
                  Restaurar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Modules by Category */}
        <ScrollArea className="h-[380px] pr-4">
          <Accordion 
            type="multiple" 
            value={expandedCategories}
            onValueChange={setExpandedCategories}
            className="space-y-2"
          >
            {sortedCategories.map((category) => {
              const categoryModules = groupedModules[category] || [];
              const customInCategory = categoryModules.filter(m => m.effective_permission.is_custom).length;
              
              return (
                <AccordionItem 
                  key={category} 
                  value={category}
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{CATEGORY_LABELS[category] || category}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">{CATEGORY_DESCRIPTIONS[category] || 'Módulos do sistema'}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Badge variant="outline" className="text-xs">
                        {categoryModules.length} módulo{categoryModules.length !== 1 ? 's' : ''}
                      </Badge>
                      {customInCategory > 0 && (
                        <Badge variant="default" className="text-xs">
                          {customInCategory} custom
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pb-2">
                      {categoryModules.map((module) => (
                        <ModuleRow 
                          key={module.id}
                          module={module}
                          isPending={isPending}
                          onToggleFullAccess={() => handleToggleFullAccess(module)}
                          onTogglePermission={(field, value) => handleToggleSinglePermission(module, field, value)}
                          onRevert={() => handleRevertToRole(module)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {sortedCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum módulo encontrado
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

interface ModuleRowProps {
  module: ModuleWithPermission;
  isPending: boolean;
  onToggleFullAccess: () => void;
  onTogglePermission: (field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete', value: boolean) => void;
  onRevert: () => void;
}

function ModuleRow({ module, isPending, onToggleFullAccess, onTogglePermission, onRevert }: ModuleRowProps) {
  const { effective_permission, role_permission } = module;
  const isCustom = effective_permission.is_custom;
  const moduleDescription = (module as any).description;
  const scopeConfig = SCOPE_CONFIG[effective_permission.scope as ScopeType] || SCOPE_CONFIG.proprio;
  const ScopeIcon = scopeConfig.icon;
  
  const hasFullAccess = effective_permission.can_view && 
                        effective_permission.can_create && 
                        effective_permission.can_edit && 
                        effective_permission.can_delete;

  // Check if current differs from role
  const differsFromRole = isCustom && role_permission && (
    effective_permission.can_view !== role_permission.can_view ||
    effective_permission.can_create !== role_permission.can_create ||
    effective_permission.can_edit !== role_permission.can_edit ||
    effective_permission.can_delete !== role_permission.can_delete
  );

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
      isCustom ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/30'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium text-sm truncate cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-2">
                  {module.display_name}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{moduleDescription || 'Módulo do sistema'}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Scope Badge with Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`text-xs shrink-0 cursor-help gap-1 ${scopeConfig.colorClass}`}
                >
                  <ScopeIcon className="h-3 w-3" />
                  {scopeConfig.shortLabel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{scopeConfig.label}</p>
                  <p className="text-xs text-muted-foreground">{scopeConfig.description}</p>
                  <p className="text-xs italic">{scopeConfig.example}</p>
                </div>
              </TooltipContent>
            </Tooltip>
            
            {isCustom && (
              <Badge variant="default" className="text-xs shrink-0">
                Custom
              </Badge>
            )}
          </div>
          
          {/* Role permission comparison */}
          {role_permission && differsFromRole && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Perfil: {[
                role_permission.can_view && 'Ver',
                role_permission.can_create && 'Criar',
                role_permission.can_edit && 'Editar',
                role_permission.can_delete && 'Excluir',
              ].filter(Boolean).join(', ') || 'Sem acesso'}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Permission toggles */}
        <div className="flex items-center gap-1 border rounded-md p-1 bg-background">
          <Button
            variant={effective_permission.can_view ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => onTogglePermission('can_view', !effective_permission.can_view)}
            disabled={isPending}
            title="Ver"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={effective_permission.can_create ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => onTogglePermission('can_create', !effective_permission.can_create)}
            disabled={isPending}
            title="Criar"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={effective_permission.can_edit ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => onTogglePermission('can_edit', !effective_permission.can_edit)}
            disabled={isPending}
            title="Editar"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={effective_permission.can_delete ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => onTogglePermission('can_delete', !effective_permission.can_delete)}
            disabled={isPending}
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Full access toggle */}
        <Button
          variant={hasFullAccess ? 'default' : 'outline'}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onToggleFullAccess}
          disabled={isPending}
          title="Acesso total"
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Total
        </Button>

        {/* Revert button */}
        {isCustom && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRevert}
            disabled={isPending}
            title="Usar permissão do perfil"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
