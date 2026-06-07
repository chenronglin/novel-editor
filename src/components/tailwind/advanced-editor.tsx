"use client";
import { defaultEditorContent } from "@/lib/content";
import {
  EditorContent,
  type EditorInstance,
  EditorRoot,
  type JSONContent,
} from "@/lib/novel";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { defaultExtensions } from "./extensions";
import DiscussionSidebar from "./discussion-sidebar";
import { ColorSelector } from "./selectors/color-selector";
import { NodeSelector } from "./selectors/node-selector";
import { Separator } from "./ui/separator";

import SelectionMenu from "./selection-menu";
import { TextButtons } from "./selectors/text-buttons";

const extensions = [...defaultExtensions];
const initialContent = defaultEditorContent as JSONContent;

const TailwindAdvancedEditor = () => {
  const [editor, setEditor] = useState<EditorInstance | null>(null);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [charsCount, setCharsCount] = useState<number>();

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);

  const debouncedUpdates = useDebouncedCallback(async (editor: EditorInstance) => {
    const json = editor.getJSON();
    setCharsCount(editor.storage.characterCount.words());
    window.localStorage.setItem("html-content", editor.getHTML());
    window.localStorage.setItem("novel-content", JSON.stringify(json));
    setSaveStatus("Saved");
  }, 500);

  return (
    <div className="relative w-full max-w-screen-2xl px-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-w-0">
          <div className="absolute right-5 top-5 z-10 flex gap-2">
            <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">{saveStatus}</div>
            <div className={charsCount ? "rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground" : "hidden"}>
              {charsCount} Words
            </div>
          </div>
          <EditorRoot>
            <EditorContent
              initialContent={initialContent}
              extensions={extensions}
              className="relative min-h-[500px] w-full border-muted bg-background sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg"
              editorProps={{
                attributes: {
                  class:
                    "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
                },
              }}
              onCreate={({ editor }) => {
                setEditor(editor);
                setCharsCount(editor.storage.characterCount.words());
              }}
              onDestroy={() => {
                setEditor(null);
              }}
              onUpdate={({ editor }) => {
                debouncedUpdates(editor);
                setSaveStatus("Unsaved");
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
};

export default TailwindAdvancedEditor;
