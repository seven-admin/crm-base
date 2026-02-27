import { useState, useMemo } from 'react';
import { MapaInterativo } from '@/components/mapa/MapaInterativo';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { useUnidades } from '@/hooks/useUnidades';
import { formatarMoeda } from '@/lib/formatters';
import { ordenarUnidadesPorBlocoENumero } from '@/lib/unidadeUtils';
import { Loader2, MapIcon, Building2, List } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  disponivel: 'bg-emerald-500/15 text-emerald-700 border-emerald-300',
  reservada: 'bg-amber-500/15 text-amber-700 border-amber-300',
  vendida: 'bg-red-500/15 text-red-700 border-red-300',
  bloqueada: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABELS: Record<string, string> = {
  disponivel: 'Disponível',
  reservada: 'Reservada',
  vendida: 'Vendida',
  bloqueada: 'Bloqueada',
};

const PortalIncorporadorDisponibilidade = () => {
  const { empreendimentos, isLoading } = useIncorporadorEmpreendimentos();
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedBlocoId, setSelectedBlocoId] = useState<string>('todos');

  const empId = selectedEmpId || empreendimentos[0]?.id || '';
  const selectedEmp = empreendimentos.find(e => e.id === empId);

  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades(empId || undefined);

  const hasMap = selectedEmp?.tipo === 'loteamento' || selectedEmp?.tipo === 'condominio';

  // Extract unique blocos for filter
  const blocos = useMemo(() => {
    const blocoMap = new Map();
    unidades.forEach(u => {
      if (u.bloco?.id && u.bloco?.nome) {
        blocoMap.set(u.bloco.id, u.bloco.nome);
      }
    });
    return Array.from(blocoMap.entries()).map(([id, nome]) => ({ id, nome }));
  }, [unidades]);

  // Filter and sort units
  const unidadesFiltradas = useMemo(() => {
    let filtered = unidades;
    if (selectedBlocoId !== 'todos') {
      filtered = filtered.filter(u => u.bloco_id === selectedBlocoId);
    }
    return ordenarUnidadesPorBlocoENumero(filtered);
  }, [unidades, selectedBlocoId]);

  const disponiveis = unidades.filter(u => u.status === 'disponivel').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (empreendimentos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <MapIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum empreendimento disponível</h3>
          <p className="text-muted-foreground max-w-md">
            Não há empreendimentos vinculados à sua conta.
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderUnidadesTable = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        {blocos.length > 1 && (
          <Select value={selectedBlocoId} onValueChange={setSelectedBlocoId}>
            <SelectTrigger className="w-52 bg-card">
              <SelectValue placeholder="Filtrar por bloco" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="todos">Todos os blocos</SelectItem>
              {blocos.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Badge variant="secondary" className="text-xs">
          {disponiveis} disponíve{disponiveis !== 1 ? 'is' : 'l'} de {unidades.length}
        </Badge>
      </div>

      {loadingUnidades ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : unidadesFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma unidade encontrada.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quadra/Bloco</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unidadesFiltradas.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.bloco?.nome || '-'}</TableCell>
                  <TableCell>{u.numero}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[u.status] || ''}>
                      {STATUS_LABELS[u.status] || u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.valor ? formatarMoeda(u.valor) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Select value={empId} onValueChange={(v) => { setSelectedEmpId(v); setSelectedBlocoId('todos'); }}>
          <SelectTrigger className="w-72 bg-card">
            <SelectValue placeholder="Selecione o empreendimento" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {empreendimentos.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!empId ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">
              Selecione um empreendimento para visualizar a disponibilidade
            </p>
          </CardContent>
        </Card>
      ) : hasMap ? (
        <Tabs defaultValue="mapa">
          <TabsList>
            <TabsTrigger value="mapa" className="gap-1.5">
              <MapIcon className="h-4 w-4" />
              Mapa
            </TabsTrigger>
            <TabsTrigger value="unidades" className="gap-1.5">
              <List className="h-4 w-4" />
              Unidades
            </TabsTrigger>
          </TabsList>
          <TabsContent value="mapa">
            <MapaInterativo empreendimentoId={empId} readonly />
          </TabsContent>
          <TabsContent value="unidades">
            {renderUnidadesTable()}
          </TabsContent>
        </Tabs>
      ) : (
        renderUnidadesTable()
      )}
    </div>
  );
};

export default PortalIncorporadorDisponibilidade;
