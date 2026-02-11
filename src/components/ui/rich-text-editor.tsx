import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect, useCallback } from 'react';
import { Button } from './button';
import { Toggle } from './toggle';
import { Separator } from './separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Code,
  Undo,
  Redo,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Variable {
  key: string;
  label: string;
  example?: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variables?: Variable[];
  className?: string;
  minHeight?: string;
}

function EditorToolbar({ editor, variables, onInsertVariable }: { 
  editor: Editor | null; 
  variables?: Variable[];
  onInsertVariable?: (key: string) => void;
}) {
  if (!editor) return null;

  const addLink = useCallback(() => {
    const url = window.prompt('URL do link:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('URL da imagem:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  return (
    <div className="rich-text-toolbar flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
      {/* Undo/Redo */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Desfazer"
      >
        <Undo className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Refazer"
      >
        <Redo className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text formatting */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Negrito"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Itálico"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Sublinhado"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Tachado"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="Título 1"
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Título 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="Título 3"
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('paragraph')}
        onPressedChange={() => editor.chain().focus().setParagraph().run()}
        aria-label="Parágrafo"
      >
        <Pilcrow className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Lista"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        aria-label="Alinhar à esquerda"
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        aria-label="Centralizar"
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        aria-label="Alinhar à direita"
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'justify' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
        aria-label="Justificar"
      >
        <AlignJustify className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Insert elements */}
      <Toggle
        size="sm"
        pressed={editor.isActive('link')}
        onPressedChange={addLink}
        aria-label="Inserir link"
      >
        <LinkIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={addImage}
        aria-label="Inserir imagem"
      >
        <ImageIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={addTable}
        aria-label="Inserir tabela"
      >
        <TableIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('codeBlock')}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        aria-label="Bloco de código"
      >
        <Code className="h-4 w-4" />
      </Toggle>

      {/* Variables dropdown */}
      {variables && variables.length > 0 && onInsertVariable && (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                <Code className="h-3 w-3" />
                Variáveis
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 max-h-80 overflow-auto" align="start">
              <div className="space-y-1">
                {variables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => onInsertVariable(v.key)}
                    className="w-full text-left p-2 rounded hover:bg-accent text-sm transition-colors"
                  >
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">{`{{${v.key}}}`}</code>
                    <span className="ml-2 text-muted-foreground">{v.label}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite o conteúdo aqui...',
  variables,
  className,
  minHeight = '300px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border w-full',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 bg-muted font-semibold',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-text-content prose prose-sm max-w-none focus:outline-none',
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  const insertVariable = useCallback((key: string) => {
    if (editor) {
      editor.chain().focus().insertContent(`{{${key}}}`).run();
    }
  }, [editor]);

  return (
    <div className={cn('rich-text-editor border rounded-md overflow-hidden bg-background flex flex-col', className)}>
      <EditorToolbar 
        editor={editor} 
        variables={variables} 
        onInsertVariable={insertVariable}
      />
      <div className="p-4 flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
