import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import CustomKeymap from "./custom-keymap";
import RevisionTracking from "./revision-tracking";

import CharacterCount from "@tiptap/extension-character-count";

const PlaceholderExtension = Placeholder.configure({
  placeholder: ({ node }) => {
    if (node.type.name === "heading") {
      return `Heading ${node.attrs.level}`;
    }
    return "开始写作";
  },
  includeChildren: true,
});

const HighlightExtension = Highlight.configure({
  multicolor: true,
});

export * from "./ai-highlight";
export * from "./revision-tracking";
export {
  PlaceholderExtension as Placeholder,
  StarterKit,
  TiptapUnderline,
  TextStyle,
  Color,
  HighlightExtension,
  CustomKeymap,
  CharacterCount,
  RevisionTracking,
};
