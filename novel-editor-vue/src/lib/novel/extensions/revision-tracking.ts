import { Mark, mergeAttributes } from "@tiptap/core";
import type { Mark as ProseMirrorMark, Slice } from "@tiptap/pm/model";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { EditorState, Selection, Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { createPrefixedId } from "../id";

type RevisionKind = "insert" | "delete" | "replace";
type RevisionRole = "inserted" | "deleted" | "original";

interface RevisionAttributes {
  id: string;
  kind: RevisionKind;
  role: RevisionRole;
}

interface TextRange {
  from: number;
  to: number;
}

interface CompositionBase extends TextRange {
  slice: Slice;
}

interface RevisionPluginState {
  lastId: string | null;
  lastPos: number | null;
}

const revisionTrackingKey = new PluginKey<RevisionPluginState>("revision-tracking");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    revisionTracking: {
      /**
       * Mark the current text selection as a deleted revision without removing it.
       */
      markSelectionAsDeletedRevision: () => ReturnType;
    };
  }
}

const createRevisionId = () => createPrefixedId("rev");

const clampPosition = (state: EditorState, pos: number) => Math.max(0, Math.min(pos, state.doc.content.size));

const normalizeRange = (state: EditorState, from: number, to: number): TextRange => {
  const safeFrom = clampPosition(state, Math.min(from, to));
  const safeTo = clampPosition(state, Math.max(from, to));

  return { from: safeFrom, to: safeTo };
};

const rangeFromSelection = (state: EditorState, selection: Selection): TextRange =>
  normalizeRange(state, selection.from, selection.to);

const domSelectionFromRoot = (view: EditorView) => {
  const root = view.root;

  if ("getSelection" in root) {
    return root.getSelection();
  }

  return document.getSelection();
};

const posFromDOM = (view: EditorView, node: Node | null, offset: number, bias: number) => {
  if (!node) return null;

  try {
    return view.posAtDOM(node, offset, bias);
  } catch {
    if (node === view.dom) {
      return offset <= 0 ? 0 : view.state.doc.content.size;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const childCount = node.childNodes.length;
      const safeOffset = Math.max(0, Math.min(offset, childCount));

      try {
        return view.posAtDOM(node, safeOffset, bias);
      } catch {
        return null;
      }
    }

    return null;
  }
};

const rangeFromDOMSelection = (view: EditorView): TextRange | null => {
  const selection = domSelectionFromRoot(view);

  if (!selection?.anchorNode || !selection.focusNode) return null;

  const anchor = posFromDOM(view, selection.anchorNode, selection.anchorOffset, -1);
  const head = posFromDOM(view, selection.focusNode, selection.focusOffset, 1);

  if (anchor == null || head == null) return null;

  return normalizeRange(view.state, anchor, head);
};

const captureRange = (view: EditorView): TextRange => {
  const domRange = rangeFromDOMSelection(view);

  if (domRange) return domRange;

  return rangeFromSelection(view.state, view.state.selection);
};

const rangeContainsText = (state: EditorState, range: TextRange) => {
  let hasText = false;

  state.doc.nodesBetween(range.from, range.to, (node) => {
    if (node.isText && Boolean(node.text)) {
      hasText = true;
      return false;
    }

    return !hasText;
  });

  return hasText;
};

const getRevisionMarkType = (state: EditorState) => state.schema.marks.revision;

const createRevisionMark = (state: EditorState, attributes: RevisionAttributes) =>
  getRevisionMarkType(state)?.create(attributes) ?? null;

const isRevisionMark = (mark: ProseMirrorMark): mark is ProseMirrorMark & { attrs: RevisionAttributes } =>
  mark.type.name === "revision";

const isInsertedRevisionMark = (mark: ProseMirrorMark): mark is ProseMirrorMark & { attrs: RevisionAttributes } =>
  isRevisionMark(mark) &&
  mark.attrs.role === "inserted" &&
  (mark.attrs.kind === "insert" || mark.attrs.kind === "replace");

// 光标左侧若紧邻一段 role="inserted" 的修订，则返回其属性，用于把"贴着上一段继续输入"归并到同一修订。
// 只看 nodeBefore：连续输入时光标始终在已输入文本的右侧，nodeBefore 已覆盖全部正确合并场景。
export const findMergeableInsertedRevision = (state: EditorState, pos: number): RevisionAttributes | null => {
  if (pos <= 0 || pos > state.doc.content.size) return null;

  const mark = state.doc.resolve(pos).nodeBefore?.marks.find(isInsertedRevisionMark);

  return mark ? mark.attrs : null;
};

