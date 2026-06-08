<script setup lang="ts">
import { ref } from "vue";
import type { JSONContent } from "@tiptap/core";
import TailwindAdvancedEditor from "./components/TailwindAdvancedEditor.vue";
import { defaultEditorContent } from "./lib/content";
import { Sun, Moon } from "lucide-vue-next";

const isDark = ref(false);

const toggleDarkMode = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

// 持久化在应用层负责：编辑器组件本身不再耦合存储。
const CONTENT_KEY = "novel-content";
const HTML_KEY = "html-content";

const loadContent = (): JSONContent => {
  try {
    const raw = window.localStorage.getItem(CONTENT_KEY);
    if (raw) return JSON.parse(raw) as JSONContent;
  } catch {
    // 解析失败时回退到示例内容
  }
  return defaultEditorContent as JSONContent;
};

const content = ref<JSONContent>(loadContent());
const saveStatus = ref("已保存");

const handleUpdate = (value: JSONContent) => {
  content.value = value;
  saveStatus.value = "未保存";
};

const handleSave = (payload: { json: JSONContent; html: string }) => {
  window.localStorage.setItem(CONTENT_KEY, JSON.stringify(payload.json));
  window.localStorage.setItem(HTML_KEY, payload.html);
  saveStatus.value = "已保存";
};
</script>

<template>
  <div class="min-h-screen bg-muted/10 dark:bg-neutral-950 transition-colors duration-200">
    <!-- Header -->
    <header class="border-b border-muted bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div class="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2 select-none">
          <span
            class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent"
          >
            Novel Editor
          </span>
          <span
            class="rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 text-xs font-semibold"
          >
            Vue 3 + Vite
          </span>
        </div>
        <button
          @click="toggleDarkMode"
          class="flex h-9 w-9 items-center justify-center rounded-md border border-muted bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none"
          type="button"
          :title="isDark ? '切换亮色模式' : '切换暗色模式'"
        >
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex flex-col items-center px-3 py-6 sm:px-5">
      <TailwindAdvancedEditor
        :model-value="content"
        :save-status="saveStatus"
        @update:model-value="handleUpdate"
        @save="handleSave"
      />
    </main>
  </div>
</template>
