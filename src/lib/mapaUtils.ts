import type { Unidade, Bloco } from '@/types/empreendimentos.types';
import type { Fachada } from '@/hooks/useFachadas';

// Label format options
export type LabelFormatElement = 'bloco' | 'tipologia' | 'numero' | 'posicao' | 'andar' | 'fachada';

export const LABEL_FORMAT_OPTIONS: { value: LabelFormatElement; label: string }[] = [
  { value: 'bloco', label: 'Bloco/Quadra' },
  { value: 'tipologia', label: 'Tipologia' },
  { value: 'numero', label: 'Número' },
  { value: 'fachada', label: 'Fachada' },
  { value: 'posicao', label: 'Posição' },
  { value: 'andar', label: 'Andar' },
];

/**
 * Builds a label for a unit to display on the map
 * Format is configurable via the formato parameter
 * Default: [Bloco/Quadra] | [Tipologia] | [Número]
 * Examples: "Q.A|2Q|01", "T.1|101", "L.01"
 */
export function buildUnitLabel(
  unidade: Unidade,
  formato: LabelFormatElement[] = ['bloco', 'tipologia', 'numero']
): string {
  const parts: string[] = [];

  // Process each element in the format order
  for (const element of formato) {
    switch (element) {
      case 'bloco':
        if (unidade.bloco?.nome) {
          const blocoNome = unidade.bloco.nome;
          let blocoAbrev = blocoNome;
          
          if (/^quadra\s*/i.test(blocoNome)) {
            blocoAbrev = blocoNome.replace(/^quadra\s*/i, 'Q.');
          } else if (/^torre\s*/i.test(blocoNome)) {
            blocoAbrev = blocoNome.replace(/^torre\s*/i, 'T.');
          } else if (/^bloco\s*/i.test(blocoNome)) {
            blocoAbrev = blocoNome.replace(/^bloco\s*/i, 'B.');
          } else if (/^lote\s*/i.test(blocoNome)) {
            blocoAbrev = blocoNome.replace(/^lote\s*/i, 'L.');
          } else if (blocoNome.length > 4) {
            blocoAbrev = blocoNome.substring(0, 3) + '.';
          }
          
          parts.push(blocoAbrev.trim());
        }
        break;
        
      case 'tipologia':
        if (unidade.tipologia?.nome) {
          const tipoNome = unidade.tipologia.nome;
          let tipoAbrev = tipoNome;
          
          const quartos = unidade.tipologia.quartos;
          if (quartos && quartos > 0) {
            tipoAbrev = `${quartos}Q`;
          } else if (tipoNome.length > 4) {
            tipoAbrev = tipoNome.substring(0, 3);
          }
          
          parts.push(tipoAbrev);
        }
        break;
        
      case 'numero':
        parts.push(unidade.numero);
        break;
        
      case 'posicao':
        if (unidade.posicao) {
          const posicao = unidade.posicao.toUpperCase();
          let posAbrev = posicao;
          
          if (/esquina/i.test(posicao)) {
            posAbrev = 'ESQ';
          } else if (/frente/i.test(posicao)) {
            posAbrev = 'FR';
          } else if (/fundos/i.test(posicao)) {
            posAbrev = 'FD';
          } else if (/meio/i.test(posicao)) {
            posAbrev = 'MIO';
          } else if (/lateral/i.test(posicao)) {
            posAbrev = 'LAT';
          } else if (posicao.length > 3) {
            posAbrev = posicao.substring(0, 3);
          }
          
          parts.push(posAbrev);
        }
        break;
        
      case 'andar':
        if (unidade.andar !== null && unidade.andar !== undefined) {
          parts.push(`${unidade.andar}º`);
        }
        break;

      case 'fachada':
        if ((unidade as any).fachada?.nome) {
          parts.push((unidade as any).fachada.nome);
        }
        break;
    }
  }

  // Fallback to just number if nothing was added
  if (parts.length === 0) {
    return unidade.numero;
  }

  // Return with separator, or just the number if nothing else
  if (parts.length === 1) {
    return parts[0];
  }
  
  // Use | separator
  return parts.join('|');
}

/**
 * Calculate appropriate font size based on label length and container size
 */
export function calculateLabelFontSize(label: string, radius?: number): number {
  const baseSize = radius ? Math.max(8, Math.min(14, radius * 0.7)) : 12;
  
  if (label.length <= 3) {
    return baseSize;
  } else if (label.length <= 6) {
    return baseSize * 0.85;
  } else if (label.length <= 10) {
    return baseSize * 0.7;
  } else {
    return baseSize * 0.6;
  }
}

/**
 * Groups units by their bloco/quadra for organized selection
 * Groups are sorted naturally (Quadra 2 before Quadra 10)
 * Units within groups are sorted by floor first, then by number
 */
export function groupUnidadesByBloco(unidades: Unidade[]): Map<string, Unidade[]> {
  const groups = new Map<string, Unidade[]>();
  
  unidades.forEach((unidade) => {
    const key = unidade.bloco?.nome || 'Sem Bloco';
    const existing = groups.get(key) || [];
    existing.push(unidade);
    groups.set(key, existing);
  });

  // 1. Sort units within each group: by floor first, then by number (natural sort)
  groups.forEach((units) => {
    units.sort((a, b) => {
      // First sort by floor (units without floor come first)
      const andarA = a.andar ?? -Infinity;
      const andarB = b.andar ?? -Infinity;
      if (andarA !== andarB) {
        return andarA - andarB;
      }
      // Then sort by number using natural sorting
      return a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true });
    });
  });

  // 2. Create new Map with sorted keys (blocks/quadras in natural order)
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => 
    a.localeCompare(b, 'pt-BR', { numeric: true })
  );
  
  const sortedGroups = new Map<string, Unidade[]>();
  
  // "Sem Bloco" always at the end
  const semBlocoKey = 'Sem Bloco';
  const keysWithoutSemBloco = sortedKeys.filter(k => k !== semBlocoKey);
  
  keysWithoutSemBloco.forEach(key => {
    sortedGroups.set(key, groups.get(key)!);
  });
  
  // Add "Sem Bloco" at the end if it exists
  if (groups.has(semBlocoKey)) {
    sortedGroups.set(semBlocoKey, groups.get(semBlocoKey)!);
  }

  return sortedGroups;
}
