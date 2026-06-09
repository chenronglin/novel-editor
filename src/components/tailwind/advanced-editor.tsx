"use client";
import { defaultEditorContent } from "@/lib/content";
import {
  EditorContent,
  type EditorInstance,
  EditorRoot,
  type JSONContent,
} from "@/lib/novel";
import type { Extensions } from "@tiptap/core";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { defaultExtensions } from "./extensions";
import DiscussionSidebar from "./discussion-sidebar";
import { ColorSelector } from "./selectors/color-selector";
import { NodeSelector } from "./selectors/node-selector";
import { Separator } from "./ui/separator";

import SelectionMenu from "./selection-menu";
import { TextButtons } from "./selectors/text-buttons";

const editorExtensions = [...defaultExtensions];

export interface TailwindAdvancedEditorHandle {
  editor: EditorInstance | null;
}

export interface TailwindAdvancedEditorProps {
  value?: JSONContent | null;
  editable?: boolean;
  extensions?: Extensions;
  saveStatus?: string;
  onChange?: (value: JSONContent) => void;
  onSave?: (payload: { json: JSONContent; html: string }) => void;
  onReady?: (editor: EditorInstance) => void;
}

const isSameContent = (editor: EditorInstance, value: JSONContent) => {
  try {
    return JSON.stringify(editor.getJSON()) === JSON.stringify(value);
  } catch {
    return false;
  }
};

const TailwindAdvancedEditor = forwardRef<TailwindAdvancedEditorHandle, TailwindAdvancedEditorProps>(
  (
    {
      value,
      editable = true,
      extensions = editorExtensions,
      saveStatus,
      onChange,
      onSave,
      onReady,
    },
    ref,
  ) => {
    const [editor, setEditor] = useState<EditorInstance | null>(null);
    const [charsCount, setCharsCount] = useState<number>();
    const initialContentRef = useRef<JSONContent>((value ?? defaultEditorContent) as JSONContent);

    const [openNode, setOpenNode] = useState(false);
    const [openColor, setOpenColor] = useState(false);

    useImperativeHandle(ref, () => ({ editor }), [editor]);

    useEffect(() => {
      editor?.setEditable(editable);
    }, [editable, editor]);

    useEffect(() => {
      if (!editor || value == null || isSameContent(editor, value)) return;

      editor.commands.setContent(value, { emitUpdate: false });
      setCharsCount(editor.storage.characterCount.characters());
    }, [editor, value]);

    const debouncedSave = useDebouncedCallback((editor: EditorInstance) => {
      onSave?.({ json: editor.getJSON(), html: editor.getHTML() });
    }, 500);

    return (
      <div className="relative w-full max-w-screen-2xl px-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative min-w-0">
            <div className="absolute right-5 top-5 z-10 flex gap-2">
              {saveStatus ? (
                <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">{saveStatus}</div>
              ) : null}
              <div className={charsCount ? "rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground" : "hidden"}>
                {charsCount} 字
              </div>
            </div>
            <EditorRoot>
              <EditorContent
                initialContent={initialContentRef.current}
                extensions={extensions}
                className="relative min-h-[500px] w-full border-muted bg-background sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg"
                editable={editable}
                editorProps={{
                  attributes: {
                    class:
                      "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
                  },
                }}
                onCreate={({ editor }) => {
                  setEditor(editor);
                  setCharsCount(editor.storage.characterCount.characters());
                  onReady?.(editor);
                }}
                onDestroy={() => {
                  setEditor(null);
                }}
                onUpdate={({ editor }) => {
                  const json = editor.getJSON();

                  setCharsCount(editor.storage.characterCount.characters());
                  onChange?.(json);
                  debouncedSave(editor);
                }}
              >
                <SelectionMenu>
                  <Separator orientation="vertical" />
                  <NodeSelector open={openNode} onOpenChange={setOpenNode} />
                  <Separator orientation="vertical" />
                  <TextButtons />
                  <Separator orientation="vertical" />
                  <ColorSelector open={openColor} onOpenChange={setOpenColor} />
                </SelectionMenu>
              </EditorContent>
            </EditorRoot>
          </div>
          <DiscussionSidebar editor={editor} />
        </div>
      </div>
    );
  },
);

TailwindAdvancedEditor.displayName = "TailwindAdvancedEditor";

export default TailwindAdvancedEditor;
