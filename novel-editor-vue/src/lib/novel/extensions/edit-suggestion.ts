import { type Editor, mergeAttributes, Node } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import EditSuggestionNodeView from "./EditSuggestionNodeView.vue";

let suggestionCounter = 0;

const createSuggestionId = () => {
  suggestionCounter += 1;
  return `suggestion-${Date.now().toString(36)}-${suggestionCounter.toString(36)}`;
};

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
    return VueNodeViewRenderer(EditSuggestionNodeView);
  },
});

export default EditSuggestion;
