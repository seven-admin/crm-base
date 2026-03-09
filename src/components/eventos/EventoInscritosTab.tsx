import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface EventoInscritosTabProps {
  eventoId: string;
}

export function EventoInscritosTab({ eventoId }: EventoInscritosTabProps) {
  const { data: inscricoes, isLoading } = useQuery({
    queryKey: ['evento-inscricoes-admin', eventoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_inscricoes')
        .select('*')
        .eq('evento_id', eventoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!eventoId,
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const confirmadas = inscricoes?.filter(i => i.status === 'confirmada').length || 0;
  const total = inscricoes?.length || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Inscritos
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="secondary">{confirmadas} confirmado(s)</Badge>
          {total !== confirmadas && (
            <Badge variant="outline">{total} total</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!inscricoes?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma inscrição registrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Imobiliária</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscricoes.map((insc) => (
                  <TableRow key={insc.id}>
                    <TableCell className="font-medium">{insc.nome_corretor}</TableCell>
                    <TableCell>{insc.telefone || '—'}</TableCell>
                    <TableCell>{insc.email || '—'}</TableCell>
                    <TableCell>{insc.imobiliaria_nome || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={insc.status === 'confirmada' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {insc.status === 'confirmada' ? 'Confirmada' : 'Cancelada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(insc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
