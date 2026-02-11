import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import type { Cliente } from '@/types/clientes.types';

interface ValidarDadosLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Cliente | null;
  onComplete: () => void;
  onEdit: () => void;
}

const CAMPOS_OBRIGATORIOS_CONTRATO = [
  { campo: 'nome', label: 'Nome' },
  { campo: 'cpf', label: 'CPF' },
  { campo: 'nacionalidade', label: 'Nacionalidade' },
  { campo: 'estado_civil', label: 'Estado Civil' },
  { campo: 'profissao', label: 'Profissão' },
  { campo: 'nome_mae', label: 'Nome da Mãe' },
  { campo: 'nome_pai', label: 'Nome do Pai' },
  { campo: 'data_nascimento', label: 'Data de Nascimento' },
  { campo: 'endereco_logradouro', label: 'Logradouro' },
  { campo: 'endereco_numero', label: 'Número' },
  { campo: 'endereco_bairro', label: 'Bairro' },
  { campo: 'endereco_cidade', label: 'Cidade' },
  { campo: 'endereco_uf', label: 'UF' },
  { campo: 'endereco_cep', label: 'CEP' },
  { campo: 'telefone', label: 'Telefone' },
  { campo: 'email', label: 'Email' },
] as const;

export function validarDadosLeadParaContrato(lead: Cliente | null): { valido: boolean; camposFaltando: typeof CAMPOS_OBRIGATORIOS_CONTRATO[number][] } {
  if (!lead) {
    return { valido: false, camposFaltando: [...CAMPOS_OBRIGATORIOS_CONTRATO] };
  }

  const camposFaltando = CAMPOS_OBRIGATORIOS_CONTRATO.filter(
    (c) => {
      const valor = lead[c.campo as keyof Cliente];
      return !valor || String(valor).trim() === '';
    }
  );

  return { valido: camposFaltando.length === 0, camposFaltando };
}

export function ValidarDadosLeadDialog({ 
  open, 
  onOpenChange, 
  lead, 
  onComplete, 
  onEdit 
}: ValidarDadosLeadDialogProps) {
  if (!lead) return null;

  const { valido, camposFaltando } = validarDadosLeadParaContrato(lead);

  // Se todos os dados estão completos, chama onComplete automaticamente
  if (valido && open) {
    onComplete();
    onOpenChange(false);
    return null;
  }

  const camposPreenchidos = CAMPOS_OBRIGATORIOS_CONTRATO.filter(
    (c) => !camposFaltando.includes(c)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Dados Incompletos para Contrato
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para fechar esta negociação e emitir o contrato, complete os dados do cliente:
          </p>

          <div className="max-h-60 overflow-y-auto space-y-3">
            {camposFaltando.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">Campos faltando:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {camposFaltando.map((c) => (
                    <div key={c.campo} className="flex items-center gap-2 text-sm text-destructive">
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {camposPreenchidos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-green-600">Campos preenchidos:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {camposPreenchidos.map((c) => (
                    <div key={c.campo} className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onEdit}>
            Completar Dados do Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