// 决定一次插入应归属的修订 id 与 kind。
// 关键：复用相邻修订时必须连同它的 kind 一起复用——否则同一 id 下混入不同 kind（如"替换后紧接着续写"被判成 insert），
// 会让本应连成一段的文本因 mark 不一致而无法合并，侧边栏按 kind 渲染时也会丢字。
// 复用来源唯一为"文档邻接"（光标左侧紧邻的 inserted 修订），它天然携带正确的 id 与 kind，比易失的 plugin state 更可靠。
export const resolveInsertedRevision = (
  state: EditorState,
  from: number,
  allowMerge: boolean,
  isReplacement: boolean,
): { id: string; kind: RevisionKind } => {
  if (allowMerge) {
    const existing = findMergeableInsertedRevision(state, from);

    if (existing) return { id: existing.id, kind: existing.kind };
  }

  return { id: createRevisionId(), kind: isReplacement ? "replace" : "insert" };
};

const getTypingMarks = (state: EditorState) => {
  const marks = state.storedMarks ?? state.selection.$from.marks();

  return marks.filter((mark) => mark.type.name !== "revision");
};

const createMarkedText = (state: EditorState, text: string, revisionMark: ProseMirrorMark) => {
  const marks = revisionMark.addToSet(getTypingMarks(state));

  return state.schema.text(text, marks);
};

const applyInsertedText = (
  view: EditorView,
  text: string,
  range: TextRange,
  options: { allowMerge: boolean; forceReplace?: boolean } = { allowMerge: true },
) => {
  if (!text) return false;

  const { state } = view;
  const isReplacement = options.forceReplace === true || range.from !== range.to;
  const { id, kind: insertedKind } = resolveInsertedRevision(
    state,
    range.from,
    !isReplacement && options.allowMerge,
    isReplacement,
  );

  const insertedMark = createRevisionMark(state, {
    id,
    kind: insertedKind,
    role: "inserted",
  });

  if (!insertedMark) return false;

  const tr = state.tr;
  const textNode = createMarkedText(state, text, insertedMark);

  tr.insert(range.from, textNode);

  const insertedTo = range.from + textNode.nodeSize;

  if (isReplacement && rangeContainsText(state, range)) {
    const originalMark = createRevisionMark(state, {
      id,
      kind: insertedKind,
      role: "original",
    });

    if (!originalMark) return false;

    const originalFrom = tr.mapping.map(range.from, 1);
    const originalTo = tr.mapping.map(range.to, 1);

    tr.addMark(originalFrom, originalTo, originalMark);
  }

  tr.setSelection(TextSelection.create(tr.doc, insertedTo));
  tr.setMeta(revisionTrackingKey, {
    id,
    kind: insertedKind,
    role: "inserted",
    from: range.from,
    to: insertedTo,
  });

  view.dispatch(tr.scrollIntoView());

  return true;
};

const markDeletedRange = (state: EditorState, range: TextRange, dispatch?: (tr: Transaction) => void) => {
  if (range.from === range.to || !rangeContainsText(state, range)) return false;

  const pluginState = revisionTrackingKey.getState(state);

  let id: string;
  if (pluginState?.lastId && (range.from === pluginState.lastPos || range.to === pluginState.lastPos)) {
    id = pluginState.lastId;
  } else {
    id = createRevisionId();
  }

  const mark = createRevisionMark(state, {
    id,
    kind: "delete",
    role: "deleted",
  });

  if (!mark) return false;

  const tr = state.tr.addMark(range.from, range.to, mark);

  tr.setSelection(TextSelection.create(tr.doc, range.from));
  tr.setMeta(revisionTrackingKey, {
    id,
    kind: "delete",
    role: "deleted",
    from: range.from,
    to: range.to,
  });

  dispatch?.(tr.scrollIntoView());

  return true;
};

// 粘贴一律取纯文本：修订追踪只跟踪纯文本插入，含 HTML 的粘贴也降级为纯文本，
// 以保证粘贴内容同样被标记为"新增"（代价是丢弃富文本格式，这在修订场景通常是期望行为）。
// 仅当剪贴板内容为文件（图片等）时放行，交给默认处理。
const plainTextFromClipboard = (event: ClipboardEvent) => {
  const clipboardData = event.clipboardData;

  if (!clipboardData || clipboardData.files.length > 0) return null;

  return clipboardData.getData("text/plain");
};

