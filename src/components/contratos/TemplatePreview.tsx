import { Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CONTRATO_VARIAVEIS } from '@/types/contratos.types';
import type { ContratoTemplate } from '@/types/contratos.types';

interface TemplatePreviewProps {
  template: ContratoTemplate;
  onClose: () => void;
  open?: boolean;
}

export function TemplatePreview({ template, onClose, open = true }: TemplatePreviewProps) {
  const getPreviewContent = () => {
    let preview = template.conteudo_html;
    CONTRATO_VARIAVEIS.forEach((v) => {
      const regex = new RegExp(`\\{\\{${v.key}\\}\\}`, 'g');
      preview = preview.replace(regex, `<span class="bg-primary/20 text-primary px-1 rounded font-medium">${v.example}</span>`);
    });
    return preview;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${template.nome}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1, h2, h3 { margin-top: 20px; }
            p { margin: 10px 0; }
          </style>
        </head>
        <body>
          ${getPreviewContent().replace(/<span class="[^"]*">([^<]*)<\/span>/g, '$1')}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([template.conteudo_html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.nome.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-4 border-b">
          <div>
            <DialogTitle>{template.nome}</DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {template.empreendimento?.nome || 'Global'}
              </Badge>
              <Badge variant={template.is_active ? 'default' : 'secondary'}>
                {template.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
              <Download className="h-4 w-4 mr-1" />
              HTML
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-0 min-h-0">
          <ScrollArea className="h-full max-h-[calc(90vh-120px)]">
            <div className="p-6 bg-white min-h-full">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
              />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
