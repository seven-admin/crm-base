import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface MegaMenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  description?: string;
}

export interface MegaMenuCategory {
  label: string;
  items: MegaMenuItem[];
}

interface TopMegaMenuProps {
  label: string;
  categories: MegaMenuCategory[];
  hasActive: boolean;
  dark?: boolean;
}

// Menu de topo padrão (Seven, Arqo, Nexa): mesmo formato (categorias + ícone +
// rótulo + descrição), mesma iconografia e a mesma ação (Popover).
export function TopMegaMenu({ label, categories, hasActive, dark = false }: TopMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const visible = categories.filter((c) => c.items.length > 0);
  if (visible.length === 0) return null;

  const cols = visible.length >= 3 ? 'grid-cols-3' : visible.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors outline-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring/40',
            dark
              ? hasActive
                ? 'bg-white/10 text-white'
                : 'text-white/55 hover:bg-white/[.07] hover:text-white'
              : hasActive
                ? 'bg-primary-soft text-primary-soft-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <span className="flex items-center gap-1.5">
            {label}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[640px] max-w-[calc(100vw-2rem)] rounded-2xl p-4">
        <div className={cn('grid gap-4', cols)}>
          {visible.map((cat) => (
            <div key={cat.label} className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-2 pb-1">
                {cat.label}
              </p>
              {cat.items.map((item) => {
                const active = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-start gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors',
                      active
                        ? 'bg-primary-soft text-primary font-medium'
                        : 'text-foreground hover:bg-secondary',
                    )}
                  >
                    <item.icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="flex flex-col min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
