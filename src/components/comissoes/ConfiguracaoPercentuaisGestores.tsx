import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Pencil, Check, X, User, Percent } from 'lucide-react';
import { useGestoresComPercentual, useUpdatePercentualGestor } from '@/hooks/useGestores';

export function ConfiguracaoPercentuaisGestores() {
  const { data: gestores = [], isLoading } = useGestoresComPercentual();
  const { mutate: updatePercentual, isPending } = useUpdatePercentualGestor();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleEdit = (gestor: { id: string; percentual_comissao?: number | null }) => {
    setEditingId(gestor.id);
    setEditValue(gestor.percentual_comissao?.toString() || '3');
  };

  const handleSave = (gestorId: string) => {
    const percentual = parseFloat(editValue);
    if (isNaN(percentual) || percentual < 0 || percentual > 100) {
      return;
    }
    
    updatePercentual({ gestorId, percentual }, {
      onSuccess: () => {
        setEditingId(null);
        setEditValue('');
      }
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (gestores.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum gestor de produto cadastrado.</p>
          <p className="text-sm mt-1">Adicione usuários com o papel de "Gestor de Produto" para configurar percentuais.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Percentuais de Comissão por Gestor
        </CardTitle>
        <CardDescription>
          Configure o percentual de comissão de cada gestor de produto. Este valor será usado automaticamente ao finalizar contratos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gestor</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Percentual</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gestores.map((gestor) => (
              <TableRow key={gestor.id}>
                <TableCell className="font-medium">{gestor.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{gestor.email}</TableCell>
                <TableCell>
                  <Badge variant={gestor.is_active ? 'default' : 'secondary'}>
                    {gestor.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {editingId === gestor.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 text-right"
                        autoFocus
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  ) : (
                    <span className="font-semibold text-primary">
                      {gestor.percentual_comissao?.toFixed(1) || '3.0'}%
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === gestor.id ? (
                    <div className="flex items-center gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleSave(gestor.id)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleCancel}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleEdit(gestor)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
