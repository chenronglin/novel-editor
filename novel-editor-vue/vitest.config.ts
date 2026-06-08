/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

// 独立的 vitest 配置：与 vite.config.ts 分开，避免在未安装 vitest 时影响 `npm run build`。
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
