import type { UnidadeStatus } from './empreendimentos.types';

export interface PolygonPoint {
  x: number;
  y: number;
}

export interface PolygonCoords {
  points: PolygonPoint[];
  raio?: number; // Para marcadores circulares
}

// Tipo do item desenhado: polígono ou marcador (círculo)
export type MapaItemTipo = 'polygon' | 'marker';

export interface DrawnItem {
  id: string;
  tipo: MapaItemTipo;
  points: PolygonPoint[]; // Para polygon: array de pontos; Para marker: [centro]
  raio?: number; // Apenas para markers
  unidadeId?: string;
}

export const getPolygonColor = (status: UnidadeStatus): string => {
  switch (status) {
    case 'disponivel':
      return '#00ff64'; // Verde neon
    case 'reservada':
      return '#ffc800'; // Amarelo vibrante
    case 'negociacao':
      return '#0096ff'; // Azul elétrico
    case 'contrato':
      return '#b43cff'; // Roxo neon
    case 'vendida':
      return '#ff3232'; // Vermelho vivo
    case 'bloqueada':
      return '#788296'; // Cinza mais claro
    default:
      return '#d1d5db'; // Cinza claro (sem vínculo)
  }
};

export const getPolygonColorWithOpacity = (status: UnidadeStatus, opacity: number = 0.9): string => {
  switch (status) {
    case 'disponivel':
      return `rgba(0, 255, 100, ${opacity})`; // Verde neon
    case 'reservada':
      return `rgba(255, 200, 0, ${opacity})`; // Amarelo vibrante
    case 'negociacao':
      return `rgba(0, 150, 255, ${opacity})`; // Azul elétrico
    case 'contrato':
      return `rgba(180, 60, 255, ${opacity})`; // Roxo neon
    case 'vendida':
      return `rgba(255, 50, 50, ${opacity})`; // Vermelho vivo
    case 'bloqueada':
      return `rgba(120, 130, 150, ${opacity})`; // Cinza mais claro
    default:
      return `rgba(209, 213, 219, ${opacity})`; // Cinza claro
  }
};

export const STATUS_LEGEND = [
  { status: 'disponivel' as UnidadeStatus, label: 'Disponível', color: '#00ff64' },
  { status: 'reservada' as UnidadeStatus, label: 'Reservado', color: '#ffc800' },
  { status: 'negociacao' as UnidadeStatus, label: 'Em Negociação', color: '#0096ff' },
  { status: 'contrato' as UnidadeStatus, label: 'Em Contrato', color: '#b43cff' },
  { status: 'vendida' as UnidadeStatus, label: 'Vendido', color: '#ff3232' },
  { status: 'bloqueada' as UnidadeStatus, label: 'Bloqueado', color: '#788296' },
];
