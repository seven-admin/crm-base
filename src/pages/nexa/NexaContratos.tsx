import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';

export default function NexaContratos() {
  return (
    <MainLayout title="Contratos Nexa" subtitle="Gestão de contratos vinculados às visitas.">
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
    </MainLayout>
  );
}
