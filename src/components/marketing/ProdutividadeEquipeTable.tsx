import { Users, TrendingUp, Clock, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ProdutividadeMembro } from '@/hooks/useDashboardMarketing';

interface ProdutividadeEquipeTableProps {
  data: ProdutividadeMembro[];
  maxHeight?: string;
}

function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (score >= 80) return 'default';
  if (score >= 50) return 'secondary';
  if (score >= 20) return 'outline';
  return 'destructive';
}

export function ProdutividadeEquipeTable({ data, maxHeight = '300px' }: ProdutividadeEquipeTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Produtividade da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhum dado de produtividade disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Produtividade da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Wrench className="h-3 w-3" />
                    <span>Produção</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Concluídos</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Tempo Médio</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((membro, index) => (
                <TableRow key={membro.supervisor_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {index + 1}
                      </div>
                      <span className="font-medium">{membro.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{membro.emProducao}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{membro.concluidos}</Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {membro.tempoMedio !== null ? `${membro.tempoMedio} dias` : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getScoreBadgeVariant(membro.score)}>
                      {membro.score}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
