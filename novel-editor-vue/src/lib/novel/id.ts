// 统一的修订 / 批注 / 编辑建议 id 生成。
// 优先使用 crypto.randomUUID：去除对 Date.now 与模块级计数器的依赖，对 SSR 与多编辑器实例更安全；
// 在不支持的老环境降级到随机串。
const randomId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
};

export const createPrefixedId = (prefix: string): string => `${prefix}-${randomId()}`;
