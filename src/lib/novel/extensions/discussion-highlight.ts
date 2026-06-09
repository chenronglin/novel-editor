import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

interface DiscussionHighlightState {
  activeId: string | null;
}

const discussionHighlightKey = new PluginKey<DiscussionHighlightState>("discussion-highlight");

export const setActiveDiscussion = (editor: Editor, id: string | null) => {
  const current = discussionHighlightKey.getState(editor.state)?.activeId ?? null;

  if (current === id) return;

  editor.view.dispatch(editor.state.tr.setMeta(discussionHighlightKey, { activeId: id }));
};

export const DiscussionHighlight = Extension.create({
  name: "discussionHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin<DiscussionHighlightState>({
        key: discussionHighlightKey,
        state: {
          init: () => ({ activeId: null }),
          apply(tr, value) {
            const meta = tr.getMeta(discussionHighlightKey) as DiscussionHighlightState | undefined;

            return meta ?? value;
          },
        },
        props: {
          decorations(state) {
            const activeId = discussionHighlightKey.getState(state)?.activeId ?? null;

            if (!activeId) return null;

            const decorations: Decoration[] = [];

            state.doc.descendants((node, pos) => {
              if (!node.isText) return;

              const matches = node.marks.some(
                (mark) =>
                  (mark.type.name === "revision" || mark.type.name === "comment") &&
                  mark.attrs.id === activeId,
              );

              if (matches) {
                decorations.push(Decoration.inline(pos, pos + node.nodeSize, { class: "is-discussion-active" }));
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export default DiscussionHighlight;
