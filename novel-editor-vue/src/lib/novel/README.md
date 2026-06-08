# Novel Editor（可复用编辑器模块）

基于 TipTap v3 + Vue 3 的富文本编辑器，内置**修订追踪**（插入/删除/替换）、**批注**、**编辑建议**、**AI 高亮**，并带一个同步显示修订与批注的讨论侧边栏。

## 目录与文件清单

复用到其它项目时，需要带上以下文件：

```
src/lib/novel/
  id.ts                         # 统一 id 生成
  index.ts                      # 扩展/工具聚合入口
  extensions/
    index.ts                    # 扩展聚合（defaultExtensions 的来源）
    revision-tracking.ts        # 修订追踪（核心）
    comment.ts                  # 批注
    edit-suggestion.ts          # 编辑建议（块级 NodeView）
    EditSuggestionNodeView.vue
    discussion-highlight.ts     # 侧边栏联动高亮（Decoration）
    ai-highlight.ts
    active-block.ts             # 当前块高亮
    custom-keymap.ts

src/components/
  TailwindAdvancedEditor.vue    # 顶层组件（受控）
  DiscussionSidebar.vue         # 修订/批注侧边栏
  SelectionMenu.vue             # 选区气泡菜单
  extensions.ts                 # defaultExtensions 组装
  selectors/  ui/               # 气泡菜单用到的子组件
```

## 依赖

- 运行时：`vue@^3`、`@tiptap/core`、`@tiptap/pm`、`@tiptap/vue-3`、`@tiptap/starter-kit` 及用到的官方扩展（character-count、placeholder、highlight、text-style、color、underline）、`lucide-vue-next`、`clsx`、`tailwind-merge`
- 样式：`tailwindcss`、`@tailwindcss/typography`

## 样式要求（容易被忽略，必须一起带上）

1. **`src/styles/globals.css`** 中的 CSS 变量（shadcn 主题色 + 修订颜色）。其中修订颜色变量必须存在，且需在 `.dark` 下提供暗色值：
   - `--revision-inserted` / `--revision-deleted` / `--revision-original`
   - 以及 `--background`、`--muted`、`--ring` 等 shadcn 体系变量（组件类名 `bg-muted`、`text-muted-foreground` 等依赖它们）
2. **`src/styles/prosemirror.css`**：`.ProseMirror` 的排版、占位符、修订/批注/高亮的视觉样式。**没有它修订标记不会有颜色**。
3. **Tailwind 配置**：`darkMode: ["class"]`、启用 `@tailwindcss/typography`（组件用了 `prose` 类）、`content` 覆盖到组件与 lib 路径。

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";
import type { JSONContent } from "@tiptap/core";
import TailwindAdvancedEditor from "@/components/TailwindAdvancedEditor.vue";

const content = ref<JSONContent>();          // 也可从后端/本地加载
const saveStatus = ref("已保存");

const onUpdate = (value: JSONContent) => {
  content.value = value;
  saveStatus.value = "未保存";
};
const onSave = ({ json }: { json: JSONContent; html: string }) => {
  // 持久化交给调用方：存后端 / localStorage / ...
  saveStatus.value = "已保存";
};
</script>

<template>
  <TailwindAdvancedEditor
    :model-value="content"
    :save-status="saveStatus"
    @update:model-value="onUpdate"
    @save="onSave"
  />
</template>
```

### Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `modelValue` | `JSONContent \| null` | 文档内容，支持 `v-model`；不传则用内置示例 |
| `editable` | `boolean` | 是否可编辑，默认 `true` |
| `extensions` | `Extensions` | 覆盖默认扩展集合 |
| `saveStatus` | `string` | 保存状态文案（纯展示） |

### Emits

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `JSONContent` | 内容变化（v-model） |
| `save` | `{ json, html }` | 防抖后触发，由父组件持久化 |
| `ready` | `Editor` | 编辑器就绪，暴露实例 |

通过模板 ref 也可拿到底层实例：`editorRef.value.editor`（`defineExpose({ editor })`）。

## 注意事项

- **SSR / Nuxt**：内部用到 `crypto.randomUUID`，应用层范例用到 `window.localStorage` / `document`。在 Nuxt 下用 `<ClientOnly>` 或 `useEditor({ immediatelyRender: false })`。
- **粘贴**：为保证修订完整性，粘贴一律降级为纯文本并标记为"新增"（不保留富文本格式）。
- **后续可做**：将组件统一收敛到 `lib/novel/components/` 并发布为带 `peerDependencies` 的 npm 包；文案接入 i18n。
