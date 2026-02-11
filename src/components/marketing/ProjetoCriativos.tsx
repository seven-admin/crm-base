import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Trash2, Star, ExternalLink, Loader2, Link2, Plus } from 'lucide-react';
import { useTicketCriativos } from '@/hooks/useTicketCriativos';
import type { TicketCriativo } from '@/types/marketing.types';

interface ProjetoCriativosProps {
  projetoId: string;
}

export function ProjetoCriativos({ projetoId }: ProjetoCriativosProps) {
  const {
    criativos,
    isLoading,
    addLink,
    deleteCriativo,
    toggleFinal,
  } = useTicketCriativos(projetoId);

  const [deleteTarget, setDeleteTarget] = useState<TicketCriativo | null>(null);

  // Estado do dialog de link
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkNome, setLinkNome] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCriativo.mutateAsync(deleteTarget);
    setDeleteTarget(null);
  };

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return;
    await addLink.mutateAsync({ nome: linkNome.trim() || undefined, url: linkUrl.trim() });
    setLinkNome('');
    setLinkUrl('');
    setShowLinkForm(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Links</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {criativos.length} {criativos.length === 1 ? 'link' : 'links'}
            </p>
          </div>
          <Button onClick={() => setShowLinkForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Link
          </Button>
        </CardHeader>
        <CardContent>
          {criativos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum link cadastrado</p>
              <p className="text-sm">Clique em "Adicionar Link" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {criativos.map((criativo) => (
                <LinkCard
                  key={criativo.id}
                  criativo={criativo}
                  onOpenLink={() => handleOpenLink(criativo.url)}
                  onDelete={() => setDeleteTarget(criativo)}
                  onToggleFinal={() =>
                    toggleFinal.mutate({ id: criativo.id, is_final: !criativo.is_final })
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir link</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCriativo.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de adicionar link */}
      <Dialog open={showLinkForm} onOpenChange={setShowLinkForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-nome">Nome (opcional)</Label>
              <Input
                id="link-nome"
                placeholder="Ex: Drive com arquivos"
                value={linkNome}
                onChange={(e) => setLinkNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL *</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddLink}
              disabled={!linkUrl.trim() || addLink.isPending}
            >
              {addLink.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface LinkCardProps {
  criativo: TicketCriativo;
  onOpenLink: () => void;
  onDelete: () => void;
  onToggleFinal: () => void;
}

function LinkCard({
  criativo,
  onOpenLink,
  onDelete,
  onToggleFinal,
}: LinkCardProps) {
  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
      {/* Thumbnail - Ícone de link */}
      <div
        className="w-full h-full cursor-pointer flex items-center justify-center"
        onClick={onOpenLink}
      >
        <Link2 className="h-12 w-12 text-muted-foreground" />
      </div>

      {/* Badge Final */}
      {criativo.is_final && (
        <Badge
          className="absolute top-2 left-2 bg-accent text-accent-foreground hover:bg-accent"
        >
          <Star className="h-3 w-3 mr-1 fill-current" />
          FINAL
        </Badge>
      )}

      {/* Overlay com ações */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFinal();
          }}
          title={criativo.is_final ? 'Remover marcação' : 'Marcar como final'}
        >
          <Star className={`h-4 w-4 ${criativo.is_final ? 'fill-accent text-accent' : ''}`} />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onOpenLink();
          }}
          title="Abrir em nova aba"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Nome do link */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-xs text-white truncate" title={criativo.nome || undefined}>
          {criativo.nome || 'Sem nome'}
        </p>
      </div>
    </div>
  );
}
