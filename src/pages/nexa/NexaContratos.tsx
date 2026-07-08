import { FileText, Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function NexaContratos() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Contratos Nexa
        </h1>
        <p className="text-muted-foreground mt-1">Gestão de contratos vinculados às visitas.</p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <Construction className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Em desenvolvimento</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            A estrutura do banco (<code>nexa_contratos</code>) já está preparada para receber contratos.
            A interface funcional será liberada em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
