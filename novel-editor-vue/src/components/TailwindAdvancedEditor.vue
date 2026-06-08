<script setup lang="ts">
import { ref, watch } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import type { Editor, Extensions, JSONContent } from "@tiptap/core";
import { defaultExtensions } from "./extensions";
import { defaultEditorContent } from "../lib/content";
import SelectionMenu from "./SelectionMenu.vue";
import DiscussionSidebar from "./DiscussionSidebar.vue";

const props = withDefaults(
  defineProps<{
    /** 文档内容（TipTap JSON），支持 v-model。未提供时使用内置示例内容。 */
    modelValue?: JSONContent | null;
    /** 是否可编辑。 */
    editable?: boolean;
    /** 自定义扩展集合，默认使用 defaultExtensions。 */
    extensions?: Extensions;
    /** 可选的保存状态文案（纯展示；持久化由父组件负责）。 */
    saveStatus?: string;
  }>(),
  {
    modelValue: undefined,
    editable: true,
    extensions: undefined,
    saveStatus: undefined,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: JSONContent): void;
  (e: "save", payload: { json: JSONContent; html: string }): void;
  (e: "ready", editor: Editor): void;
}>();

const charsCount = ref<number | undefined>(undefined);

// 防抖：内容停止变化一段时间后再通知父组件持久化。
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

const debouncedSave = debounce((instance: Editor) => {
  emit("save", { json: instance.getJSON(), html: instance.getHTML() });
}, 500);

const editor = useEditor({
  content: props.modelValue ?? defaultEditorContent,
  editable: props.editable,
  extensions: props.extensions ?? defaultExtensions,
  editorProps: {
    attributes: {
      class:
        "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
    },
  },
  onCreate: ({ editor }) => {
    charsCount.value = editor.storage.characterCount.characters();
    emit("ready", editor);
  },
  onUpdate: ({ editor }) => {
    charsCount.value = editor.storage.characterCount.characters();
    emit("update:modelValue", editor.getJSON());
    debouncedSave(editor);
  },
});

// 外部传入的内容变化时同步到编辑器；与当前内容相同则跳过，避免与本地输入形成回环。
// 注：长文档下这里的 JSON 比较有一定开销，若用作纯展示可改为非受控（只设初始内容 + 通过 ready 拿实例）。
watch(
  () => props.modelValue,
  (value) => {
    const instance = editor.value;
    if (!instance || value == null) return;
    if (JSON.stringify(instance.getJSON()) === JSON.stringify(value)) return;
    instance.commands.setContent(value, { emitUpdate: false });
  },
);

watch(
  () => props.editable,
  (value) => {
    editor.value?.setEditable(value ?? true);
  },
);

// 暴露底层 editor 实例，供父组件做高级操作（插入内容、聚焦、导出等）。
defineExpose({ editor });
</script>

<template>
  <div class="relative w-full max-w-screen-2xl px-4 mx-auto py-8">
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="relative min-w-0">
        <!-- Save status and word count badges -->
        <div class="absolute right-5 top-5 z-10 flex gap-2 select-none">
          <div
            v-if="saveStatus"
            class="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground transition-all"
          >
            {{ saveStatus }}
          </div>
          <div
            v-if="charsCount"
            class="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground transition-all"
          >
            {{ charsCount }} 字
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
