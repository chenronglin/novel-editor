import { type Editor, Mark, mergeAttributes } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";
import { createPrefixedId } from "../id";

interface CommentRange {
  from: number;
  to: number;
}

interface CommentAttributes {
  id?: string;
  body: string;
  createdAt?: string;
  range?: CommentRange;
}

const createCommentId = () => createPrefixedId("comment");

const clampPosition = (state: EditorState, pos: number) => Math.max(0, Math.min(pos, state.doc.content.size));

const normalizeRange = (state: EditorState, from: number, to: number): CommentRange => ({
  from: clampPosition(state, Math.min(from, to)),
  to: clampPosition(state, Math.max(from, to)),
});

export const addCommentToRange = (editor: Editor, attributes: CommentAttributes) => {
  const body = attributes.body.trim();
  const range = attributes.range ?? editor.state.selection;
  const { from, to } = normalizeRange(editor.state, range.from, range.to);

  if (!body || from === to) return false;

  const markType = editor.state.schema.marks.comment;

  if (!markType) return false;

  const mark = markType.create({
    id: attributes.id ?? createCommentId(),
    body,
    createdAt: attributes.createdAt ?? new Date().toISOString(),
  });
  const tr = editor.state.tr.addMark(from, to, mark);

  tr.setSelection(TextSelection.create(tr.doc, to));
  editor.view.dispatch(tr.scrollIntoView());
  editor.view.focus();

  return true;
};

export const Comment = Mark.create({
  name: "comment",

  inclusive: false,

  excludes: "",

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-id"),
        renderHTML: (attributes) =>
          attributes.id
            ? {
                "data-comment-id": attributes.id,
              }
            : {},
      },
      body: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-body"),
        renderHTML: (attributes) =>
          attributes.body
            ? {
                "data-comment-body": attributes.body,
                title: attributes.body,
              }
            : {},
      },
      createdAt: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-created-at"),
        renderHTML: (attributes) =>
          attributes.createdAt
            ? {
                "data-comment-created-at": attributes.createdAt,
              }
            : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-comment-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

export default Comment;
