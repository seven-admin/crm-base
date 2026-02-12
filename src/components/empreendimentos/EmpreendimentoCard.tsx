import { MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { EmpreendimentoWithStats } from '@/types/empreendimentos.types';
import { EMPREENDIMENTO_STATUS_LABELS, EMPREENDIMENTO_STATUS_COLORS } from '@/types/empreendimentos.types';
import { useToggleAutoVincularCorretor } from '@/hooks/useEmpreendimentos';
import { usePermissions } from '@/hooks/usePermissions';

interface EmpreendimentoCardProps {
  empreendimento: EmpreendimentoWithStats;
}

export function EmpreendimentoCard({ empreendimento }: EmpreendimentoCardProps) {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const toggleAutoVincular = useToggleAutoVincularCorretor();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);

  const totalUnidades = 
    empreendimento.unidades_disponiveis + 
    empreendimento.unidades_reservadas + 
    empreendimento.unidades_negociacao +
    empreendimento.unidades_vendidas + 
    empreendimento.unidades_bloqueadas;

  const percentualVendido = totalUnidades > 0
    ? (empreendimento.unidades_vendidas / totalUnidades) * 100
    : 0;

  const valorMedio = totalUnidades > 0 
    ? empreendimento.valor_total / totalUnidades 
    : 0;

  return (
    <div className="card-elevated overflow-hidden hover:shadow-elevated transition-shadow duration-300 animate-fade-in">
      {/* Dark gradient top section with wave pattern */}
      <div 
        className="relative h-32 overflow-hidden"
        style={{
          backgroundColor: 'hsl(220 16% 12%)',
          ...(empreendimento.capa_url ? {
            backgroundImage: `linear-gradient(to bottom, hsla(220, 16%, 12%, 0.85), hsla(220, 16%, 12%, 0.95)), url(${empreendimento.capa_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {})
        }}
      >
        {/* Wave Pattern SVG */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            className="text-slate-600"
            d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,149.3C960,139,1056,149,1152,165.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <path
            fill="currentColor"
            className="text-slate-700"
            d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,229.3C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg leading-tight truncate">
                {empreendimento.nome}
              </h3>
              {empreendimento.endereco_cidade && (
                <div className="flex items-center gap-1 text-sm text-slate-300 mt-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {empreendimento.endereco_cidade}
                    {empreendimento.endereco_uf && `, ${empreendimento.endereco_uf}`}
                  </span>
                </div>
              )}
            </div>
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ml-2',
                EMPREENDIMENTO_STATUS_COLORS[empreendimento.status]
              )}
            >
              {EMPREENDIMENTO_STATUS_LABELS[empreendimento.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-emerald-500/10 rounded-lg">
            <p className="text-lg font-semibold text-emerald-500">
              {empreendimento.unidades_disponiveis}
            </p>
            <p className="text-[11px] text-muted-foreground">Disponíveis</p>
          </div>
          <div className="text-center p-2 bg-amber-500/10 rounded-lg">
            <p className="text-lg font-semibold text-amber-500">
              {empreendimento.unidades_reservadas}
            </p>
            <p className="text-[11px] text-muted-foreground">Reservadas</p>
          </div>
          <div className="text-center p-2 bg-blue-500/10 rounded-lg">
            <p className="text-lg font-semibold text-blue-500">
              {empreendimento.unidades_negociacao}
            </p>
            <p className="text-[11px] text-muted-foreground">Negociação</p>
          </div>
          <div className="text-center p-2 bg-rose-500/10 rounded-lg">
            <p className="text-lg font-semibold text-rose-500">
              {empreendimento.unidades_vendidas}
            </p>
            <p className="text-[11px] text-muted-foreground">Vendidas</p>
          </div>
          <div className="text-center p-2 bg-gray-500/10 rounded-lg">
            <p className="text-lg font-semibold text-gray-500">
              {empreendimento.unidades_bloqueadas}
            </p>
            <p className="text-[11px] text-muted-foreground">Bloqueadas</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-semibold text-foreground">
              {totalUnidades}
            </p>
            <p className="text-[11px] text-muted-foreground">Total</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vendas</span>
            <span className="font-medium text-foreground">
              {percentualVendido.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${percentualVendido}%` }}
            />
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center justify-between py-2 mb-3 border-t border-border">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-help">
                    <Users className="h-4 w-4" />
                    <span>Auto-vincular corretores</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vincular automaticamente este empreendimento<br />a novos corretores ao serem ativados</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Switch
              checked={empreendimento.auto_vincular_corretor}
              onCheckedChange={(checked) =>
                toggleAutoVincular.mutate({
                  id: empreendimento.id,
                  auto_vincular_corretor: checked,
                })
              }
              disabled={toggleAutoVincular.isPending}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Valor médio</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(valorMedio)}
            </p>
          </div>
          <Button size="sm" onClick={() => navigate(`/empreendimentos/${empreendimento.id}`)}>
            Ver detalhes
          </Button>
        </div>
      </div>
    </div>
  );
}
