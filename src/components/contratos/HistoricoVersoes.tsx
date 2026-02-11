import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, User, FileText } from 'lucide-react';
import type { ContratoVersao } from '@/types/contratos.types';

interface HistoricoVersoesProps {
  versoes: ContratoVersao[];
}

export function HistoricoVersoes({ versoes }: HistoricoVersoesProps) {
  if (versoes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma versão anterior registrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Versões</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-6">
            {versoes.map((versao, index) => (
              <div key={versao.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                  index === 0 ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'
                }`} />
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Versão {versao.versao}</span>
                      {index === 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Atual
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(versao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {versao.alterado_por_profile && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <User className="h-3 w-3" />
                      <span>{versao.alterado_por_profile.full_name}</span>
                    </div>
                  )}
                  
                  {versao.motivo_alteracao && (
                    <p className="text-sm text-muted-foreground italic">
                      "{versao.motivo_alteracao}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
