import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, ArrowLeft, Loader2, X, Send, Image, Map } from 'lucide-react';
import { MapaInterativo } from '@/components/mapa/MapaInterativo';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useUnidades } from '@/hooks/useUnidades';
import { SolicitarReservaDialog } from '@/components/portal/SolicitarReservaDialog';
import { MidiasReadOnlyList } from '@/components/portal/MidiasReadOnlyList';
import { formatarMoeda } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ordenarUnidadesPorBlocoENumero } from '@/lib/unidadeUtils';

interface UnidadeSimples {
  id: string;
  numero: string;
  valor: number;
  bloco?: { nome: string } | null;
}

export default function PortalEmpreendimentoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<UnidadeSimples[]>([]);
  const [dialogEnviarOpen, setDialogEnviarOpen] = useState(false);
  const [filtroBloco, setFiltroBloco] = useState<string>('todos');

  const { data: empreendimentos, isLoading: loadingEmps } = useEmpreendimentos();
  const { data: unidades, isLoading: loadingUnidades } = useUnidades(id);

  const empreendimento = useMemo(() => {
    return empreendimentos?.find(e => e.id === id);
  }, [empreendimentos, id]);

  // Verificar se empreendimento suporta mapa (loteamento ou condomínio)
  const suportaMapa = empreendimento?.tipo === 'loteamento' || empreendimento?.tipo === 'condominio';

  const unidadesDisponiveis = useMemo(() => {
    const disponiveis = unidades?.filter(u => u.status === 'disponivel') || [];
    return ordenarUnidadesPorBlocoENumero(disponiveis);
  }, [unidades]);

  // Extrair lista de blocos únicos para o filtro
  const blocosDisponiveis = useMemo(() => {
    const blocos = unidadesDisponiveis
      .map(u => u.bloco?.nome)
      .filter((nome): nome is string => !!nome);
    
    return [...new Set(blocos)].sort((a, b) => 
      a.localeCompare(b, 'pt-BR', { numeric: true })
    );
  }, [unidadesDisponiveis]);

  // Filtrar unidades pelo bloco selecionado
  const unidadesFiltradas = useMemo(() => {
    if (filtroBloco === 'todos') return unidadesDisponiveis;
    return unidadesDisponiveis.filter(u => u.bloco?.nome === filtroBloco);
  }, [unidadesDisponiveis, filtroBloco]);

  const valorTotal = useMemo(() => {
    return unidadesSelecionadas.reduce((sum, u) => sum + (u.valor || 0), 0);
  }, [unidadesSelecionadas]);

  const handleToggleUnidade = (unidade: UnidadeSimples) => {
    setUnidadesSelecionadas(prev => {
      const exists = prev.some(u => u.id === unidade.id);
      if (exists) {
        return prev.filter(u => u.id !== unidade.id);
      }
      return [...prev, unidade];
    });
  };

  const isUnidadeSelecionada = (unidadeId: string) => {
    return unidadesSelecionadas.some(u => u.id === unidadeId);
  };

  const handleLimparSelecao = () => {
    setUnidadesSelecionadas([]);
  };

  const handleSolicitacaoSuccess = () => {
    setUnidadesSelecionadas([]);
    navigate('/portal-corretor/empreendimentos');
  };

  if (loadingEmps) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!empreendimento) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium mb-1">Empreendimento não encontrado</h3>
        <p className="text-muted-foreground mb-4">
          O empreendimento solicitado não existe ou não está disponível.
        </p>
        <Button variant="outline" onClick={() => navigate('/portal-corretor/empreendimentos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Empreendimentos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/portal-corretor/empreendimentos')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{empreendimento.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {empreendimento.endereco_cidade}, {empreendimento.endereco_uf}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="unidades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unidades" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Unidades
          </TabsTrigger>
          {suportaMapa && (
            <TabsTrigger value="mapa" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Mapa
            </TabsTrigger>
          )}
          <TabsTrigger value="midias" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Mídias
          </TabsTrigger>
        </TabsList>

        {/* Aba Unidades */}
        <TabsContent value="unidades" className="space-y-4">
          {/* Filtro */}
          {blocosDisponiveis.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Filtrar:</span>
              <Select value={filtroBloco} onValueChange={setFiltroBloco}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todas as quadras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as quadras</SelectItem>
                  {blocosDisponiveis.map(bloco => (
                    <SelectItem key={bloco} value={bloco}>
                      {bloco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="ml-auto">
                {unidadesFiltradas.length} disponíve{unidadesFiltradas.length === 1 ? 'l' : 'is'}
              </Badge>
            </div>
          )}

          {/* Tabela de Unidades */}
          <Card>
            <CardContent className="p-0">
              {loadingUnidades ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : unidadesFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {filtroBloco !== 'todos' 
                      ? `Nenhuma unidade disponível em ${filtroBloco}.`
                      : 'Nenhuma unidade disponível neste empreendimento.'}
                  </p>
                  {filtroBloco !== 'todos' && (
                    <Button variant="outline" onClick={() => setFiltroBloco('todos')}>
                      Ver todas as quadras
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Quadra</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unidadesFiltradas.map((unidade) => {
                      const selecionada = isUnidadeSelecionada(unidade.id);
                      return (
                        <TableRow 
                          key={unidade.id}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-colors",
                            selecionada && "bg-primary/5"
                          )}
                          onClick={() => handleToggleUnidade({
                            id: unidade.id,
                            numero: unidade.numero,
                            valor: unidade.valor || 0,
                            bloco: unidade.bloco
                          })}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selecionada}
                              onCheckedChange={() => handleToggleUnidade({
                                id: unidade.id,
                                numero: unidade.numero,
                                valor: unidade.valor || 0,
                                bloco: unidade.bloco
                              })}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {unidade.bloco?.nome || '-'}
                          </TableCell>
                          <TableCell>{unidade.numero}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              Disponível
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {formatarMoeda(unidade.valor || 0)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Footer fixo com seleção */}
          {unidadesSelecionadas.length > 0 && (
            <Card className="bg-muted/30 border-primary/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {unidadesSelecionadas.length} unidade{unidadesSelecionadas.length > 1 ? 's' : ''} selecionada{unidadesSelecionadas.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-lg font-semibold">{formatarMoeda(valorTotal)}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      onClick={handleLimparSelecao}
                      className="flex-1 sm:flex-none"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                    <Button 
                      onClick={() => setDialogEnviarOpen(true)}
                      className="flex-1 sm:flex-none"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Solicitar Reserva
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Mapa (condicional) */}
        {suportaMapa && (
          <TabsContent value="mapa" className="space-y-4">
            <MapaInterativo empreendimentoId={id!} readonly />
          </TabsContent>
        )}

        {/* Aba Mídias */}
        <TabsContent value="midias">
          {id && <MidiasReadOnlyList empreendimentoId={id} />}
        </TabsContent>
      </Tabs>

      {/* Dialog de Envio da Solicitação */}
      {id && (
        <SolicitarReservaDialog
          open={dialogEnviarOpen}
          onOpenChange={setDialogEnviarOpen}
          empreendimentoId={id}
          unidades={unidadesSelecionadas}
          onSuccess={handleSolicitacaoSuccess}
        />
      )}
    </div>
  );
}
