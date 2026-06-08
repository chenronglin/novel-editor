import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const activeBlockKey = new PluginKey<boolean>("active-block");

const getSelectionBlockRange = (state: Parameters<NonNullable<Plugin["props"]["decorations"]>>[0]) => {
  const { selection } = state;
  const { $from } = selection;

  if ($from.depth < 1) return null;

  return {
    from: $from.before(1),
    to: $from.after(1),
  };
};

export const ActiveBlock = Extension.create({
  name: "activeBlock",

  addProseMirrorPlugins() {
    return [
      new Plugin<boolean>({
        key: activeBlockKey,
        state: {
          init: () => false,
          apply: (tr, value) => {
            const meta = tr.getMeta(activeBlockKey);

            return typeof meta === "boolean" ? meta : value;
          },
        },
        props: {
          decorations: (state) => {
            const isFocused = activeBlockKey.getState(state);
            const range = getSelectionBlockRange(state);

            if (!isFocused || !range) return null;

            return DecorationSet.create(state.doc, [
              Decoration.node(range.from, range.to, {
                class: "is-active-block",
              }),
            ]);
          },
          handleDOMEvents: {
            focus: (view) => {
              view.dispatch(view.state.tr.setMeta(activeBlockKey, true));
              return false;
            },
            blur: (view) => {
              view.dispatch(view.state.tr.setMeta(activeBlockKey, false));
              return false;
            },
          },
        },
      }),
    ];
  },
});

export default ActiveBlock;
