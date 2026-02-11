import { useState } from 'react';
import { Download, FileText, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

interface ExportarPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conteudoHtml: string;
  nomeArquivo?: string;
  // Dados para carimbo digital (opcional - usado quando contrato está assinado)
  signatarios?: Array<{
    nome: string;
    cpf?: string;
    data_assinatura?: string;
    ip_assinatura?: string;
  }>;
}

// Gera hash SHA-256 do conteúdo
async function gerarHashConteudo(conteudo: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(conteudo);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Gera código de verificação curto
function gerarCodigoVerificacao(hash: string): string {
  return hash.substring(0, 8).toUpperCase();
}

// Sanitiza HTML removendo imagens com caminhos locais que causam erro no html2canvas
function sanitizarHtmlParaPdf(html: string): string {
  if (!html) return '';
  
  // Remove imagens com src de caminhos locais (file://, C:\, /Users/, blob:, data:image muito grandes)
  let sanitized = html
    // Remove imagens com file://
    .replace(/<img[^>]+src=["']file:\/\/[^"']*["'][^>]*>/gi, '')
    // Remove imagens com caminhos Windows (C:\, D:\, etc.)
    .replace(/<img[^>]+src=["'][A-Za-z]:\\[^"']*["'][^>]*>/gi, '')
    // Remove imagens com caminhos Unix absolutos para Users/home
    .replace(/<img[^>]+src=["']\/(?:Users|home)\/[^"']*["'][^>]*>/gi, '')
    // Remove imagens blob que podem não estar mais disponíveis
    .replace(/<img[^>]+src=["']blob:[^"']*["'][^>]*>/gi, '');
  
  return sanitized;
}

export function ExportarPdfDialog({
  open,
  onOpenChange,
  conteudoHtml,
  nomeArquivo = 'contrato',
  signatarios,
}: ExportarPdfDialogProps) {
  const [tamanho, setTamanho] = useState<'a4' | 'letter'>('a4');
  const [orientacao, setOrientacao] = useState<'portrait' | 'landscape'>('portrait');
  const [margens, setMargens] = useState('20');
  const [fileName, setFileName] = useState(nomeArquivo);
  const [isExporting, setIsExporting] = useState(false);
  const [incluirCarimbo, setIncluirCarimbo] = useState(true);

  const handleExport = async () => {
    if (!conteudoHtml) {
      toast.error('Nenhum conteúdo para exportar');
      return;
    }

    setIsExporting(true);

    try {
      // Sanitizar HTML removendo imagens problemáticas
      const conteudoSanitizado = sanitizarHtmlParaPdf(conteudoHtml);
      
      if (!conteudoSanitizado.trim()) {
        toast.error('O conteúdo do contrato está vazio após sanitização');
        setIsExporting(false);
        return;
      }

      // Gerar hash e código de verificação
      const hash = await gerarHashConteudo(conteudoSanitizado);
      const codigoVerificacao = gerarCodigoVerificacao(hash);
      const dataGeracao = new Date().toLocaleString('pt-BR');

      // Gera carimbo digital se habilitado
      let carimboHtml = '';
      if (incluirCarimbo) {
        const assinaturasHtml = signatarios?.filter(s => s.data_assinatura).map(s => `
          <tr>
            <td style="padding: 4px 8px; border: 1px solid #ddd;">${s.nome}</td>
            <td style="padding: 4px 8px; border: 1px solid #ddd;">${s.cpf || '-'}</td>
            <td style="padding: 4px 8px; border: 1px solid #ddd;">${s.data_assinatura ? new Date(s.data_assinatura).toLocaleString('pt-BR') : '-'}</td>
            <td style="padding: 4px 8px; border: 1px solid #ddd;">${s.ip_assinatura || '-'}</td>
          </tr>
        `).join('') || '';

        carimboHtml = `
          <div style="margin-top: 40px; padding: 20px; border: 2px solid #333; background: #f9f9f9; page-break-inside: avoid;">
            <h3 style="margin: 0 0 12px; font-size: 14pt; color: #333; border-bottom: 1px solid #333; padding-bottom: 8px;">
              CERTIFICADO DE AUTENTICIDADE DIGITAL
            </h3>
            <p style="margin: 8px 0; font-size: 10pt; color: #555;">
              Este documento foi assinado eletronicamente e possui validade jurídica conforme MP 2.200-2/2001.
            </p>
            <div style="display: flex; gap: 20px; margin: 12px 0;">
              <div style="flex: 1;">
                <p style="margin: 4px 0; font-size: 9pt;"><strong>Código de Verificação:</strong> ${codigoVerificacao}</p>
                <p style="margin: 4px 0; font-size: 9pt;"><strong>Hash SHA-256:</strong> ${hash.substring(0, 32)}...</p>
                <p style="margin: 4px 0; font-size: 9pt;"><strong>Data de Geração:</strong> ${dataGeracao}</p>
              </div>
            </div>
            ${signatarios && signatarios.some(s => s.data_assinatura) ? `
              <h4 style="margin: 16px 0 8px; font-size: 11pt;">Registro de Assinaturas:</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                <thead>
                  <tr style="background: #eee;">
                    <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left;">Signatário</th>
                    <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left;">CPF</th>
                    <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left;">Data/Hora</th>
                    <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left;">IP</th>
                  </tr>
                </thead>
                <tbody>
                  ${assinaturasHtml}
                </tbody>
              </table>
            ` : ''}
          </div>
        `;
      }

      // Create a container with proper styling - NÃO adicionar ao DOM
      const container = document.createElement('div');
      container.style.width = tamanho === 'a4' ? '210mm' : '216mm';
      container.style.background = 'white';
      container.innerHTML = `
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12pt; line-height: 1.6; color: #333; }
          h1 { font-size: 18pt; font-weight: bold; margin-bottom: 12pt; }
          h2 { font-size: 16pt; font-weight: bold; margin-bottom: 10pt; }
          h3 { font-size: 14pt; font-weight: bold; margin-bottom: 8pt; }
          p { margin-bottom: 8pt; text-align: justify; }
          table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
          th, td { border: 1px solid #ccc; padding: 8pt; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .page-break { page-break-after: always; }
          img { max-width: 100%; height: auto; }
        </style>
        <div style="padding: ${margens}mm; background: white; color: #333;">
          ${conteudoSanitizado}
          ${carimboHtml}
        </div>
      `;

      const opt = {
        margin: parseInt(margens),
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          logging: false,
          backgroundColor: '#ffffff',
          // Força renderização com dimensões corretas
          width: tamanho === 'a4' ? 794 : 816,
          windowWidth: tamanho === 'a4' ? 794 : 816,
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: tamanho, 
          orientation: orientacao,
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      // NÃO adicionar ao DOM - passar diretamente para html2pdf
      await html2pdf().set(opt).from(container).save();

      toast.success('PDF gerado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar Contrato como PDF
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação do documento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Nome do Arquivo</Label>
            <div className="flex gap-2">
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="contrato"
              />
              <span className="flex items-center text-muted-foreground">.pdf</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tamanho do Papel</Label>
              <Select value={tamanho} onValueChange={(v) => setTamanho(v as 'a4' | 'letter')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="letter">Carta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Margens (mm)</Label>
              <Input
                type="number"
                value={margens}
                onChange={(e) => setMargens(e.target.value)}
                min="0"
                max="50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Orientação</Label>
            <RadioGroup value={orientacao} onValueChange={(v) => setOrientacao(v as 'portrait' | 'landscape')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="portrait" id="portrait" />
                  <Label htmlFor="portrait" className="font-normal cursor-pointer">
                    Retrato
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="landscape" id="landscape" />
                  <Label htmlFor="landscape" className="font-normal cursor-pointer">
                    Paisagem
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t">
            <Checkbox 
              id="incluirCarimbo" 
              checked={incluirCarimbo}
              onCheckedChange={(checked) => setIncluirCarimbo(checked === true)}
            />
            <Label htmlFor="incluirCarimbo" className="font-normal cursor-pointer flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Incluir carimbo de autenticidade digital
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Gerar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
