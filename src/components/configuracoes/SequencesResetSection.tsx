import { useState } from 'react';
import { useSequenceValues, useResetSequence, type SequenceInfo } from '@/hooks/useSequences';
import { Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export function SequencesResetSection() {
  const { data: sequences, isLoading } = useSequenceValues();
  const resetSequence = useResetSequence();
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [confirmDialog, setConfirmDialog] = useState<SequenceInfo | null>(null);

  const handleReset = () => {
    if (!confirmDialog) return;
    const value = Number(newValues[confirmDialog.seq_name]);
    if (!value || value < 1) return;

    resetSequence.mutate(
      { sequence_name: confirmDialog.seq_name, restart_value: value },
      { onSettled: () => setConfirmDialog(null) }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="card-elevated p-4 md:p-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Contadores do Sistema</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Reinicie os contadores (sequences) usados para gerar códigos automáticos.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contador</TableHead>
              <TableHead className="text-center">Prefixo</TableHead>
              <TableHead className="text-center">Valor Atual</TableHead>
              <TableHead className="text-center">Novo Valor</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sequences?.map((seq) => (
              <TableRow key={seq.seq_name}>
                <TableCell className="font-medium">{seq.label}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{seq.prefix}</Badge>
                </TableCell>
                <TableCell className="text-center font-mono">{seq.last_value}</TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Novo valor"
                    className="w-28 mx-auto text-center"
                    value={newValues[seq.seq_name] || ''}
                    onChange={(e) =>
                      setNewValues((prev) => ({ ...prev, [seq.seq_name]: e.target.value }))
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      !newValues[seq.seq_name] ||
                      Number(newValues[seq.seq_name]) < 1 ||
                      resetSequence.isPending
                    }
                    onClick={() => setConfirmDialog(seq)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reiniciar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reiniciar contador?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reiniciar o contador <strong>{confirmDialog?.label}</strong> ({confirmDialog?.prefix}) para o valor{' '}
              <strong>{newValues[confirmDialog?.seq_name || '']}</strong>?
              <br /><br />
              Esta ação afetará os próximos códigos gerados pelo sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} disabled={resetSequence.isPending}>
              {resetSequence.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
