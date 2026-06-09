# React Novel Editor 集成指南

`src/lib/novel` 是可复用的 Tiptap runtime 入口，集中导出编辑器组件、扩展和工具函数。

## 基本用法

```tsx
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import type { JSONContent } from "@/lib/novel";

function Page() {
  const [content, setContent] = useState<JSONContent>(initialContent);
  const [saveStatus, setSaveStatus] = useState("已保存");

  return (
    <TailwindAdvancedEditor
      value={content}
      saveStatus={saveStatus}
      onChange={(value) => {
        setContent(value);
        setSaveStatus("未保存");
      }}
      onSave={({ json, html }) => {
        persist(json, html);
        setSaveStatus("已保存");
      }}
    />
  );
}
```

## 组件 API

`TailwindAdvancedEditor` 是受控组件：

- `value?: JSONContent | null`：文档内容；不传则使用内置示例内容。
- `editable?: boolean`：是否可编辑，默认 `true`。
- `extensions?: Extensions`：覆盖默认扩展集合。
- `saveStatus?: string`：保存状态文案，只负责展示。
- `onChange?: (value: JSONContent) => void`：内容变化时触发。
- `onSave?: ({ json, html }) => void`：内容停止变化后防抖触发，持久化由调用方处理。
- `onReady?: (editor) => void`：底层 Tiptap editor 创建后触发。

通过 `ref` 可读取底层实例：

```tsx
const editorRef = useRef<TailwindAdvancedEditorHandle>(null);
editorRef.current?.editor?.commands.focus();
```

## 必需样式

集成到其他 React/Next 项目时需要加载：

- `src/app/globals.css` 中的主题变量，尤其是 `--revision-inserted`、`--revision-deleted`、`--revision-original` 以及 `.dark` 下的暗色值。
- `src/styles/prosemirror.css`，包含 ProseMirror 基础样式、修订标记样式和 `discussion-highlight` 的 `.is-discussion-active`。
- Tailwind 配置需要启用 `darkMode: ["class"]`，并让 `content` 覆盖 `src/components` 与 `src/lib`。

## 导出入口

```ts
import {
  RevisionTracking,
  DiscussionHighlight,
  createPrefixedId,
  addCommentToRange,
  insertEditSuggestionAfterSelection,
} from "@/lib/novel";
```

ID 统一由 `createPrefixedId` 基于 `crypto.randomUUID()` 生成；修订、批注和编辑建议扩展都复用同一入口。
