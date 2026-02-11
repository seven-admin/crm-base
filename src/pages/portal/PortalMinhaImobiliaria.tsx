import { useNavigate } from 'react-router-dom';
import { useUserImobiliaria } from '@/hooks/useUserImobiliaria';
import { useImobiliaria, useImobiliarias } from '@/hooks/useImobiliarias';
import { ImobiliariaForm } from '@/components/mercado/ImobiliariaForm';
import { ImobiliariaFormData } from '@/types/mercado.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect } from 'react';

export default function PortalMinhaImobiliaria() {
  const navigate = useNavigate();
  const { imobiliariaId, isGestorImobiliaria, isLoading: isLoadingUser } = useUserImobiliaria();
  const { data: imobiliaria, isLoading: isLoadingImob } = useImobiliaria(imobiliariaId || undefined);
  const { update, isUpdating } = useImobiliarias({ enabled: false });

  useEffect(() => {
    if (!isLoadingUser && !isGestorImobiliaria) {
      navigate('/portal-corretor');
    }
  }, [isLoadingUser, isGestorImobiliaria, navigate]);

  const handleSubmit = (data: ImobiliariaFormData & { gestor_criar_acesso?: boolean }) => {
    if (!imobiliariaId) return;
    const { gestor_criar_acesso, is_active, ...rest } = data;
    update({ id: imobiliariaId, ...rest } as any);
  };

  if (isLoadingUser || isLoadingImob) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!imobiliaria) {
    return <p className="text-muted-foreground">Imobiliária não encontrada.</p>;
  }

  return (
    <Card>
      <CardContent className="p-6">
          <ImobiliariaForm
            initialData={imobiliaria}
            onSubmit={handleSubmit}
            isLoading={isUpdating}
            hideAdminFields
          />
      </CardContent>
    </Card>
  );
}
