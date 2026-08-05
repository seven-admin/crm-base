import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Eye, Home, MapPin, Pencil, Plus, Trash2, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NexaAtividadeFormDialog } from '@/components/nexa/NexaAtividadeFormDialog';
import { useNexaAtividades, useDeleteNexaAtividade } from '@/hooks/useNexaMetas';
import { useProfilesByRoles } from '@/hooks/useFuncionariosSeven';
import { usePermissions } from '@/hooks/usePermissions';
import type { NexaAtividadeTipo, NexaAtividadeWithRelations } from '@/types/nexa.types';
import { TIPO_ATIVIDADE_LABELS, NEXA_SUBTIPO_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/types/nexa.types';

function formatDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function RegistroAtividadesTab() {
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();
  const superAdmin = isSuperAdmin();
  const [tipo, setTipo] = useState<'todos' | NexaAtividadeTipo>('todos');
  const [userId, setUserId] = useState<string>('todos');
  const { data: profiles = [] } = useProfilesByRoles(['nexa_admin', 'nexa_gestor', 'nexa_corretor', 'super_admin']);
  const { data: atividades = [], isLoading } = useNexaAtividades({
    tipo: tipo === 'todos' ? undefined : tipo,
    userId: superAdmin && userId !== 'todos' ? userId : undefined,
  });
  const del = useDeleteNexaAtividade();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NexaAtividadeWithRelations | null>(null);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (a: NexaAtividadeWithRelations) => { setEditing(a); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
            <TabsList>
              <TabsTrigger value="todos">Todas</TabsTrigger>
              <TabsTrigger value="visita">Mercado</TabsTrigger>
              <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
              <TabsTrigger value="outros">Outros</TabsTrigger>
            </TabsList>
          </Tabs>
          {superAdmin && (
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Usuário" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os usuários</SelectItem>
                {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Nova atividade</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : atividades.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
      ) : (
        <div className="space-y-2">
          {atividades.map((a) => {
            const participantes = a.participantes ?? [];
            const isAtend = a.tipo === 'atendimento';
            const clienteNome = a.cliente?.nome || a.visitante_nome;
            return (
              <div key={a.id} className="rounded-2xl border border-black/[.07] bg-[#fffdfa] p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={a.tipo === 'visita' ? 'default' : 'secondary'}>{TIPO_ATIVIDADE_LABELS[a.tipo]}</Badge>
                      {a.subtipo && <Badge variant="outline">{NEXA_SUBTIPO_LABELS[a.subtipo]}</Badge>}
                      {isAtend && a.status && <Badge className={STATUS_COLORS[a.status]}>{STATUS_LABELS[a.status]}</Badge>}
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" /> {formatDataHora(a.data_hora)}
                      </span>
                    </div>

                    {isAtend && (
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {clienteNome && <p className="flex items-center gap-1"><User className="h-3.5 w-3.5 shrink-0" /> {clienteNome}</p>}
                        {a.empreendimento?.nome && <p className="flex items-center gap-1"><Home className="h-3.5 w-3.5 shrink-0" /> {a.empreendimento.nome}{a.imobiliaria?.nome ? ` · ${a.imobiliaria.nome}` : ''}</p>}
                      </div>
                    )}

                    {a.tipo === 'visita' && (a.local || a.qtd_pessoas != null) && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {a.local || 'Sem local'}{a.qtd_pessoas != null && ` · ${a.qtd_pessoas} pessoa(s)`}
                      </p>
                    )}
                    {participantes.length > 0 && (
                      <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                        <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {participantes.map((p) => p.corretor_nome).filter(Boolean).join(', ')}
                      </p>
                    )}
                    {a.observacoes && <p className="mt-2 text-xs text-muted-foreground">{a.observacoes}</p>}
                    {a.criador && <p className="mt-2 text-[11px] text-muted-foreground/70">Registrado por {a.criador.full_name}</p>}
                  </div>

                  {isAtend && (
                    <Button size="icon" variant="ghost" onClick={() => navigate(`/nexa/visitas/${a.id}`)} title="Ver detalhe">
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirm('Excluir esta atividade?') && del.mutate(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NexaAtividadeFormDialog open={open} onOpenChange={setOpen} atividade={editing} />
    </div>
  );
}
