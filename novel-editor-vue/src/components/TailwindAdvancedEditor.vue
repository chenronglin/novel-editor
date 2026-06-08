<script setup lang="ts">
import { ref } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import { defaultExtensions } from "./extensions";
import { defaultEditorContent } from "../lib/content";
import SelectionMenu from "./SelectionMenu.vue";
import DiscussionSidebar from "./DiscussionSidebar.vue";

const saveStatus = ref("Saved");
const charsCount = ref<number | undefined>(undefined);

// Simple debounce helper
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

const debouncedUpdates = debounce((editorInstance: any) => {
  const json = editorInstance.getJSON();
  charsCount.value = editorInstance.storage.characterCount.words();
  window.localStorage.setItem("html-content", editorInstance.getHTML());
  window.localStorage.setItem("novel-content", JSON.stringify(json));
  saveStatus.value = "Saved";
}, 500);

const editor = useEditor({
  content: defaultEditorContent,
  extensions: defaultExtensions,
  editorProps: {
    attributes: {
      class:
        "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
    },
  },
  onCreate: ({ editor }) => {
    charsCount.value = editor.storage.characterCount.words();
  },
  onUpdate: ({ editor }) => {
    saveStatus.value = "Unsaved";
    debouncedUpdates(editor);
  },
});
</script>

<template>
  <div class="relative w-full max-w-screen-2xl px-4 mx-auto py-8">
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="relative min-w-0">
        <!-- Save status and word count badges -->
        <div class="absolute right-5 top-5 z-10 flex gap-2 select-none">
          <div class="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground transition-all">
            {{ saveStatus }}
          </div>
          <div
            v-if="charsCount"
            class="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground transition-all"
          >
            {{ charsCount }} Words
          </div>
        </div>

        <!-- Editor Container -->
        <div
          class="relative min-h-[500px] w-full border border-muted bg-background sm:mb-[calc(20vh)] sm:rounded-lg sm:shadow-lg overflow-hidden"
        >
          <EditorContent :editor="editor" />

          <!-- Selection Bubble Menu toolbar -->
          <SelectionMenu v-if="editor" :editor="editor" />
        </div>
      </div>

      <!-- Discussion & Revisions Sidebar -->
      <DiscussionSidebar :editor="editor ?? null" />
    </div>
  </div>
</template>
