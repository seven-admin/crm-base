import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Save } from 'lucide-react';
import { useConfiguracao, useUpdateConfiguracao } from '@/hooks/useConfiguracoesSistema';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export function ConfiguracaoSobrecargaCard() {
  const { data: config, isLoading } = useConfiguracao('planejamento_limite_sobrecarga');
  const updateConfig = useUpdateConfiguracao();
  const [limite, setLimite] = useState('5');

  useEffect(() => {
    if (config?.valor) {
      setLimite(config.valor);
    }
  }, [config]);

  const handleSave = () => {
    const valor = parseInt(limite);
    if (isNaN(valor) || valor < 1 || valor > 50) {
      toast.error('O limite deve ser um número entre 1 e 50');
      return;
    }

    updateConfig.mutate(
      { chave: 'planejamento_limite_sobrecarga', valor: limite },
      {
        onSuccess: () => {
          toast.success('Configuração salva com sucesso');
        },
        onError: () => {
          toast.error('Erro ao salvar configuração');
        }
      }
    );
  };

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações Gerais
        </CardTitle>
        <CardDescription>
          Parâmetros que afetam a análise global do planejamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="limite-sobrecarga">Limite de Sobrecarga</Label>
          <div className="flex items-center gap-2">
            <Input
              id="limite-sobrecarga"
              type="number"
              min={1}
              max={50}
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">tarefas por semana</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Funcionários com mais tarefas que este limite em uma mesma semana serão 
            sinalizados como "sobrecarregados" na visão global.
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={updateConfig.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {updateConfig.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
}
