import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Alerta {
  tipo: 'urgente' | 'atencao' | 'info';
  titulo: string;
  descricao: string;
  link?: string;
  quantidade?: number;
}

interface AlertsListProps {
  alertas: Alerta[];
}

export function AlertsList({ alertas }: AlertsListProps) {
  const navigate = useNavigate();

  const getAlertIcon = (tipo: Alerta['tipo']) => {
    switch (tipo) {
      case 'urgente':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'atencao':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBadgeVariant = (tipo: Alerta['tipo']) => {
    switch (tipo) {
      case 'urgente':
        return 'destructive';
      case 'atencao':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (alertas.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Alertas e Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Info className="h-5 w-5 mr-2" />
            <span className="text-sm">Nenhum alerta no momento</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Alertas e Ações
          <Badge variant="secondary" className="text-xs">
            {alertas.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alertas.map((alerta, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors",
              alerta.link && "cursor-pointer hover:bg-muted/50"
            )}
            onClick={() => alerta.link && navigate(alerta.link)}
          >
            {getAlertIcon(alerta.tipo)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{alerta.titulo}</p>
                <Badge variant={getBadgeVariant(alerta.tipo)} className="text-xs">
                  {alerta.tipo}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{alerta.descricao}</p>
            </div>
            {alerta.link && (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
