import {
  CharacterCount,
  Color,
  CustomKeymap,
  HighlightExtension,
  Placeholder,
  RevisionTracking,
  StarterKit,
  TextStyle,
  TiptapUnderline,
} from "@/lib/novel";

//You can overwrite the placeholder with your own configuration
const placeholder = Placeholder;

const starterKit = StarterKit.configure({
  heading: {
    levels: [1, 2, 3],
  },
  blockquote: false,
  bulletList: false,
  codeBlock: false,
  code: false,
  listItem: false,
  link: false,
  orderedList: false,
  underline: false,
  horizontalRule: false,
  dropcursor: {
    color: "#DBEAFE",
    width: 4,
  },
  gapcursor: false,
});

const characterCount = CharacterCount.configure();

export const defaultExtensions = [
  starterKit,
  placeholder,
  characterCount,
  RevisionTracking,
  TiptapUnderline,
  HighlightExtension,
  TextStyle,
  Color,
  CustomKeymap,
];
