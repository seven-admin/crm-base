import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { useArqoGrupos, useArqoGrupoMembros, useUpsertArqoConfig, useDeleteArqoConfig } from '@/hooks/useArqo';
import { useProfilesByRoles } from '@/hooks/useFuncionariosSeven';

export function ArqoGrupoMembros() {
  const { data: grupos = [] } = useArqoGrupos();
  const [grupoId, setGrupoId] = useState<string>('');
  const { data: membros = [] } = useArqoGrupoMembros(grupoId);
  const { data: profiles = [] } = useProfilesByRoles(['arqo_admin', 'arqo_gestor', 'arqo_consultor', 'arqo_closer', 'super_admin']);
  const upsert = useUpsertArqoConfig('arqo_grupo_membros');
  const del = useDeleteArqoConfig('arqo_grupo_membros');

  const [novoUser, setNovoUser] = useState<string>('');
  const [novoPapel, setNovoPapel] = useState<'consultor' | 'closer'>('consultor');
  const [novaOrdem, setNovaOrdem] = useState<number>(0);

  const disponiveis = profiles.filter(p => !membros.some(m => m.user_id === p.id));

  const adicionar = () => {
    if (!grupoId || !novoUser) return;
    upsert.mutate({
      grupo_id: grupoId,
      user_id: novoUser,
      papel: novoPapel,
      ordem_roleta: novaOrdem,
      is_active: true,
    }, {
      onSuccess: () => {
        setNovoUser('');
        setNovaOrdem(0);
      }
    });
  };

  return (
    <Card className="p-4 mt-4">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Membros do grupo</h3>
        <div className="w-64">
          <Select value={grupoId} onValueChange={setGrupoId}>
            <SelectTrigger><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
            <SelectContent>
              {grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {grupoId && (
        <>
          <div className="flex flex-wrap items-end gap-2 mb-4 p-3 bg-muted/40 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground">Usuário</label>
              <Select value={novoUser} onValueChange={setNovoUser}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {disponiveis.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <label className="text-xs text-muted-foreground">Papel</label>
              <Select value={novoPapel} onValueChange={(v) => setNovoPapel(v as 'consultor' | 'closer')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultor">Consultor</SelectItem>
                  <SelectItem value="closer">Closer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground">Ordem</label>
              <Input type="number" value={novaOrdem} onChange={e => setNovaOrdem(Number(e.target.value))} />
            </div>
            <Button onClick={adicionar} disabled={upsert.isPending || !novoUser}>
              {upsert.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {membros.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum membro cadastrado neste grupo.</p>
            )}
            {membros.sort((a, b) => a.ordem_roleta - b.ordem_roleta).map(m => {
              const p = profiles.find(x => x.id === m.user_id);
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Badge variant="outline">#{m.ordem_roleta}</Badge>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{p?.full_name ?? m.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{p?.email}</div>
                  </div>
                  <Badge variant="secondary">{m.papel}</Badge>
                  <Badge variant={m.is_active ? 'default' : 'outline'}>{m.is_active ? 'Ativo' : 'Inativo'}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => upsert.mutate({ ...m, is_active: !m.is_active })}>
                    {m.is_active ? 'Pausar' : 'Ativar'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => del.mutate(m.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
