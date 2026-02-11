import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Polygon, Circle, FabricText, FabricImage, Shadow, Point } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapaLegenda } from './MapaLegenda';
import { MapaUpload } from './MapaUpload';
import { MapaEditor } from './MapaEditor';
import { useMapaEmpreendimento, useCreateMapa, useUpdateMapa } from '@/hooks/useMapaEmpreendimento';
import { useUnidades } from '@/hooks/useUnidades';
import { useEmpreendimento } from '@/hooks/useEmpreendimentos';
import { getPolygonColor, getPolygonColorWithOpacity, type PolygonCoords } from '@/types/mapa.types';
import { buildUnitLabel, calculateLabelFontSize, type LabelFormatElement } from '@/lib/mapaUtils';
import { UNIDADE_STATUS_LABELS, type Unidade } from '@/types/empreendimentos.types';
import { Loader2, Edit2, Map, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MapaInterativoProps {
  empreendimentoId: string;
  readonly?: boolean;
}

export function MapaInterativo({ empreendimentoId, readonly = false }: MapaInterativoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [zoom, setZoom] = useState(1);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [renderKey, setRenderKey] = useState(0);
  const canvasInstanceIdRef = useRef(0);

  const { data: mapa, isLoading: isLoadingMapa } = useMapaEmpreendimento(empreendimentoId);
  const { data: unidades, isLoading: isLoadingUnidades } = useUnidades(empreendimentoId);
  const { data: empreendimento } = useEmpreendimento(empreendimentoId);
  const createMapa = useCreateMapa();
  const updateMapa = useUpdateMapa();
  
  // Get label format from empreendimento or use default
  const labelFormato = ((empreendimento as any)?.mapa_label_formato || ['bloco', 'tipologia', 'numero']) as LabelFormatElement[];

  // Calculate responsive height
  const calculateCanvasHeight = useCallback(() => {
    const headerHeight = 64;
    const toolbarHeight = 100;
    const padding = 48;
    const minHeight = 400;
    const availableHeight = window.innerHeight - headerHeight - toolbarHeight - padding;
    return Math.max(minHeight, availableHeight);
  }, []);

  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.15;

  // Zoom handler
  const handleZoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    if (!fabricCanvas) return;
    
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    
    if (centerX !== undefined && centerY !== undefined) {
      fabricCanvas.zoomToPoint(new Point(centerX, centerY), newZoom);
    } else {
      const center = fabricCanvas.getCenter();
      fabricCanvas.zoomToPoint(new Point(center.left, center.top), newZoom);
    }
    
    setZoom(newZoom);
  }, [fabricCanvas, zoom]);

  // Reset view
  const handleResetView = useCallback(() => {
    if (!fabricCanvas) return;
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);
  }, [fabricCanvas]);

  // Mouse wheel zoom - unified with editor behavior
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleWheel = (opt: any) => {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();
      
      const delta = e.deltaY;
      let newZoom = fabricCanvas.getZoom();
      newZoom *= 0.999 ** delta;
      newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      
      const pointer = fabricCanvas.getViewportPoint(e);
      fabricCanvas.zoomToPoint(pointer, newZoom);
      setZoom(newZoom);
    };

    fabricCanvas.on('mouse:wheel', handleWheel);

    return () => {
      fabricCanvas.off('mouse:wheel', handleWheel);
    };
  }, [fabricCanvas]);

  // Pan handlers - unified with editor: Alt+click or middle mouse
  useEffect(() => {
    if (!fabricCanvas) return;

    let panning = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const handleMouseDown = (opt: any) => {
      const e = opt.e;
      // Pan with middle mouse button or Alt+click
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        panning = true;
        lastPosX = e.clientX;
        lastPosY = e.clientY;
        fabricCanvas.selection = false;
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grabbing';
        }
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!panning) return;
      const e = opt.e;
      const vpt = fabricCanvas.viewportTransform;
      if (vpt) {
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
        fabricCanvas.requestRenderAll();
      }
      lastPosX = e.clientX;
      lastPosY = e.clientY;
    };

    const handleMouseUp = () => {
      panning = false;
      fabricCanvas.selection = false;
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
    };

    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);

    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:up', handleMouseUp);
    };
  }, [fabricCanvas]);

  // Initialize canvas (needs to run after data load, when canvas is mounted)
  useEffect(() => {
    // While loading or editing, the view canvas isn't mounted
    if (isLoadingMapa || isLoadingUnidades || isEditing) return;

    if (!canvasRef.current || !containerRef.current) return;

    // Increment instance ID to invalidate any pending async operations
    canvasInstanceIdRef.current += 1;

    const container = containerRef.current;
    const initialHeight = calculateCanvasHeight();
    setCanvasHeight(initialHeight);
    
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.offsetWidth || 800,
      height: initialHeight,
      backgroundColor: '#1a1a2e',
      selection: false,
    });

    setFabricCanvas(canvas);

    const handleResize = () => {
      if (!containerRef.current) return;
      const newHeight = calculateCanvasHeight();
      setCanvasHeight(newHeight);
      canvas.setDimensions({
        width: containerRef.current.offsetWidth || 800,
        height: newHeight,
      });
      // Trigger re-render of map content
      setRenderKey(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    requestAnimationFrame(handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // Invalidate instance to prevent async operations from using disposed canvas
      canvasInstanceIdRef.current += 1;
      setFabricCanvas(null);
      // Dispose is async in Fabric v6, just call and don't await
      void canvas.dispose();
    };
  }, [empreendimentoId, mapa?.id, isLoadingMapa, isLoadingUnidades, isEditing, calculateCanvasHeight]);

  // Load background image and polygons (re-render on resize via renderKey)
  useEffect(() => {
    if (!fabricCanvas || !mapa?.imagem_url || isEditing) return;

    // Capture current instance ID to validate after async operation
    const currentInstanceId = canvasInstanceIdRef.current;
    const canvas = fabricCanvas;

    FabricImage.fromURL(mapa.imagem_url, { crossOrigin: 'anonymous' })
      .then((img) => {
        // Validate canvas is still the same instance
        if (canvasInstanceIdRef.current !== currentInstanceId) {
          return; // Canvas was disposed/recreated, abort
        }

        // Check if canvas context is still valid
        if (!canvas.lowerCanvasEl?.getContext('2d')) {
          return; // Canvas was disposed, abort silently
        }

        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const scale = Math.min(
          canvasWidth / (img.width || 1),
          canvasHeight / (img.height || 1)
        );

        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (canvasWidth - (img.width || 0) * scale) / 2,
          top: (canvasHeight - (img.height || 0) * scale) / 2,
          selectable: false,
          evented: false,
        });

        canvas.clear();
        canvas.add(img);
        canvas.sendObjectToBack(img);

        // Add shapes for units with coordinates (markers or polygons)
        if (unidades) {
          unidades.forEach((unidade) => {
            if (unidade.polygon_coords) {
              const coords = unidade.polygon_coords as PolygonCoords;
              if (coords.points && coords.points.length >= 1) {
                if (coords.points.length === 1) {
                  // Marker (single point = circle)
                  addMarkerToCanvas(canvas, unidade, coords, scale, img);
                } else if (coords.points.length >= 3) {
                  // Polygon (3+ points)
                  addPolygonToCanvas(canvas, unidade, coords, scale, img);
                }
              }
            }
          });
        }

        canvas.renderAll();
      })
      .catch((error) => {
        // Only show error if canvas is still valid (not disposed)
        if (canvasInstanceIdRef.current === currentInstanceId) {
          console.error('Error loading map image:', error);
          toast.error('Erro ao carregar imagem do mapa');
        }
      });
  }, [fabricCanvas, mapa?.imagem_url, unidades, isEditing, renderKey, labelFormato]);

  // Add marker (circle) to canvas
  const addMarkerToCanvas = (
    canvas: FabricCanvas,
    unidade: Unidade,
    coords: PolygonCoords,
    scale: number,
    backgroundImg: FabricImage
  ) => {
    const offsetX = backgroundImg.left || 0;
    const offsetY = backgroundImg.top || 0;
    const center = coords.points[0];
    const raio = coords.raio || 15;

    const marker = new Circle({
      left: center.x * scale + offsetX - raio,
      top: center.y * scale + offsetY - raio,
      radius: raio,
      fill: getPolygonColorWithOpacity(unidade.status, 0.9),
      stroke: 'transparent',
      strokeWidth: 0,
      selectable: false,
      hoverCursor: 'pointer',
    });
    const textShadow = new Shadow({
      color: 'rgba(0,0,0,0.8)',
      blur: 2,
      offsetX: 1,
      offsetY: 1,
    });

    const labelText = buildUnitLabel(unidade, labelFormato);
    const fontSize = calculateLabelFontSize(labelText, raio);
    const label = new FabricText(labelText, {
      left: center.x * scale + offsetX,
      top: center.y * scale + offsetY,
      fontSize,
      fill: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '300',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      shadow: textShadow,
    });

    canvas.add(marker);
    canvas.add(label);

    const unidadeId = unidade.id;

    marker.on('mousedown', () => {
      const clickedUnidade = unidades?.find((u) => u.id === unidadeId);
      if (clickedUnidade) {
        setSelectedUnidade(clickedUnidade);
      }
    });

    marker.on('mouseover', () => {
      marker.set({
        fill: getPolygonColorWithOpacity(unidade.status, 1.0),
      });
      canvas.renderAll();
    });

    marker.on('mouseout', () => {
      marker.set({
        fill: getPolygonColorWithOpacity(unidade.status, 0.9),
      });
      canvas.renderAll();
    });
  };

  // Add polygon to canvas
  const addPolygonToCanvas = (
    canvas: FabricCanvas,
    unidade: Unidade,
    coords: PolygonCoords,
    scale: number,
    backgroundImg: FabricImage
  ) => {
    const offsetX = backgroundImg.left || 0;
    const offsetY = backgroundImg.top || 0;

    const scaledPoints = coords.points.map((p) => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
    }));

    const polygon = new Polygon(scaledPoints, {
      fill: getPolygonColorWithOpacity(unidade.status, 0.9),
      stroke: 'transparent',
      strokeWidth: 0,
      selectable: false,
      hoverCursor: 'pointer',
    });

    // Add label
    const centerX = scaledPoints.reduce((sum, p) => sum + p.x, 0) / scaledPoints.length;
    const centerY = scaledPoints.reduce((sum, p) => sum + p.y, 0) / scaledPoints.length;

    const textShadow = new Shadow({
      color: 'rgba(0,0,0,0.8)',
      blur: 2,
      offsetX: 1,
      offsetY: 1,
    });

    const labelText = buildUnitLabel(unidade, labelFormato);
    const fontSize = calculateLabelFontSize(labelText);
    const label = new FabricText(labelText, {
      left: centerX,
      top: centerY,
      fontSize,
      fill: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '300',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      shadow: textShadow,
    });

    canvas.add(polygon);
    canvas.add(label);

    // Store reference to unidade for click handling
    const unidadeId = unidade.id;

    // Click handler
    polygon.on('mousedown', () => {
      const clickedUnidade = unidades?.find((u) => u.id === unidadeId);
      if (clickedUnidade) {
        setSelectedUnidade(clickedUnidade);
      }
    });

    // Hover effects
    polygon.on('mouseover', () => {
      polygon.set({
        fill: getPolygonColorWithOpacity(unidade.status, 1.0),
      });
      canvas.renderAll();
    });

    polygon.on('mouseout', () => {
      polygon.set({
        fill: getPolygonColorWithOpacity(unidade.status, 0.9),
      });
      canvas.renderAll();
    });
  };

  const handleMapaUpload = async (url: string, width: number, height: number) => {
    try {
      if (mapa) {
        await updateMapa.mutateAsync({
          id: mapa.id,
          empreendimentoId,
          data: { imagem_url: url, largura: width, altura: height },
        });
      } else {
        await createMapa.mutateAsync({
          empreendimentoId,
          data: { imagem_url: url, largura: width, altura: height },
        });
      }
    } catch (error) {
      console.error('Error saving map:', error);
    }
  };

  if (isLoadingMapa || isLoadingUnidades) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No map configured
  if (!mapa) {
    // In readonly mode, just show a simple message
    if (readonly) {
      return (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Map className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Mapa não configurado para este empreendimento.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // In edit mode, show upload form
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Configurar Mapa Interativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Faça upload da imagem do mapa do empreendimento para começar a marcar as unidades.
          </p>
          <MapaUpload empreendimentoId={empreendimentoId} onUploadComplete={handleMapaUpload} />
        </CardContent>
      </Card>
    );
  }

  // Editing mode
  if (isEditing && !readonly) {
    return (
      <MapaEditor
        empreendimentoId={empreendimentoId}
        mapa={mapa}
        unidades={unidades || []}
        labelFormato={labelFormato}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  // View mode
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleZoom(ZOOM_STEP)} title="Aumentar zoom">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleZoom(-ZOOM_STEP)} title="Diminuir zoom">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleResetView} title="Resetar visualização">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {Math.round(zoom * 100)}%
          </span>
          <span className="text-xs text-muted-foreground ml-4 flex items-center gap-1">
            <Move className="h-3 w-3" />
            Scroll para zoom • Alt+Arrastar para mover
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapaLegenda />
          {!readonly && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editar Mapa
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <div 
            ref={containerRef} 
            className="w-full"
            style={{ height: canvasHeight }}
          >
            <canvas ref={canvasRef} />
          </div>
        </CardContent>
      </Card>

      {/* Unit detail dialog */}
      <Dialog open={!!selectedUnidade} onOpenChange={() => setSelectedUnidade(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unidade {selectedUnidade?.numero}</DialogTitle>
            <DialogDescription>Detalhes da unidade selecionada</DialogDescription>
          </DialogHeader>
          {selectedUnidade && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  style={{ backgroundColor: getPolygonColor(selectedUnidade.status) }}
                  className="text-white"
                >
                  {UNIDADE_STATUS_LABELS[selectedUnidade.status]}
                </Badge>
              </div>

              {selectedUnidade.bloco && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Quadra/Bloco:</span>
                  <span>{selectedUnidade.bloco.nome}</span>
                </div>
              )}

              {selectedUnidade.tipologia && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Tipologia:</span>
                  <span>{selectedUnidade.tipologia.nome}</span>
                </div>
              )}

              {selectedUnidade.fachada && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Fachada:</span>
                    <span>{selectedUnidade.fachada.nome}</span>
                  </div>
                  {selectedUnidade.fachada.imagem_url && (
                    <img 
                      src={selectedUnidade.fachada.imagem_url} 
                      alt={selectedUnidade.fachada.nome}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  )}
                </div>
              )}

              {selectedUnidade.area_privativa && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Área:</span>
                  <span>{selectedUnidade.area_privativa} m²</span>
                </div>
              )}

              {selectedUnidade.valor && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Valor:</span>
                  <span>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(selectedUnidade.valor)}
                  </span>
                </div>
              )}

              {selectedUnidade.observacoes && (
                <div>
                  <span className="text-muted-foreground">Observações:</span>
                  <p className="mt-1">{selectedUnidade.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
