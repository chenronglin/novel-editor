// 可复用入口：集中导出编辑器扩展、相关工具函数与命令。
//
// 用法：
//   import { RevisionTracking, Comment, addCommentToRange } from "@/lib/novel";
//
// 注意：UI 组件（TailwindAdvancedEditor / DiscussionSidebar / SelectionMenu 等）位于 src/components，
// 复用所需的文件清单、样式与依赖见同目录下的 README.md。
export * from "./extensions";
export * from "./id";
