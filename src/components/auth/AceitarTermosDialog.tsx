import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConfiguracao } from '@/hooks/useConfiguracoesSistema';
import { useRegistrarAceite } from '@/hooks/useTermosAceite';
import { toast } from 'sonner';
import { FileText, Shield, Loader2 } from 'lucide-react';

interface AceitarTermosDialogProps {
  open: boolean;
  onAccepted: () => void;
}

export function AceitarTermosDialog({ open, onAccepted }: AceitarTermosDialogProps) {
  const { data: termos, isLoading: loadingTermos } = useConfiguracao('termos_uso');
  const { data: politica, isLoading: loadingPolitica } = useConfiguracao('politica_privacidade');
  const registrarAceite = useRegistrarAceite();
  
  const handleConfirmar = async () => {
    try {
      await registrarAceite.mutateAsync(['termos_uso', 'politica_privacidade']);
      toast.success('Termos aceitos com sucesso!');
      onAccepted();
    } catch (error) {
      console.error('Erro ao registrar aceite:', error);
      toast.error('Erro ao registrar aceite. Tente novamente.');
    }
  };
  
  const isLoading = loadingTermos || loadingPolitica;
  
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Aceite dos Termos
          </DialogTitle>
          <DialogDescription>
            Para continuar utilizando o sistema, você precisa ler e aceitar os termos atualizados.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Tabs defaultValue="termos" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="termos" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Termos de Uso
                </TabsTrigger>
                <TabsTrigger value="politica" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Política de Privacidade
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="termos" className="flex-1 min-h-0 mt-4">
                <ScrollArea className="h-[350px] border rounded-md p-4 bg-muted/30">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: termos?.valor || '<p>Termos de uso não configurados.</p>' }}
                  />
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="politica" className="flex-1 min-h-0 mt-4">
                <ScrollArea className="h-[350px] border rounded-md p-4 bg-muted/30">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: politica?.valor || '<p>Política de privacidade não configurada.</p>' }}
                  />
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Ao clicar em "Aceitar e Continuar", você confirma que leu e concorda com os Termos de Uso e a Política de Privacidade do sistema.
              </p>
            </div>
          </>
        )}
        
        <DialogFooter>
          <Button 
            onClick={handleConfirmar}
            disabled={registrarAceite.isPending}
            className="w-full"
            size="lg"
          >
            {registrarAceite.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Li e Aceito os Termos - Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
