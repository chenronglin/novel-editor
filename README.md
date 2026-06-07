# Novel Editor Next 16 Example

这个目录是后续编辑器迁移和实验的主工作区。它把原项目里的 `TailwindAdvancedEditor` 移植到一个独立的 Next.js 16 + React 19 + Tiptap 3 示例应用中，用来验证新版运行时、继续演进编辑器 UI，并为未来迁入其他 Next.js 项目做准备。

当前示例不是 npm package，也没有加入仓库根目录的 pnpm workspace。它是一个独立应用，所有命令都应在 `example/` 目录内执行。

## 技术栈

- Next.js `16.2.7`
- React `19.2.7`
- React DOM `19.2.7`
- Tiptap `3.26.0`
- TypeScript `5.9.3`
- Tailwind CSS `3.4.19`
- Radix UI + shadcn 风格基础组件
- ProseMirror / Tiptap extensions

Tailwind 这里刻意使用 v3，而不是 create-next-app 默认的 Tailwind v4。原因是原 `TailwindAdvancedEditor`、`prosemirror.css` 和 shadcn 风格 CSS 变量都按 Tailwind 3 模式组织，v3 能最大程度复用原样式。

## 快速开始

```bash
npm install
npm run dev
```

打开：

```txt
http://localhost:3001
```

常用检查命令：

```bash
pnpm lint
pnpm typecheck
pnpm build
```

生产预览：

```bash
pnpm build
pnpm start
```

## 当前功能

已经移植并验证的基础编辑器能力：

- 默认中文内容渲染
- Tiptap 富文本编辑
- 本地 `localStorage` 保存 HTML、JSON、Markdown 文本
- `Saved` / `Unsaved` 状态
- 字数统计
- Slash command 菜单
- 标题、正文、待办、列表、引用、代码块
- 图片插入和粘贴
- 图片以本地 `data:image/...` 预览，不依赖上传 API
- YouTube 嵌入命令
- 选中文本后的 bubble menu
- 删除修订标记
- 节点类型选择
- 链接编辑
- 数学公式标记
- 粗体、斜体、下划线、删除线、行内代码
- 文本颜色和高亮背景
- KaTeX 样式
- 代码高亮

验证截图保存在：

```txt
example/editor-verification.jpg
```

## 暂未迁移的能力

这些能力是有意先不迁移，不是遗漏：

- AI 菜单
- `/api/generate`
- OpenAI / Vercel AI SDK route
- Vercel Blob 上传
- Upstash rate limit
- `next-themes` 主题菜单
- Twitter/X embed 扩展
- `GlobalDragHandle`

当前目标是先把 Next 16 + React 19 + Tiptap 3 的基础编辑器跑稳。AI、真实上传、协作、发布形态可以后续逐步加回来。

## 目录结构

```txt
example/
  src/app/
    page.tsx              # 示例首页，直接渲染编辑器
    layout.tsx            # 全局 CSS、KaTeX、字体和 metadata
    globals.css           # Tailwind 入口、主题变量、代码高亮样式

  src/components/tailwind/
    advanced-editor.tsx   # 从原项目迁移来的编辑器主组件
    extensions.ts         # 示例使用的 Tiptap extension 组合
    slash-command.tsx     # Slash command 菜单项
    image-upload.ts       # 本地 data URL 图片上传适配
    selection-menu.tsx    # 非 AI 的选区 bubble menu
    selectors/            # 节点、链接、数学、文本按钮、颜色选择器
    ui/                   # shadcn 风格基础 UI 组件

  src/lib/novel/
    components/           # 私有 EditorRoot、EditorContent、Bubble、Command
    extensions/           # 私有 Tiptap extensions
    plugins/              # 图片 paste/drop/upload plugin
    utils/                # URL、Markdown、Jotai store 等工具
    index.ts              # 私有 Novel runtime 统一导出

  src/lib/
    content.ts            # 默认编辑器内容
    utils.ts              # cn()

  src/styles/
    prosemirror.css       # ProseMirror 和编辑器节点样式
```

## 关键迁移设计

### 1. 独立示例应用

`example/` 自带 `package.json`、`pnpm-lock.yaml` 和 `pnpm-workspace.yaml`，不依赖根 workspace，也不发布 package。这样可以安全地升级 Next、React、Tiptap，而不影响原项目。

### 2. 私有 `@/lib/novel` 运行时

原项目的 `packages/headless` 被复制并改造成 `src/lib/novel`。组件层仍然通过：

