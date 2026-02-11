import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, BarChart3 } from 'lucide-react';
import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { PlanejamentoDashboard } from '@/components/planejamento/PlanejamentoDashboard';
import { PlanejamentoTimeline } from '@/components/planejamento/PlanejamentoTimeline';

export default function PortalIncorporadorPlanejamento() {
  const [empreendimentoId, setEmpreendimentoId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('timeline');
  const { empreendimentos, isLoading } = useIncorporadorEmpreendimentos();

  // Auto-select first empreendimento if only one
  if (!empreendimentoId && empreendimentos.length === 1) {
    setEmpreendimentoId(empreendimentos[0].id);
  }

  return (
    <div className="space-y-4">
      {/* Seletor de Empreendimento */}
      <Card>
        <CardContent className="py-4">
          <div className="flex-1 min-w-[250px]">
            <Select value={empreendimentoId} onValueChange={setEmpreendimentoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um empreendimento" />
              </SelectTrigger>
              <SelectContent>
                {empreendimentos.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo principal */}
      {empreendimentoId ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="timeline" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4">
            <PlanejamentoTimeline empreendimentoId={empreendimentoId} readOnly />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-4">
            <PlanejamentoDashboard empreendimentoId={empreendimentoId} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um empreendimento para visualizar o planejamento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
