import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MapaInterativo } from '@/components/mapa/MapaInterativo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { Loader2, Map } from 'lucide-react';

const MapaUnidadesPage = () => {
  const { data: empreendimentos, isLoading } = useEmpreendimentos();
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  // Filtrar apenas empreendimentos que usam mapa (loteamento e condomínio)
  const empreendimentosComMapa = empreendimentos?.filter(
    (emp) => emp.tipo === 'loteamento' || emp.tipo === 'condominio'
  ) || [];

  // Se não há seleção e temos empreendimentos, selecionar o primeiro
  const empId = selectedEmpId || empreendimentosComMapa[0]?.id || '';

  if (isLoading) {
    return (
      <MainLayout
        title="Mapa de Unidades"
        subtitle="Visualize a disponibilidade de unidades por empreendimento"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Mapa de Unidades"
      subtitle="Visualize a disponibilidade de unidades por empreendimento"
    >
      <div className="flex items-center gap-4 mb-6">
        <Select value={empId} onValueChange={setSelectedEmpId}>
          <SelectTrigger className="w-72 bg-card">
            <SelectValue placeholder="Selecione o empreendimento" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {empreendimentosComMapa.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline">Exportar</Button>
      </div>

      {empreendimentosComMapa.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Map className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum empreendimento com mapa</h3>
            <p className="text-muted-foreground max-w-md">
              O mapa interativo está disponível apenas para empreendimentos do tipo
              Loteamento ou Condomínio. Cadastre um empreendimento desses tipos para
              usar esta funcionalidade.
            </p>
          </CardContent>
        </Card>
      ) : empId ? (
        <MapaInterativo empreendimentoId={empId} />
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">
              Selecione um empreendimento para visualizar o mapa
            </p>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
};

export default MapaUnidadesPage;
