import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, Heading3, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Table as TableIcon, Minus, Quote,
} from 'lucide-react';

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
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[500px] p-6 focus:outline-none',
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
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal"><Minus className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().insertContent('<div style="page-break-before: always"></div>').run()} title="Quebra de página">
          <span className="text-[10px] font-bold">PG</span>
        </ToolbarButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer"><Undo className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refazer"><Redo className="h-4 w-4" /></ToolbarButton>
      </div>
      <EditorContent editor={editor} />
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

export function insertIntoTipTap(text: string) {
  window.dispatchEvent(new CustomEvent('tiptap-insert', { detail: { text } }));
}

export function insertHtmlIntoTipTap(html: string) {
  window.dispatchEvent(new CustomEvent('tiptap-insert', { detail: { html } }));
}
