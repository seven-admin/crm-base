import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Pencil, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  type Briefing, 
  BRIEFING_STATUS_LABELS, 
  BRIEFING_STATUS_COLORS 
} from '@/types/briefings.types';
import { cn } from '@/lib/utils';
import { BriefingReferencias } from './BriefingReferencias';

interface BriefingDetalheProps {
  briefing: Briefing;
  onBack: () => void;
  onEdit: () => void;
  onTriar: () => void;
  canEdit: boolean;
  canTriar: boolean;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export function BriefingDetalhe({ 
  briefing, 
  onBack, 
  onEdit, 
  onTriar,
  canEdit,
  canTriar,
}: BriefingDetalheProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{briefing.codigo}</h2>
              <Badge className={cn('font-medium', BRIEFING_STATUS_COLORS[briefing.status])}>
                {BRIEFING_STATUS_LABELS[briefing.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{briefing.tema}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {canTriar && briefing.status === 'pendente' && (
            <Button onClick={onTriar}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Triar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Cliente" value={briefing.cliente} />
                <InfoRow label="Empreendimento" value={briefing.empreendimento?.nome} />
              </div>
              <InfoRow label="Objetivo" value={briefing.objetivo} />
            </CardContent>
          </Card>

          {/* Formato e Composição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Formato e Composição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Formato da Peça" value={briefing.formato_peca} />
                <InfoRow label="Composição" value={briefing.composicao} />
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Head / Título" value={briefing.head_titulo} />
              <InfoRow label="Sub / Complemento" value={briefing.sub_complemento} />
              <InfoRow label="Mensagem Chave" value={briefing.mensagem_chave} />
            </CardContent>
          </Card>

          {/* Estilo e Tom */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estilo e Tom</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Tom de Comunicação" value={briefing.tom_comunicacao} />
                <InfoRow label="Estilo Visual" value={briefing.estilo_visual} />
              </div>
              <InfoRow label="Diretrizes Visuais" value={briefing.diretrizes_visuais} />
            </CardContent>
          </Card>

          {/* Referências (imagens e links) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Referências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Referência (texto)" value={briefing.referencia} />
              <BriefingReferencias briefingId={briefing.id} readOnly />
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          {(briefing.importante || briefing.observacoes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Importante" value={briefing.importante} />
                <InfoRow label="Observações" value={briefing.observacoes} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Criado em</span>
                  <span>{format(new Date(briefing.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Criado por</span>
                  <span>{briefing.criador?.full_name || 'Desconhecido'}</span>
                </div>
                
                {briefing.data_triagem && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Triado em</span>
                      <span>{format(new Date(briefing.data_triagem), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Triado por</span>
                      <span>{briefing.triador?.full_name || 'Desconhecido'}</span>
                    </div>
                  </>
                )}

                {briefing.data_entrega && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Previsão de Entrega</span>
                      <span className="font-medium">{format(new Date(briefing.data_entrega), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
