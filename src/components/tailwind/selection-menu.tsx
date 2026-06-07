"use client";

import { EditorBubble, EditorBubbleItem } from "@/lib/novel";
import type { EditorInstance } from "@/lib/novel";
import { addCommentToRange } from "@/lib/novel/extensions/comment";
import { insertEditSuggestionAfterSelection } from "@/lib/novel/extensions/edit-suggestion";
import { Handshake, MessageSquarePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

interface SelectionMenuProps {
  children: ReactNode;
}

interface PendingComment {
  editor: EditorInstance;
  from: number;
  to: number;
}

export default function SelectionMenu({ children }: SelectionMenuProps) {
  const [pendingComment, setPendingComment] = useState<PendingComment | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!pendingComment) return;

    textareaRef.current?.focus();
  }, [pendingComment]);

  const closeCommentDialog = () => {
    setPendingComment(null);
    setCommentDraft("");
    setCommentError("");
  };

  const saveComment = () => {
    const body = commentDraft.trim();

    if (!body || !pendingComment) return;

    const didSave = addCommentToRange(pendingComment.editor, {
      body,
      range: {
        from: pendingComment.from,
        to: pendingComment.to,
      },
    });

    if (!didSave) {
      setCommentError("批注保存失败，请重新选择文本后再试。");
      return;
    }

    closeCommentDialog();
  };

  return (
    <>
      <EditorBubble
        tippyOptions={{
          placement: "top",
        }}
        className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
      >
        <EditorBubbleItem
          onSelect={(editor) => {
            const { from, to, empty } = editor.state.selection;

            if (empty) return;

            setPendingComment({ editor, from, to });
            setCommentError("");
          }}
        >
          <Button className="gap-1 rounded-none text-amber-700" variant="ghost" size="sm" type="button" title="批注">
            <MessageSquarePlus className="h-4 w-4" />
            批注
          </Button>
        </EditorBubbleItem>
        <EditorBubbleItem
          onSelect={(editor) => {
            insertEditSuggestionAfterSelection(editor);
          }}
        >
          <Button className="gap-1 rounded-none text-amber-700" variant="ghost" size="sm" type="button" title="建议">
            <Handshake className="h-4 w-4" />
            建议
          </Button>
        </EditorBubbleItem>
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
      {pendingComment && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCommentDialog();
          }}
        >
          <div
            aria-labelledby="comment-dialog-title"
            aria-modal="true"
            className="w-full max-w-md rounded-md border bg-background p-4 text-foreground shadow-2xl"
            role="dialog"
          >
            <h2 id="comment-dialog-title" className="text-base font-semibold">
              添加批注
            </h2>
            <textarea
              ref={textareaRef}
              className="mt-3 min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="输入批注内容"
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeCommentDialog();
                }

                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  saveComment();
                }
              }}
            />
            {commentError && <p className="mt-2 text-sm text-red-600">{commentError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={closeCommentDialog}>
                取消
              </Button>
              <Button type="button" disabled={!commentDraft.trim()} onClick={saveComment}>
                确认
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
