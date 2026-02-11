import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Loader2, Eye } from 'lucide-react';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useUserImobiliaria } from '@/hooks/useUserImobiliaria';
import { supabase } from '@/integrations/supabase/client';

import { EMPREENDIMENTO_STATUS_LABELS, EMPREENDIMENTO_TIPO_LABELS } from '@/types/empreendimentos.types';

export default function PortalEmpreendimentos() {
  const navigate = useNavigate();
  const { data: empreendimentos, isLoading: loadingEmps } = useEmpreendimentos();
  const { imobiliariaId, isGestorImobiliaria, isLoading: isLoadingImob } = useUserImobiliaria();

  // Buscar vínculos da imobiliária com empreendimentos
  const { data: vinculosIds, isLoading: loadingVinculos } = useQuery({
    queryKey: ['empreendimento-imobiliarias', imobiliariaId],
    queryFn: async () => {
      if (!imobiliariaId) return [];
      const { data, error } = await supabase
        .from('empreendimento_imobiliarias')
        .select('empreendimento_id')
        .eq('imobiliaria_id', imobiliariaId);
      if (error) {
        console.error('Erro ao buscar vínculos:', error);
        return [];
      }
      return data.map(v => v.empreendimento_id);
    },
    enabled: !!imobiliariaId && isGestorImobiliaria,
    staleTime: 5 * 60 * 1000,
  });

  const empreendimentosFiltrados = useMemo(() => {
    const baseList = empreendimentos?.filter(e => ['lancamento', 'obra'].includes(e.status)) || [];
    
    // Gestor de imobiliária: filtrar apenas os vinculados
    if (isGestorImobiliaria && vinculosIds) {
      return baseList.filter(e => vinculosIds.includes(e.id));
    }
    
    return baseList;
  }, [empreendimentos, isGestorImobiliaria, vinculosIds]);

  const isLoading = loadingEmps || (isGestorImobiliaria && (isLoadingImob || loadingVinculos));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {empreendimentosFiltrados && empreendimentosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {empreendimentosFiltrados.map((emp) => (
              <Card key={emp.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">{emp.nome}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {EMPREENDIMENTO_TIPO_LABELS[emp.tipo]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="line-clamp-1">
                      {emp.endereco_cidade}, {emp.endereco_uf}
                    </span>
                  </div>
                  
                  <Badge variant="outline">
                    {EMPREENDIMENTO_STATUS_LABELS[emp.status]}
                  </Badge>

                  {/* Contadores compactos de unidades */}
                  <div className="flex flex-wrap gap-1.5">
                    {emp.unidades_disponiveis > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                        {emp.unidades_disponiveis} disp.
                      </span>
                    )}
                    {emp.unidades_reservadas > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
                        {emp.unidades_reservadas} res.
                      </span>
                    )}
                    {emp.unidades_negociacao > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">
                        {emp.unidades_negociacao} neg.
                      </span>
                    )}
                    {emp.unidades_vendidas > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600">
                        {emp.unidades_vendidas} vend.
                      </span>
                    )}
                    {emp.unidades_bloqueadas > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500">
                        {emp.unidades_bloqueadas} bloq.
                      </span>
                    )}
                  </div>


                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/portal-corretor/empreendimentos/${emp.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-1">Nenhum empreendimento disponível</h3>
            <p className="text-muted-foreground">
              Não há empreendimentos em lançamento no momento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
