import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KanbanCard } from './KanbanCard';
import { Negociacao } from '@/types/negociacoes.types';
import { FunilEtapa } from '@/types/funis.types';
import { cn } from '@/lib/utils';
import { formatarMoedaCompacta } from '@/lib/formatters';

interface KanbanColumnProps {
  etapa: FunilEtapa;
  negociacoes: Negociacao[];
  onMover: (negociacao: Negociacao) => void;
  onEditar: (negociacao: Negociacao) => void;
  onHistorico: (negociacao: Negociacao) => void;
  onExcluir: (negociacao: Negociacao) => void;
  onDrop: (negociacao: Negociacao, novaEtapa: FunilEtapa) => void;
  onDragStart: (e: React.DragEvent, negociacao: Negociacao) => void;
  onGerarContrato?: (negociacao: Negociacao) => void;
}

export function KanbanColumn({
  etapa,
  negociacoes,
  onMover,
  onEditar,
  onHistorico,
  onExcluir,
  onDrop,
  onDragStart,
  onGerarContrato
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const valorTotal = negociacoes.reduce((acc, neg) => acc + (neg.valor_negociacao || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const negociacao = JSON.parse(data) as Negociacao;
      if (negociacao.funil_etapa_id !== etapa.id) {
        onDrop(negociacao, etapa);
      }
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col w-72 shrink-0 rounded-lg border transition-colors",
        isDragOver && "ring-2 ring-primary ring-offset-2"
      )}
      style={{ backgroundColor: etapa.cor_bg || undefined }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: etapa.cor || '#6b7280' }}
            />
            <h3 className="font-medium text-sm">{etapa.nome}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
            {negociacoes.length}
          </span>
        </div>
        {valorTotal > 0 && (
          <p className="text-xs text-muted-foreground">
            {formatarMoedaCompacta(valorTotal)}
          </p>
        )}
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {negociacoes.map((negociacao) => (
            <KanbanCard
              key={negociacao.id}
              negociacao={negociacao}
              onMover={onMover}
              onEditar={onEditar}
              onHistorico={onHistorico}
              onExcluir={onExcluir}
              onDragStart={onDragStart}
              onGerarContrato={onGerarContrato}
            />
          ))}
          {negociacoes.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Nenhuma negociação
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}