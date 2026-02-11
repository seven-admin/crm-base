import { useState, useEffect, useCallback } from 'react';
import type { TVLayoutItem } from '@/types/tvLayout.types';
import { DEFAULT_EXECUTIVO_LAYOUT, DEFAULT_FORECAST_LAYOUT } from '@/types/tvLayout.types';

const STORAGE_KEY_PREFIX = 'tv-layout-config-';

function getDefaultLayout(dashboardId: 'executivo' | 'forecast'): TVLayoutItem[] {
  return dashboardId === 'executivo' 
    ? [...DEFAULT_EXECUTIVO_LAYOUT] 
    : [...DEFAULT_FORECAST_LAYOUT];
}

export function useTVLayoutConfig(dashboardId: 'executivo' | 'forecast') {
  const [config, setConfig] = useState<TVLayoutItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + dashboardId);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validar estrutura
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar configuração TV:', e);
    }
    return getDefaultLayout(dashboardId);
  });

  // Persistir no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + dashboardId, JSON.stringify(config));
    } catch (e) {
      console.error('Erro ao salvar configuração TV:', e);
    }
  }, [config, dashboardId]);

  // Toggle visibilidade de um item
  const toggleVisibility = useCallback((itemId: string) => {
    setConfig(prev => prev.map(item => 
      item.id === itemId ? { ...item, visible: !item.visible } : item
    ));
  }, []);

  // Reordenar itens
  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setConfig(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      return newItems.map((item, idx) => ({ ...item, order: idx }));
    });
  }, []);

  // Resetar para configuração padrão
  const resetToDefault = useCallback(() => {
    setConfig(getDefaultLayout(dashboardId));
  }, [dashboardId]);

  // Itens visíveis ordenados
  const visibleItems = config
    .filter(item => item.visible)
    .sort((a, b) => a.order - b.order);

  return { 
    config, 
    visibleItems, 
    toggleVisibility, 
    reorder, 
    resetToDefault 
  };
}
