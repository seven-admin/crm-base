import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBriefings, useDeleteBriefing } from '@/hooks/useBriefings';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { BriefingsTable } from '@/components/briefings/BriefingsTable';
import { BriefingForm } from '@/components/briefings/BriefingForm';
import { BriefingDetalhe } from '@/components/briefings/BriefingDetalhe';
import { TriagemDialog } from '@/components/briefings/TriagemDialog';
import type { Briefing, BriefingStatus } from '@/types/briefings.types';

export default function Briefings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingBriefing, setEditingBriefing] = useState<Briefing | null>(null);
  const [viewingBriefing, setViewingBriefing] = useState<Briefing | null>(null);
  const [triagingBriefing, setTriagingBriefing] = useState<Briefing | null>(null);

  const { user, role } = useAuth();
  const { isAdmin, canAccessModule } = usePermissions();

  // Fetch briefings with optional status filter
  const { data: briefings = [], isLoading } = useBriefings(
    statusFilter !== 'all' ? { status: statusFilter as BriefingStatus } : undefined
  );
  const { mutate: deleteBriefing } = useDeleteBriefing();

  // Filter by search term
  const filteredBriefings = briefings.filter(
    (b) =>
      b.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.tema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Permission checks
  const isSevenTeam = role && !['incorporador', 'corretor', 'cliente_externo'].includes(role);
  const canTriar = isSevenTeam || isAdmin();
  const canDelete = isAdmin();
  
  const canEditBriefing = (briefing: Briefing) => {
    // Seven team can always edit
    if (isSevenTeam || isAdmin()) return true;
    // Incorporadores can only edit their own briefings if status is 'pendente'
    if (briefing.criado_por === user?.id && briefing.status === 'pendente') return true;
    return false;
  };

  // Handlers
  const handleView = (briefing: Briefing) => {
    setViewingBriefing(briefing);
  };

  const handleEdit = (briefing: Briefing) => {
    setEditingBriefing(briefing);
    setFormOpen(true);
  };

  const handleTriar = (briefing: Briefing) => {
    setTriagingBriefing(briefing);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este briefing?')) {
      deleteBriefing(id);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingBriefing(null);
  };

  // Show detail view
  if (viewingBriefing) {
    return (
      <MainLayout title="Briefing" subtitle={`Detalhes do briefing ${viewingBriefing.codigo}`}>
        <BriefingDetalhe
          briefing={viewingBriefing}
          onBack={() => setViewingBriefing(null)}
          onEdit={() => {
            setEditingBriefing(viewingBriefing);
            setFormOpen(true);
          }}
          onTriar={() => setTriagingBriefing(viewingBriefing)}
          canEdit={canEditBriefing(viewingBriefing)}
          canTriar={canTriar}
        />
        <BriefingForm 
          open={formOpen} 
          onOpenChange={handleCloseForm} 
          briefing={editingBriefing} 
        />
        <TriagemDialog
          open={!!triagingBriefing}
          onOpenChange={(open) => !open && setTriagingBriefing(null)}
          briefing={triagingBriefing}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Briefings"
      subtitle="Sistema de solicitação de peças de marketing"
    >
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar briefings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Briefing
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="triado">Triados</TabsTrigger>
            <TabsTrigger value="em_producao">Em Produção</TabsTrigger>
            <TabsTrigger value="aprovado">Aprovados</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        <BriefingsTable
          briefings={filteredBriefings}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onTriar={handleTriar}
          onDelete={handleDelete}
          canTriar={canTriar}
          canEdit={canEditBriefing}
          canDelete={canDelete}
        />
      </div>

      <BriefingForm 
        open={formOpen} 
        onOpenChange={handleCloseForm} 
        briefing={editingBriefing} 
      />

      <TriagemDialog
        open={!!triagingBriefing}
        onOpenChange={(open) => !open && setTriagingBriefing(null)}
        briefing={triagingBriefing}
      />
    </MainLayout>
  );
}
