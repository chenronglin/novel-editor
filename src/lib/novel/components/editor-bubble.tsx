import { isNodeSelection, useCurrentEditor } from "@tiptap/react";
import { BubbleMenu, type BubbleMenuProps } from "@tiptap/react/menus";
import { forwardRef, useMemo } from "react";
import type { ReactNode } from "react";

type LegacyTippyOptions = {
  placement?: NonNullable<BubbleMenuProps["options"]>["placement"];
  onHidden?: () => void;
};

export interface EditorBubbleProps extends Omit<BubbleMenuProps, "editor" | "children"> {
  readonly children: ReactNode;
  readonly tippyOptions?: LegacyTippyOptions;
}

export const EditorBubble = forwardRef<HTMLDivElement, EditorBubbleProps>(
  ({ children, tippyOptions, options, shouldShow: customShouldShow, ...rest }, ref) => {
    const { editor: currentEditor } = useCurrentEditor();

    const shouldShow: BubbleMenuProps["shouldShow"] = useMemo(
      () =>
        (props) => {
          if (customShouldShow) return customShouldShow(props);

          const { editor, state } = props;
          const { selection } = state;
          const { empty } = selection;

          if (!editor.isEditable || editor.isActive("image") || empty || isNodeSelection(selection)) {
            return false;
          }

          return true;
        },
      [customShouldShow],
    );

    if (!currentEditor) return null;

    return (
      <BubbleMenu
        ref={ref}
        editor={currentEditor}
        shouldShow={shouldShow}
        options={{
          placement: tippyOptions?.placement ?? options?.placement ?? "top",
          onHide: tippyOptions?.onHidden ?? options?.onHide,
          ...options,
        }}
        {...rest}
      >
        {children}
      </BubbleMenu>
    );
  },
);

EditorBubble.displayName = "EditorBubble";

export default EditorBubble;
