import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  RevisionTracking,
  findMergeableInsertedRevision,
  resolveInsertedRevision,
} from "./revision-tracking";

// 说明：使用无 DOM 挂载的 headless Editor 构造 EditorState 来测试纯决策函数。
// 若某环境下 StarterKit 的 headless 创建有问题，可改用最小扩展集（document/paragraph/text）。
let editor: Editor | null = null;

afterEach(() => {
  editor?.destroy();
  editor = null;
});

const makeEditor = (content: unknown) => {
  editor = new Editor({ extensions: [StarterKit, RevisionTracking], content: content as never });
  return editor;
};

// 找到第一个带 inserted 修订 mark 的文本节点的结束位置（避免硬编码偏移）。
const endOfFirstInserted = (e: Editor): number | null => {
  let pos: number | null = null;
  e.state.doc.descendants((node, p) => {
    if (pos !== null) return false;
    if (
      node.isText &&
      node.marks.some((mark) => mark.type.name === "revision" && mark.attrs.role === "inserted")
    ) {
      pos = p + node.nodeSize;
      return false;
    }
    return true;
  });
  return pos;
};

describe("findMergeableInsertedRevision", () => {
  it("光标紧贴已插入修订时返回该修订属性", () => {
    const e = makeEditor({
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

    const pos = endOfFirstInserted(e);
    expect(pos).not.toBeNull();
    expect(findMergeableInsertedRevision(e.state, pos as number)?.id).toBe("rev-1");
  });

  it("光标左侧不是插入修订时返回 null", () => {
    const e = makeEditor({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "普通文本" }] }],
    });

    expect(findMergeableInsertedRevision(e.state, 3)).toBeNull();
  });
});

describe("resolveInsertedRevision", () => {
  it("续写紧邻的替换修订时，沿用其 id 与 kind（关键回归：避免同一修订内混入 insert）", () => {
    const e = makeEditor({
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

    const pos = endOfFirstInserted(e) as number;
    const result = resolveInsertedRevision(e.state, pos, true, false);

    expect(result.id).toBe("rev-x");
    expect(result.kind).toBe("replace");
  });

  it("allowMerge=false 时总是新建（如粘贴 / 替换）", () => {
    const e = makeEditor({
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

    const pos = endOfFirstInserted(e) as number;
    const result = resolveInsertedRevision(e.state, pos, false, false);

    expect(result.id).not.toBe("rev-x");
    expect(result.kind).toBe("insert");
  });

  it("无相邻插入修订时新建；替换输入得到 kind=replace", () => {
    const e = makeEditor({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "普通" }] }],
    });

    const result = resolveInsertedRevision(e.state, 3, true, true);
    expect(result.kind).toBe("replace");
  });
});
