import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import ActiveBlock from "./active-block";
import Comment from "./comment";
import CustomKeymap from "./custom-keymap";
import EditSuggestion from "./edit-suggestion";
import RevisionTracking from "./revision-tracking";
import DiscussionHighlight from "./discussion-highlight";

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
export * from "./active-block";
export * from "./comment";
export * from "./edit-suggestion";
export * from "./revision-tracking";
export * from "./discussion-highlight";
export {
  ActiveBlock,
  EditSuggestion,
  PlaceholderExtension as Placeholder,
  StarterKit,
  TextStyle,
  Color,
  HighlightExtension,
  CustomKeymap,
  CharacterCount,
  RevisionTracking,
  DiscussionHighlight,
  Comment,
};
