import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useUpsertArqoConfig, useDeleteArqoConfig } from '@/hooks/useArqo';

export type ConfigField = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'color' | 'switch' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  default?: any;
};

interface ArqoConfigCrudProps {
  table: 'arqo_lead_sources' | 'arqo_temperaturas' | 'arqo_funil_etapas' | 'arqo_grupos_atendimento' | 'arqo_sla_regras' | 'arqo_regua_reengajamento';
  items: any[];
  fields: ConfigField[];
  renderRow: (item: any) => React.ReactNode;
  title: string;
}

export function ArqoConfigCrud({ table, items, fields, renderRow, title }: ArqoConfigCrudProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const upsert = useUpsertArqoConfig(table);
  const del = useDeleteArqoConfig(table);

  const openNew = () => {
    const defaults: any = {};
    fields.forEach(f => { if (f.default !== undefined) defaults[f.name] = f.default; });
    setEditing(defaults);
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing({ ...item });
    setOpen(true);
  };

  const save = () => {
    upsert.mutate(editing, { onSuccess: () => setOpen(false) });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo</Button>
      </div>

      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nada cadastrado</p>}
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-2 border rounded-lg">
            <div className="flex-1">{renderRow(item)}</div>
            <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => confirm('Remover?') && del.mutate(item.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar' : 'Novo'} — {title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.name}>
                <Label>{f.label}{f.required ? ' *' : ''}</Label>
                {f.type === 'textarea' ? (
                  <Textarea value={editing?.[f.name] ?? ''} onChange={e => setEditing({ ...editing, [f.name]: e.target.value })} />
                ) : f.type === 'switch' ? (
                  <div className="pt-1">
                    <Switch checked={!!editing?.[f.name]} onCheckedChange={v => setEditing({ ...editing, [f.name]: v })} />
                  </div>
                ) : f.type === 'select' ? (
                  <Select value={editing?.[f.name] ?? ''} onValueChange={v => setEditing({ ...editing, [f.name]: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={f.type === 'number' ? 'number' : f.type === 'color' ? 'color' : 'text'}
                    step={f.type === 'number' ? 'any' : undefined}
                    value={editing?.[f.name] ?? ''}
                    onChange={e => setEditing({
                      ...editing,
                      [f.name]: f.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value,
                    })}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
