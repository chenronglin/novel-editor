"use client";

import { type Editor, mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { Check, Handshake, PencilLine, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPrefixedId } from "../id";

interface EditSuggestionAttributes {
  id?: string | null;
  body: string;
  saved: boolean;
  createdAt?: string | null;
}

const createSuggestionId = () => createPrefixedId("suggestion");

const getSelectionTopLevelInsertPosition = (editor: Editor) => {
  const { selection } = editor.state;
  const { $to } = selection;

  if ($to.depth < 1) return selection.to;

  return $to.after(1);
};

const isSavedValue = (value: unknown) => value === true || value === "true";

export const insertEditSuggestionAfterSelection = (editor: Editor) => {
  if (editor.state.selection.empty) return false;

  const insertPosition = getSelectionTopLevelInsertPosition(editor);

  return editor
    .chain()
    .focus()
    .insertContentAt(insertPosition, {
      type: "editSuggestion",
      attrs: {
        id: createSuggestionId(),
        body: "",
        saved: false,
        createdAt: new Date().toISOString(),
      },
    })
    .run();
};

const EditSuggestionNodeView = ({ node, updateAttributes, deleteNode }: ReactNodeViewProps) => {
  const attrs = node.attrs as EditSuggestionAttributes;
  const body = attrs.body ?? "";
  const saved = isSavedValue(attrs.saved);
  const [draft, setDraft] = useState(() => body);
  const [isEditing, setIsEditing] = useState(() => !saved);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) return;

    textareaRef.current?.focus();
  }, [isEditing]);

  const saveSuggestion = () => {
    const nextBody = draft.trim();

    if (!nextBody) return;

    updateAttributes({
      body: nextBody,
      saved: true,
    });
    setIsEditing(false);
  };

  return (
    <NodeViewWrapper
      as="section"
      className="my-6 rounded-md border border-amber-300 bg-amber-50/85 shadow-sm"
      contentEditable={false}
      data-edit-suggestion-card=""
    >
      <div className="border-l-4 border-amber-400 px-5 py-4">
        <div className="flex items-center justify-between gap-3 border-b border-dashed border-amber-200 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Handshake className="h-4 w-4" />
            编辑建议
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {saved && !isEditing && (
              <button
                className="inline-flex h-8 items-center gap-1 rounded px-2 text-sm text-amber-700 transition-colors hover:bg-amber-100"
                type="button"
                onClick={() => {
                  setDraft(body);
                  setIsEditing(true);
                }}
              >
                <PencilLine className="h-4 w-4" />
                修改
              </button>
            )}
            <button
              className="inline-flex h-8 items-center gap-1 rounded px-2 text-sm text-red-500 transition-colors hover:bg-red-50"
              type="button"
              onClick={deleteNode}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="pt-3">
            <textarea
              ref={textareaRef}
              className="min-h-24 w-full resize-y rounded border border-amber-200 bg-white/80 px-3 py-2 text-sm leading-6 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              placeholder="输入编辑建议"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  saveSuggestion();
                }
              }}
            />
            <div className="mt-3 flex justify-end">
              <button
                className="inline-flex h-8 items-center gap-1 rounded bg-amber-500 px-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={!draft.trim()}
                onClick={saveSuggestion}
              >
                <Check className="h-4 w-4" />
                确认
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap pt-3 text-sm leading-7 text-muted-foreground">{body}</p>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const EditSuggestion = Node.create({
  name: "editSuggestion",

  group: "block",

  atom: true,

  selectable: false,

  draggable: false,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-suggestion-id"),
        renderHTML: (attributes) =>
          attributes.id
            ? {
                "data-suggestion-id": attributes.id,
              }
            : {},
      },
      body: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-suggestion-body") ?? element.textContent ?? "",
        renderHTML: (attributes) => ({
          "data-suggestion-body": attributes.body ?? "",
        }),
      },
      saved: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-suggestion-saved") === "true",
        renderHTML: (attributes) => ({
          "data-suggestion-saved": String(isSavedValue(attributes.saved)),
        }),
      },
      createdAt: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-suggestion-created-at"),
        renderHTML: (attributes) =>
          attributes.createdAt
            ? {
                "data-suggestion-created-at": attributes.createdAt,
              }
            : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "section[data-edit-suggestion]",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "section",
      mergeAttributes(HTMLAttributes, {
        "data-edit-suggestion": "",
      }),
      ["strong", {}, "编辑建议"],
      ["p", {}, node.attrs.body || ""],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EditSuggestionNodeView);
  },
});

export default EditSuggestion;
