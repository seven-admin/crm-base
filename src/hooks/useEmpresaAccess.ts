import { useAuth } from '@/contexts/AuthContext';
import { EmpresaVinculo } from '@/types/auth.types';

/**
 * Segmentação de acesso por empresa/vínculo do usuário.
 * Ortogonal ao role: define quais áreas do sistema o usuário enxerga.
 */
export function useEmpresaAccess() {
  const { profile } = useAuth();
  const empresa: EmpresaVinculo = (profile?.empresa as EmpresaVinculo) || 'seven';

  return {
    empresa,
    isSeven: empresa === 'seven',
    isArqo: empresa === 'arqo',
    isNexa: empresa === 'nexa',
    isIncorporador: empresa === 'incorporador',
    isExterno: empresa === 'externo',
    canAccessGroup: (group: 'seven' | 'arqo' | 'nexa' | 'incorporador' | 'sistema') => {
      if (empresa === 'seven') return true;
      if (empresa === 'externo') return false;
      if (group === 'sistema') return true; // todos veem "Meu Perfil"
      return group === empresa;
    },
  };
}
