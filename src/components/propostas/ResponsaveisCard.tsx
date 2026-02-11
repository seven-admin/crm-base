import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCorretores } from '@/hooks/useCorretores';
import { useImobiliarias } from '@/hooks/useImobiliarias';

interface ResponsaveisCardProps {
  corretorId: string | null;
  imobiliariaId: string | null;
  onCorretorChange: (id: string | null) => void;
  onImobiliariaChange: (id: string | null) => void;
}

export function ResponsaveisCard({
  corretorId,
  imobiliariaId,
  onCorretorChange,
  onImobiliariaChange,
}: ResponsaveisCardProps) {
  const { corretores = [] } = useCorretores();
  const { imobiliarias = [] } = useImobiliarias();
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Responsáveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Corretor */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Corretor</label>
          <Select
            value={corretorId || 'none'}
            onValueChange={(v) => onCorretorChange(v === 'none' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o corretor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {corretores.map(corretor => (
                <SelectItem key={corretor.id} value={corretor.id}>
                  {corretor.nome_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Imobiliária */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Imobiliária</label>
          <Select
            value={imobiliariaId || 'none'}
            onValueChange={(v) => onImobiliariaChange(v === 'none' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a imobiliária" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {imobiliarias.map(imobiliaria => (
                <SelectItem key={imobiliaria.id} value={imobiliaria.id}>
                  {imobiliaria.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