const finalizeComposition = (view: EditorView, base: CompositionBase) => {
  const { state } = view;
  const insertedFrom = clampPosition(state, base.from);
  const insertedTo = clampPosition(state, state.selection.from);
  const insertedRange = normalizeRange(state, insertedFrom, insertedTo);

  if (insertedRange.from === insertedRange.to) return;

  const isReplacement = base.from !== base.to;
  const { id, kind: insertedKind } = resolveInsertedRevision(
    state,
    insertedRange.from,
    !isReplacement,
    isReplacement,
  );

  const insertedMark = createRevisionMark(state, {
    id,
    kind: insertedKind,
    role: "inserted",
  });

  if (!insertedMark) return;

  const tr = state.tr.addMark(insertedRange.from, insertedRange.to, insertedMark);
  const cursorPos = insertedRange.to;

  if (isReplacement && base.slice.size > 0) {
    const originalMark = createRevisionMark(state, {
      id,
      kind: insertedKind,
      role: "original",
    });

    if (!originalMark) return;

    const originalFrom = insertedRange.to;
    const originalTo = originalFrom + base.slice.size;

    tr.replace(originalFrom, originalFrom, base.slice);
    tr.addMark(originalFrom, originalTo, originalMark);
  }

  tr.setSelection(TextSelection.create(tr.doc, cursorPos));
  tr.setMeta(revisionTrackingKey, {
    id,
    kind: insertedKind,
    role: "inserted",
    from: insertedRange.from,
    to: cursorPos,
    composition: true,
  });

  view.dispatch(tr.scrollIntoView());
};

export const RevisionTracking = Mark.create({
  name: "revision",

  inclusive: false,

  excludes: "revision",

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-revision-id"),
        renderHTML: (attributes) =>
          attributes.id
            ? {
                "data-revision-id": attributes.id,
              }
            : {},
      },
      kind: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-revision-kind"),
        renderHTML: (attributes) =>
          attributes.kind
            ? {
                "data-revision-kind": attributes.kind,
              }
            : {},
      },
      role: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-revision-role"),
        renderHTML: (attributes) =>
          attributes.role
            ? {
                "data-revision-role": attributes.role,
              }
            : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-revision-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      markSelectionAsDeletedRevision:
        () =>
        ({ state, dispatch }) => {
          return markDeletedRange(state, rangeFromSelection(state, state.selection), dispatch);
        },
    };
  },

  addProseMirrorPlugins() {
    let isComposing = false;
    let compositionBase: CompositionBase | null = null;
    let compositionTimer: ReturnType<typeof setTimeout> | null = null;

    return [
      new Plugin({
        key: revisionTrackingKey,
        state: {
          init() {
            return {
              lastId: null,
              lastPos: null,
            };
          },
          apply(tr, value, _oldState, newState) {
            if (tr.selectionSet && !tr.docChanged && !tr.getMeta(revisionTrackingKey)) {
              return { lastId: null, lastPos: null };
            }

            const meta = tr.getMeta(revisionTrackingKey);
            if (meta && meta.id) {
              const lastPos = meta.kind === "delete" ? meta.from : meta.to;
              return {
                lastId: meta.id,
                lastPos: lastPos,
              };
            }

            if (tr.docChanged) {
              return {
                lastId: value.lastId,
                lastPos: newState.selection.from,
              };
            }

            return value;
          },
        },
        props: {
          handleTextInput: (view, from, to, text) => {
            if (isComposing || view.composing) return false;

            return applyInsertedText(view, text, normalizeRange(view.state, from, to));
          },
          handlePaste: (view, event) => {
            if (isComposing || view.composing) return false;

            const text = plainTextFromClipboard(event);

            if (!text) return false;

            return applyInsertedText(view, text, rangeFromSelection(view.state, view.state.selection), {
              allowMerge: false,
            });
          },
          handleDOMEvents: {
            compositionstart: (view) => {
              const range = captureRange(view);

              isComposing = true;
              compositionBase = {
                ...range,
                slice: view.state.doc.slice(range.from, range.to),
              };

              if (compositionTimer) {
                clearTimeout(compositionTimer);
                compositionTimer = null;
              }

              return false;
            },
            compositionend: (view) => {
              const base = compositionBase;

              if (!base) {
                isComposing = false;
                return false;
              }

              compositionTimer = setTimeout(() => {
                isComposing = false;
                finalizeComposition(view, base);

                if (compositionBase === base) {
                  compositionBase = null;
                }
              }, 0);

              return false;
            },
          },
        },
      }),
    ];
  },
});

export default RevisionTracking;
