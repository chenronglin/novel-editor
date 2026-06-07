"use client";

import { EditorBubble, EditorBubbleItem } from "@/lib/novel";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

interface SelectionMenuProps {
  children: ReactNode;
}

export default function SelectionMenu({ children }: SelectionMenuProps) {
  return (
    <EditorBubble
      tippyOptions={{
        placement: "top",
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      <EditorBubbleItem
        onSelect={(editor) => {
          editor.chain().focus().markSelectionAsDeletedRevision().run();
        }}
      >
        <Button className="gap-1 rounded-none text-red-600" variant="ghost" size="sm" type="button" title="删除">
          <Trash2 className="h-4 w-4" />
          删除
        </Button>
      </EditorBubbleItem>
      {children}
    </EditorBubble>
  );
}
