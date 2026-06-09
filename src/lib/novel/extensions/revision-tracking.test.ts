import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  findMergeableInsertedRevision,
  resolveInsertedRevision,
  RevisionTracking,
} from "./revision-tracking";

let editor: Editor | null = null;

afterEach(() => {
  editor?.destroy();
  editor = null;
});

const makeEditor = (content: unknown) => {
  editor = new Editor({ extensions: [StarterKit, RevisionTracking], content: content as never });
  return editor;
};

const endOfFirstInserted = (instance: Editor): number | null => {
  let pos: number | null = null;

  instance.state.doc.descendants((node, nodePos) => {
    if (pos !== null) return false;

    if (
      node.isText &&
      node.marks.some((mark) => mark.type.name === "revision" && mark.attrs.role === "inserted")
    ) {
      pos = nodePos + node.nodeSize;
      return false;
    }

    return true;
  });

  return pos;
};

describe("findMergeableInsertedRevision", () => {
  it("returns the adjacent inserted revision attributes", () => {
    const instance = makeEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "原文" },
            {
              type: "text",
              marks: [{ type: "revision", attrs: { id: "rev-1", kind: "insert", role: "inserted" } }],
              text: "新增",
            },
          ],
        },
      ],
    });

    const pos = endOfFirstInserted(instance);

    expect(pos).not.toBeNull();
    expect(findMergeableInsertedRevision(instance.state, pos as number)?.id).toBe("rev-1");
  });

  it("returns null when the left side is not an inserted revision", () => {
    const instance = makeEditor({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "普通文本" }] }],
    });

    expect(findMergeableInsertedRevision(instance.state, 3)).toBeNull();
  });
});

describe("resolveInsertedRevision", () => {
  it("reuses id and kind when continuing an adjacent replacement revision", () => {
    const instance = makeEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "原文" },
            {
              type: "text",
              marks: [{ type: "revision", attrs: { id: "rev-x", kind: "replace", role: "inserted" } }],
              text: "替换内容",
            },
          ],
        },
      ],
    });

    const pos = endOfFirstInserted(instance) as number;
    const result = resolveInsertedRevision(instance.state, pos, true, false);

    expect(result.id).toBe("rev-x");
    expect(result.kind).toBe("replace");
  });

  it("creates a new inserted revision when allowMerge is false", () => {
    const instance = makeEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              marks: [{ type: "revision", attrs: { id: "rev-x", kind: "insert", role: "inserted" } }],
              text: "新增",
            },
          ],
        },
      ],
    });

    const pos = endOfFirstInserted(instance) as number;
    const result = resolveInsertedRevision(instance.state, pos, false, false);

    expect(result.id).not.toBe("rev-x");
    expect(result.kind).toBe("insert");
  });

  it("creates a replacement revision when there is no adjacent inserted revision", () => {
    const instance = makeEditor({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "普通" }] }],
    });

    const result = resolveInsertedRevision(instance.state, 3, true, true);

    expect(result.kind).toBe("replace");
  });
});
