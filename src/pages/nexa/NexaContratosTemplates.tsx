import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useContratoTemplates, useDeleteContratoTemplate, contarContratosPorTemplate, type ContratoTemplate } from '@/hooks/useNexaContratos';
import { toast } from 'sonner';

export default function NexaContratosTemplates() {
  const { data: templates, isLoading } = useContratoTemplates();
  const del = useDeleteContratoTemplate();
  const [alvoExclusao, setAlvoExclusao] = useState<ContratoTemplate | null>(null);
  const [verificandoUso, setVerificandoUso] = useState(false);

  const pedirExclusao = async (t: ContratoTemplate) => {
    setVerificandoUso(true);
    try {
      const emUso = await contarContratosPorTemplate(t.id);
      if (emUso > 0) {
        toast.error(`Este modelo já foi usado em ${emUso} contrato(s) e não pode ser excluído. Desative-o em vez disso.`);
        return;
      }
      setAlvoExclusao(t);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao verificar uso do modelo');
    } finally {
      setVerificandoUso(false);
    }
  };

  return (
    <MainLayout
      title="Modelos de contrato"
      subtitle="Modelos reutilizáveis com variáveis dinâmicas."
      actions={
        <Button asChild>
          <Link to="/nexa/contratos/modelos/novo"><Plus className="h-4 w-4 mr-2" /> Novo modelo</Link>
        </Button>
      }
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Empreendimento</TableHead>
              <TableHead>Variáveis</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5}>Carregando…</TableCell></TableRow>}
            {!isLoading && !templates?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum modelo cadastrado.</TableCell></TableRow>}
            {templates?.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="font-medium">{t.nome}</div>
                  {t.descricao && <div className="text-xs text-muted-foreground">{t.descricao}</div>}
                </TableCell>
                <TableCell>{t.empreendimento?.nome || <span className="text-muted-foreground text-sm">Global</span>}</TableCell>
                <TableCell><Badge variant="outline">{t.variaveis?.length || 0}</Badge></TableCell>
                <TableCell>{t.is_active ? <Badge>Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" asChild>
                      <Link to={`/nexa/contratos/modelos/${t.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="icon" variant="ghost" disabled={verificandoUso} onClick={() => pedirExclusao(t)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!alvoExclusao} onOpenChange={(open) => !open && setAlvoExclusao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              "{alvoExclusao?.nome}" será removido permanentemente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (alvoExclusao) del.mutate(alvoExclusao.id); setAlvoExclusao(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
