import { DEFAULT_SIDEBAR_COLORS, LABEL_TO_CHAVE } from '@/hooks/useSidebarColors';
import {
  ClipboardList, Building2, Users, Target, BookOpen,
  FileSignature, DollarSign, Handshake, Palette, CalendarDays, Settings,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const GROUP_ICONS: Record<string, LucideIcon> = {
  'Planejamento': ClipboardList,
  'Empreendimentos': Building2,
  'Clientes': Users,
  'Comercial': Target,
  'Diário de Bordo': BookOpen,
  'Contratos': FileSignature,
  'Financeiro': DollarSign,
  'Parceiros': Handshake,
  'Marketing': Palette,
  'Eventos': CalendarDays,
  'Sistema': Settings,
};

const GROUP_ORDER = [
  'Planejamento', 'Empreendimentos', 'Clientes', 'Comercial', 'Diário de Bordo',
  'Contratos', 'Financeiro', 'Parceiros', 'Marketing', 'Eventos', 'Sistema',
];

interface SidebarColorsConfigProps {
  colors: Record<string, string>;
  onChange: (label: string, color: string) => void;
}

export function SidebarColorsConfig({ colors, onChange }: SidebarColorsConfigProps) {
  const handleRestoreDefaults = () => {
    for (const label of GROUP_ORDER) {
      onChange(label, DEFAULT_SIDEBAR_COLORS[label]);
    }
  };

  return (
    <div className="border-t border-border pt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-medium text-foreground">
          Cores do Menu Lateral
        </h4>
        <Button variant="outline" size="sm" onClick={handleRestoreDefaults}>
          Restaurar Padrão
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Personalize a cor dos ícones de cada grupo do menu lateral.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GROUP_ORDER.map((label) => {
          const Icon = GROUP_ICONS[label];
          const color = colors[label] || DEFAULT_SIDEBAR_COLORS[label];
          return (
            <div key={label} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              {Icon && <Icon className="h-5 w-5 flex-shrink-0" style={{ color }} />}
              <Label className="flex-1 text-sm font-medium cursor-default">{label}</Label>
              <input
                type="color"
                value={color}
                onChange={(e) => onChange(label, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-border"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