```ts
import { EditorRoot, EditorContent } from "@/lib/novel";
```

这样后续迁到其他 Next.js 项目时，可以直接复制 `src/lib/novel` 和 `src/components/tailwind`，不需要先发布 npm 包。

### 3. Tiptap 3 适配

迁移时做了几处重要适配：

- `EditorProvider` 设置 `immediatelyRender={false}`，避免 Next SSR/客户端初始化冲突。
- `EditorProvider` 设置 `shouldRerenderOnTransaction={true}`，保证 toolbar active state 能随选区刷新。
- `BubbleMenu` 改用 `@tiptap/react/menus`。
- 旧的 `tippyOptions.placement/onHidden` 在 `EditorBubble` 内部映射到 Tiptap 3 的 Floating UI `options`。
- `StarterKit` 禁用重复扩展，避免 `image`、`codeBlock` 等 extension name 冲突。
- 图片扩展合并了上传 placeholder 和 `width/height` 属性，保持 resize 能力。

### 4. 图片上传先走本地预览

`image-upload.ts` 现在把图片读成 data URL：

```ts
const readAsDataUrl = (file: File) => Promise<string>;
```

这样可以验证编辑器图片链路，不需要 `/api/upload`、Vercel Blob 或环境变量。后续接真实上传时，只需要替换 `onUpload`。

### 5. AI 暂时从 UI 中拿掉

原来的 `GenerativeMenuSwitch` 被 `SelectionMenu` 替换。现在 bubble menu 保留基础编辑操作和删除修订，不显示 Ask AI。

后续恢复 AI 时，建议作为独立阶段处理：

- 升级到当前 AI SDK API
- 新增 `/api/generate`
- 给 AI 菜单增加可配置开关
- 避免把服务端 API 假设硬编码进编辑器核心

## 开发约定

后续优先在 `example/` 中工作：

- 新编辑器功能先落到 `src/components/tailwind`
- Tiptap runtime 能力先落到 `src/lib/novel`
- 样式变量和全局编辑器样式放在 `src/app/globals.css` 或 `src/styles/prosemirror.css`
- 不要从根项目的 `packages/headless` 直接 import
- 不要把 `example/` 加入根 workspace，除非明确决定要统一 monorepo 管理
- 新增能力后至少跑 `pnpm typecheck` 和 `pnpm build`

建议每次较大的编辑器改动后都验证：

```bash
pnpm lint
pnpm typecheck
pnpm build
```

并在浏览器里检查：

- 默认内容渲染
- 输入和保存状态
- Slash command
- Bubble menu
- 图片粘贴
- Console 是否有新的运行时错误

## 常见问题

### 为什么不是 Tailwind v4？

当前迁移目标是保真 `TailwindAdvancedEditor`。原样式大量依赖 Tailwind 3、Typography 插件、`@apply` 和 shadcn CSS 变量。直接上 Tailwind v4 会让样式迁移和编辑器迁移耦在一起，风险更高。

### 为什么 `pnpm-workspace.yaml` 里禁用了 sharp build？

`pnpm@11` 会要求显式审批依赖 build scripts。这个示例不依赖 Next 图片优化的 native `sharp` 构建，所以配置为：

```yaml
allowBuilds:
  sharp: false
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver
```

### 为什么 `next.config.ts` 里设置了 `turbopack.root`？

仓库根目录和 `example/` 都有 lock/workspace 文件。Next 16 可能推断 workspace root 到仓库根，导致 warning。这里把 Turbopack root 固定为 `process.cwd()`，也就是从 `example/` 执行命令时的目录。

### 为什么还有 `ai-highlight.ts`？

`src/lib/novel` 里保留了一些未来可能恢复 AI 时会用到的基础扩展文件，但当前默认 `extensions.ts` 不启用 AI 菜单，也不接 `/api/generate`。

### 后续怎么接真实图片上传？

替换 `src/components/tailwind/image-upload.ts` 里的 `onUpload`：

```ts
const onUpload = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const { url } = await res.json();
  return url;
};
```

然后继续复用 `createImageUpload({ onUpload, validateFn })`。

## 下一步建议

优先级从高到低：

1. 把编辑器状态从 `localStorage` 抽成可配置 `onChange/onSave`。
2. 给 `TailwindAdvancedEditor` 增加 props，而不是把默认内容、保存逻辑、上传逻辑写死。
4. 恢复 AI 菜单，但作为可选能力。
