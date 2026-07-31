import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { Node, Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, Heading3, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Table as TableIcon, Minus, Quote, Image as ImageIcon,
  Columns3, Rows3, Trash2, ChevronDown,
} from 'lucide-react';

// Bloco opcional do contrato: preserva o wrapper <div data-bloco-nome> ao salvar,
// para que a geração possa detectá-lo e permitir incluí-lo ou não (ver contratoNumeracao).
const BlocoContrato = Node.create({
  name: 'blocoContrato',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      nome: {
        default: '',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-bloco-nome'),
        renderHTML: (attrs) => (attrs.nome ? { 'data-bloco-nome': attrs.nome } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-bloco-nome]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'contrato-bloco' }), 0];
  },
});

// Marca de tamanho de fonte — renderiza <span style="font-size:…"> e sobrevive ao
// salvar, sem depender de @tiptap/extension-text-style.
const FontSize = Mark.create({
  name: 'fontSize',
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
        renderHTML: (attrs) => (attrs.size ? { style: `font-size:${attrs.size}` } : {}),
      },
    };
  },
  parseHTML() {
    return [{ style: 'font-size', getAttrs: (v) => (v ? {} : false) }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ commands }: any) =>
          size ? commands.setMark('fontSize', { size }) : commands.unsetMark('fontSize'),
    } as any;
  },
});

const TAMANHOS_FONTE = ['10px', '12px', '14px', '16px', '18px', '24px', '32px'];

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TipTapEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || 'Digite o conteúdo do contrato…' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'contrato-table' } }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: false, HTMLAttributes: { class: 'contrato-img', style: 'max-width:100%' } }),
      BlocoContrato,
      FontSize,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] p-6 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ text?: string; html?: string }>;
      if (ce.detail?.html) editor.chain().focus().insertContent(ce.detail.html).run();
      else if (ce.detail?.text) editor.chain().focus().insertContent(ce.detail.text).run();
    };
    window.addEventListener('tiptap-insert', handler as EventListener);
    return () => window.removeEventListener('tiptap-insert', handler as EventListener);
  }, [editor]);

  if (!editor) {
    return (
      <div className="min-h-[500px] rounded-[1.25rem] border border-border/70 bg-card p-6 text-sm text-muted-foreground">
        Carregando editor…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-card">
      <div className="flex flex-wrap gap-0.5 border-b p-2 items-center sticky top-0 bg-background z-10">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito"><Bold className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico"><Italic className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Sublinhado"><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Título 1"><Heading1 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título 2"><Heading2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título 3"><Heading3 className="h-4 w-4" /></ToolbarButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="ghost" className="h-8 px-1.5" title="Tamanho da fonte">
              <span className="text-xs">A</span><ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => (editor.chain().focus() as any).setFontSize('').run()}>Padrão</DropdownMenuItem>
            {TAMANHOS_FONTE.map((s) => (
              <DropdownMenuItem key={s} onClick={() => (editor.chain().focus() as any).setFontSize(s).run()}>
                <span style={{ fontSize: s }}>{parseInt(s, 10)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinhar à esquerda"><AlignLeft className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centralizar"><AlignCenter className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinhar à direita"><AlignRight className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificar"><AlignJustify className="h-4 w-4" /></ToolbarButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista"><List className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada"><ListOrdered className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citação"><Quote className="h-4 w-4" /></ToolbarButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton onClick={() => insertLink(editor)} active={editor.isActive('link')} title="Link"><LinkIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Inserir tabela"><TableIcon className="h-4 w-4" /></ToolbarButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button" size="sm"
              variant={editor.isActive('table') ? 'default' : 'ghost'}
              disabled={!editor.isActive('table')}
              title="Editar tabela"
              className="h-8 px-1.5"
            >
              <TableIcon className="h-4 w-4" /><ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}><Columns3 className="h-4 w-4 mr-2" />Coluna à esquerda</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}><Columns3 className="h-4 w-4 mr-2" />Coluna à direita</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}><Trash2 className="h-4 w-4 mr-2" />Remover coluna</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}><Rows3 className="h-4 w-4 mr-2" />Linha acima</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}><Rows3 className="h-4 w-4 mr-2" />Linha abaixo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}><Trash2 className="h-4 w-4 mr-2" />Remover linha</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Alternar cabeçalho</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().mergeOrSplit().run()}>Mesclar / dividir células</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir tabela</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolbarButton onClick={() => insertImage(editor)} title="Inserir imagem"><ImageIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal"><Minus className="h-4 w-4" /></ToolbarButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().insertContent('<h3><strong>CLÁUSULA [[clausula]]ª – </strong></h3>').run()} title="Cláusula (numeração automática)">
          <span className="text-[10px] font-bold">Cláus.</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().insertContent('[[item]] ').run()} title="Item numerado (ex.: 1.1)">
          <span className="text-[10px] font-bold">Item</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().insertContent('<div style="page-break-before: always"></div>').run()} title="Quebra de página">
          <span className="text-[10px] font-bold">PG</span>
        </ToolbarButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer"><Undo className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refazer"><Redo className="h-4 w-4" /></ToolbarButton>
      </div>
      <div className="max-h-[55vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  children, onClick, active, title,
}: { children: React.ReactNode; onClick: () => void; active?: boolean; title?: string }) {
  return (
    <Button
      type="button" size="sm"
      variant={active ? 'default' : 'ghost'}
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );
}

function insertLink(editor: Editor) {
  const prev = editor.getAttributes('link').href;
  const url = window.prompt('URL:', prev || 'https://');
  if (url === null) return;
  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

function insertImage(editor: Editor) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop();
      const path = `contratos/img-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('empreendimentos-midias').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('empreendimentos-midias').getPublicUrl(path);
      editor.chain().focus().setImage({ src: publicUrl }).run();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar imagem');
    }
  };
  input.click();
}

export function insertIntoTipTap(text: string) {
  window.dispatchEvent(new CustomEvent('tiptap-insert', { detail: { text } }));
}

export function insertHtmlIntoTipTap(html: string) {
  window.dispatchEvent(new CustomEvent('tiptap-insert', { detail: { html } }));
}
