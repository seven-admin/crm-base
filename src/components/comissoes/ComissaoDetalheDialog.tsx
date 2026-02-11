import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatarMoeda } from '@/lib/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Comissao } from '@/types/comissoes.types';
import { COMISSAO_STATUS_LABELS, COMISSAO_STATUS_COLORS } from '@/types/comissoes.types';
import { Building2, User, FileText, Calendar, DollarSign, Percent, FileCheck } from 'lucide-react';

interface ComissaoDetalheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comissao: Comissao | null;
}

export function ComissaoDetalheDialog({ open, onOpenChange, comissao }: ComissaoDetalheDialogProps) {
  if (!comissao) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Comissão {comissao.numero}</span>
            <Badge className={COMISSAO_STATUS_COLORS[comissao.status]}>
              {COMISSAO_STATUS_LABELS[comissao.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Geral */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Empreendimento</p>
                <p className="font-medium">{comissao.empreendimento?.nome || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Contrato</p>
                <p className="font-medium">{comissao.contrato?.numero || 'Não vinculado'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Gestor do Produto</p>
                <p className="font-medium">{comissao.gestor?.full_name || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="font-medium">{formatDate(comissao.created_at)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Valores */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Valores</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Valor da Venda</span>
                </div>
                <p className="text-lg font-bold">{formatarMoeda(comissao.valor_venda)}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Percent className="h-4 w-4" />
                  <span className="text-xs">Percentual</span>
                </div>
                <p className="text-lg font-bold">{comissao.percentual_comissao}%</p>
              </div>

              <div className="p-4 rounded-lg bg-primary/10">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Valor da Comissão</span>
                </div>
                <p className="text-lg font-bold text-primary">{formatarMoeda(comissao.valor_comissao || 0)}</p>
              </div>
            </div>
          </div>

          {/* Corretor e Imobiliária (se houver) */}
          {(comissao.corretor || comissao.imobiliaria) && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">Corretor / Imobiliária</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {comissao.corretor && (
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Corretor</p>
                      <p className="font-medium">{comissao.corretor.nome_completo}</p>
                      {comissao.valor_corretor && (
                        <p className="text-sm text-green-600 mt-1">
                          {formatarMoeda(comissao.valor_corretor)} ({comissao.percentual_corretor}%)
                        </p>
                      )}
                    </div>
                  )}
                  {comissao.imobiliaria && (
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Imobiliária</p>
                      <p className="font-medium">{comissao.imobiliaria.nome}</p>
                      {comissao.valor_imobiliaria && (
                        <p className="text-sm text-green-600 mt-1">
                          {formatarMoeda(comissao.valor_imobiliaria)} ({comissao.percentual_imobiliaria}%)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Pagamento */}
          {comissao.status === 'pago' && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">Pagamento</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data do Pagamento</p>
                      <p className="font-medium">{formatDate(comissao.data_pagamento)}</p>
                    </div>
                  </div>

                  {comissao.nf_numero && (
                    <div className="flex items-start gap-3">
                      <FileCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Número da NF</p>
                        <p className="font-medium">{comissao.nf_numero}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Observações */}
          {comissao.observacoes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Observações</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {comissao.observacoes}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
