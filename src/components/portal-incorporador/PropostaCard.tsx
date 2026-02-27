import { Negociacao, STATUS_PROPOSTA_LABELS, STATUS_PROPOSTA_COLORS } from '@/types/negociacoes.types';
import { NegociacaoCondicaoPagamento } from '@/hooks/useNegociacaoCondicoesPagamento';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, X, FileText, Building2, User, DollarSign, CreditCard, Home } from 'lucide-react';
import { formatarMoeda } from '@/lib/formatters';

interface PropostaCardProps {
  negociacao: Negociacao;
  condicoes?: NegociacaoCondicaoPagamento[];
  showActions: boolean;
  onAprovar: (neg: Negociacao) => void;
  onContraProposta: (neg: Negociacao) => void;
  children?: React.ReactNode; // for comments section
}

export default function PropostaCard({
  negociacao: neg,
  condicoes = [],
  showActions,
  onAprovar,
  onContraProposta,
  children,
}: PropostaCardProps) {
  const desconto =
    neg.valor_tabela && neg.valor_proposta && neg.valor_proposta < neg.valor_tabela
      ? ((1 - neg.valor_proposta / neg.valor_tabela) * 100).toFixed(1)
      : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">{neg.numero_proposta || neg.codigo}</span>
              <span className="text-xs text-muted-foreground">{neg.codigo}</span>
              {neg.status_proposta && (
                <Badge className={`text-[10px] text-white ${STATUS_PROPOSTA_COLORS[neg.status_proposta]}`}>
                  {STATUS_PROPOSTA_LABELS[neg.status_proposta]}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Cliente */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <User className="h-3.5 w-3.5" />
            CLIENTE
          </div>
          <p className="text-sm font-medium">{neg.cliente?.nome || '-'}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
            {neg.cliente?.cpf && <span>CPF: {neg.cliente.cpf}</span>}
            {neg.cliente?.email && <span>{neg.cliente.email}</span>}
            {neg.cliente?.telefone && <span>{neg.cliente.telefone}</span>}
          </div>
        </div>

        {/* Empreendimento & Corretor */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{neg.empreendimento?.nome || '-'}</span>
          </div>
          {neg.corretor && (
            <p className="text-xs text-muted-foreground">
              Corretor: {neg.corretor.nome_completo}
            </p>
          )}
        </div>

        {/* Unidades */}
        {neg.unidades && neg.unidades.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                <Home className="h-3.5 w-3.5" />
                UNIDADES
              </div>
              <div className="space-y-1">
                {neg.unidades.map((nu) => (
                  <div key={nu.id} className="flex justify-between text-sm bg-muted/40 rounded px-2.5 py-1.5">
                    <span>
                      {nu.unidade?.bloco?.nome ? `${nu.unidade.bloco.nome} - ` : ''}
                      Unidade {nu.unidade?.numero || '-'}
                    </span>
                    <span className="font-medium">
                      {nu.valor_tabela ? formatarMoeda(nu.valor_tabela) : nu.unidade?.valor ? formatarMoeda(nu.unidade.valor) : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Valores */}
        <Separator />
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            VALORES
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs block">Valor Tabela</span>
              <span className="font-medium">{neg.valor_tabela ? formatarMoeda(neg.valor_tabela) : '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Valor Proposta</span>
              <span className="font-medium text-primary">
                {neg.valor_proposta ? formatarMoeda(neg.valor_proposta) : '-'}
              </span>
            </div>
            {desconto && (
              <div>
                <span className="text-muted-foreground text-xs block">Desconto</span>
                <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">
                  -{desconto}%
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Condições de Pagamento */}
        {condicoes.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                CONDIÇÕES DE PAGAMENTO
              </div>
              <div className="space-y-1">
                {condicoes.map((c) => (
                  <div key={c.id} className="flex justify-between text-sm bg-muted/40 rounded px-2.5 py-1.5">
                    <span>
                      {c.quantidade}x {c.descricao || c.tipo_parcela_codigo}
                      {c.forma_pagamento ? ` (${c.forma_pagamento})` : ''}
                    </span>
                    <span className="font-medium">
                      {c.valor ? formatarMoeda(c.valor) : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Contra proposta motivo */}
        {neg.status_proposta === 'contra_proposta' && neg.motivo_contra_proposta && (
          <div className="pt-2 border-t">
            <p className="text-xs text-orange-600 font-medium">Motivo da contra proposta:</p>
            <p className="text-xs text-muted-foreground mt-0.5">{neg.motivo_contra_proposta}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 justify-end pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => onContraProposta(neg)}>
              <X className="h-4 w-4 mr-1.5" />
              Contra Proposta
            </Button>
            <Button size="sm" onClick={() => onAprovar(neg)}>
              <Check className="h-4 w-4 mr-1.5" />
              Aprovar
            </Button>
          </div>
        )}

        {/* Comentários slot */}
        {children}
      </CardContent>
    </Card>
  );
}
