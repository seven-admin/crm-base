import { useState, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Building2, Users, LayoutGrid, List, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTickets } from '@/hooks/useTickets';
import { useSuperAdminIds } from '@/hooks/useSuperAdminIds';
import { useTicketEtapas } from '@/hooks/useTicketEtapas';
import { MarketingKanban } from '@/components/marketing/MarketingKanban';
import { TicketsListaTab } from '@/components/marketing/TicketsListaTab';
import { TicketForm } from '@/components/marketing/TicketForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CATEGORIA_LABELS, type CategoriaTicket } from '@/types/marketing.types';
import { isBefore, startOfDay, isSameMonth, subMonths, addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TipoFilter = 'all' | 'interno' | 'externo';
type ViewMode = 'kanban' | 'lista';

export default function Marketing() {
  const [showForm, setShowForm] = useState(false);
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaTicket | 'all'>('all');
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Estados para filtro de período
  const [mesSelecionado, setMesSelecionado] = useState<Date>(new Date());
  const [ocultarConcluidos, setOcultarConcluidos] = useState(false);
  
  const { tickets, isLoading, alterarEtapa, alterarEtapaEmLote } = useTickets(
    categoriaFilter !== 'all' ? { categoria: categoriaFilter } : undefined
  );
  
  const { data: etapas } = useTicketEtapas();
  const { data: superAdminIds } = useSuperAdminIds();

  // Set de etapas finais para verificar atrasados
  const etapasFinaisIds = useMemo(() => 
    new Set((etapas || []).filter(e => e.is_final).map(e => e.id)),
    [etapas]
  );

  // Navegação entre meses
  const irParaMesAnterior = useCallback(() => setMesSelecionado(prev => subMonths(prev, 1)), []);
  const irParaProximoMes = useCallback(() => setMesSelecionado(prev => addMonths(prev, 1)), []);
  const irParaMesAtual = useCallback(() => setMesSelecionado(new Date()), []);

  // Filtrar por busca, tipo, mês e concluídos
  const projetosFiltrados = useMemo(() => {
    return tickets?.filter(p => {
      // Filtro de busca
      const matchSearch = 
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de tipo
      const matchTipo = 
        tipoFilter === 'all' ||
        (tipoFilter === 'interno' && p.is_interno) ||
        (tipoFilter === 'externo' && !p.is_interno);
      
      // Filtro por mês (baseado em data_previsao)
      let matchMes = true;
      if (p.data_previsao) {
        const dataPrev = new Date(p.data_previsao);
        matchMes = isSameMonth(dataPrev, mesSelecionado);
      } else {
        // Tickets sem previsão: mostrar apenas no mês atual
        matchMes = isSameMonth(new Date(), mesSelecionado);
      }
      
      // Filtro de concluídos
      let matchConcluido = true;
      if (ocultarConcluidos) {
        const isFinal = ['concluido', 'arquivado'].includes(p.status) ||
          (p.ticket_etapa_id && etapasFinaisIds.has(p.ticket_etapa_id));
        matchConcluido = !isFinal;
      }
      
      return matchSearch && matchTipo && matchMes && matchConcluido;
    });
  }, [tickets, searchTerm, tipoFilter, mesSelecionado, ocultarConcluidos, etapasFinaisIds]);

  // Contar atrasados (tickets não em etapa final, com data_previsao vencida)
  const ticketsAtrasados = useMemo(() => {
    if (!projetosFiltrados) return [];
    const hoje = startOfDay(new Date());
    
    return projetosFiltrados.filter(t => {
      if (['concluido', 'arquivado'].includes(t.status)) return false;
      if (t.ticket_etapa_id && etapasFinaisIds.has(t.ticket_etapa_id)) return false;
      if (!t.data_previsao) return false;
      return isBefore(new Date(t.data_previsao), hoje);
    });
  }, [projetosFiltrados, etapasFinaisIds]);

  // Handlers para seleção
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (!projetosFiltrados) return;
    if (selectedIds.size === projetosFiltrados.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projetosFiltrados.map(p => p.id)));
    }
  }, [projetosFiltrados, selectedIds.size]);

  const handleAlterarEtapa = useCallback((ticketId: string, novaEtapaId: string) => {
    alterarEtapa.mutate({ ticketId, etapaId: novaEtapaId });
  }, [alterarEtapa]);

  const handleAlterarEtapaEmLote = useCallback((etapaId: string) => {
    if (selectedIds.size === 0) return;
    alterarEtapaEmLote.mutate(
      { ticketIds: Array.from(selectedIds), etapaId },
      { onSuccess: () => setSelectedIds(new Set()) }
    );
  }, [selectedIds, alterarEtapaEmLote]);

  return (
    <MainLayout 
      title="Atividades de Produção"
      subtitle="Gerencie atividades de criação e marketing"
    >
      {/* Seletor de Mês e Toggle de Concluídos */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={irParaMesAnterior} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="font-medium min-w-[130px] text-center capitalize">
            {format(mesSelecionado, 'MMMM yyyy', { locale: ptBR })}
          </span>
          
          <Button variant="ghost" size="icon" onClick={irParaProximoMes} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={irParaMesAtual}>
            Este mês
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMesSelecionado(subMonths(new Date(), 1))}>
            Mês anterior
          </Button>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <Checkbox
            id="ocultar-concluidos"
            checked={ocultarConcluidos}
            onCheckedChange={(checked) => setOcultarConcluidos(checked === true)}
          />
          <label htmlFor="ocultar-concluidos" className="text-sm cursor-pointer select-none">
            Ocultar concluídos
          </label>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoriaFilter} onValueChange={(v) => setCategoriaFilter(v as CategoriaTicket | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {Object.entries(CATEGORIA_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="interno">
              <span className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Internos
              </span>
            </SelectItem>
            <SelectItem value="externo">
              <span className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Externos
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Atividade
        </Button>
      </div>

      {/* Tabs de visualização */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="lista" className="gap-2">
              <List className="h-4 w-4" />
              Lista
              {ticketsAtrasados.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-xs">
                  {ticketsAtrasados.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Ação em lote */}
          {viewMode === 'lista' && selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} {selectedIds.size === 1 ? 'selecionado' : 'selecionados'}
              </span>
              <Select onValueChange={handleAlterarEtapaEmLote}>
                <SelectTrigger className="w-48 h-8">
                  <SelectValue placeholder="Alterar etapa em lote" />
                </SelectTrigger>
                <SelectContent>
                  {(etapas || []).map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: etapa.cor || '#6b7280' }}
                        />
                        {etapa.nome}
                        {etapa.is_final && (
                          <Check className="h-3 w-3 text-green-600 ml-1" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Limpar
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="kanban" className="mt-0">
          <MarketingKanban projetos={projetosFiltrados || []} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="lista" className="mt-0">
          <TicketsListaTab
            tickets={projetosFiltrados || []}
            etapas={etapas || []}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onAlterarEtapa={handleAlterarEtapa}
            superAdminIds={superAdminIds}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Atividade de Produção</DialogTitle>
          </DialogHeader>
          <TicketForm onSuccess={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
