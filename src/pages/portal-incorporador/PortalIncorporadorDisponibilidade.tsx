import { useState } from 'react';
import { MapaInterativo } from '@/components/mapa/MapaInterativo';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { Loader2, Map } from 'lucide-react';

const PortalIncorporadorDisponibilidade = () => {
  const { empreendimentos, isLoading } = useIncorporadorEmpreendimentos();
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  // Filtrar apenas loteamento e condomínio
  const empreendimentosComMapa = empreendimentos.filter(
    (emp) => emp.status === 'ativo'
  );

  const empId = selectedEmpId || empreendimentosComMapa[0]?.id || '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
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
      </div>

      {empreendimentosComMapa.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Map className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum empreendimento disponível</h3>
            <p className="text-muted-foreground max-w-md">
              Não há empreendimentos vinculados à sua conta com mapa de disponibilidade.
            </p>
          </CardContent>
        </Card>
      ) : empId ? (
        <MapaInterativo empreendimentoId={empId} />
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">
              Selecione um empreendimento para visualizar a disponibilidade
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortalIncorporadorDisponibilidade;
