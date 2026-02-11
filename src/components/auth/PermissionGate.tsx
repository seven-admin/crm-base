import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { ActionType } from '@/types/auth.types';

interface PermissionGateProps {
  children: ReactNode;
  moduleName: string;
  action?: ActionType;
  fallback?: ReactNode;
  adminOnly?: boolean;
}

export function PermissionGate({ 
  children, 
  moduleName, 
  action = 'view',
  fallback = null,
  adminOnly = false 
}: PermissionGateProps) {
  const { canAccessModule, isAdmin } = usePermissions();

  if (adminOnly && !isAdmin()) {
    return <>{fallback}</>;
  }

  if (!canAccessModule(moduleName, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
