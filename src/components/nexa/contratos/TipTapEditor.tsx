import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Undo, Redo } from 'lucide-react';

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
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const insertText = (text: string) => editor?.chain().focus().insertContent(text).run();

  return (
    <div className="border rounded-md bg-background">
      <div className="flex flex-wrap gap-1 border-b p-2">
        <Button type="button" size="sm" variant={editor?.isActive('bold') ? 'default' : 'ghost'} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant={editor?.isActive('italic') ? 'default' : 'ghost'} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant={editor?.isActive('heading', { level: 1 }) ? 'default' : 'ghost'} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant={editor?.isActive('heading', { level: 2 }) ? 'default' : 'ghost'} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant={editor?.isActive('bulletList') ? 'default' : 'ghost'} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant={editor?.isActive('orderedList') ? 'default' : 'ghost'} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => editor?.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => editor?.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
      </div>
      <EditorContent editor={editor} />
      {/* helper para acessar externamente */}
      <TipTapInsertHandle onInsert={insertText} />
    </div>
  );
}

// Component invisível que expõe a função insertText via evento customizado
function TipTapInsertHandle({ onInsert }: { onInsert: (t: string) => void }) {
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ text: string }>;
      if (ce.detail?.text) onInsert(ce.detail.text);
    };
    window.addEventListener('tiptap-insert', handler as EventListener);
    return () => window.removeEventListener('tiptap-insert', handler as EventListener);
  }, [onInsert]);
  return null;
}

export function insertIntoTipTap(text: string) {
  window.dispatchEvent(new CustomEvent('tiptap-insert', { detail: { text } }));
}
