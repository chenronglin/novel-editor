<script setup lang="ts">
import { computed } from "vue";
import { type Editor } from "@tiptap/vue-3";
import { Check, ChevronDown } from "lucide-vue-next";
import Button from "../ui/Button.vue";
import Dropdown from "../ui/Dropdown.vue";

interface ColorSelectorProps {
  editor: Editor;
  open: boolean;
}

const props = defineProps<ColorSelectorProps>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const TEXT_COLORS = [
  { name: "Default", color: "var(--novel-black)" },
  { name: "Purple", color: "#9333EA" },
  { name: "Red", color: "#E00000" },
  { name: "Yellow", color: "#EAB308" },
  { name: "Blue", color: "#2563EB" },
  { name: "Green", color: "#008A00" },
  { name: "Orange", color: "#FFA500" },
  { name: "Pink", color: "#BA4081" },
  { name: "Gray", color: "#A8A29E" },
];

const HIGHLIGHT_COLORS = [
  { name: "Default", color: "var(--novel-highlight-default)" },
  { name: "Purple", color: "var(--novel-highlight-purple)" },
  { name: "Red", color: "var(--novel-highlight-red)" },
  { name: "Yellow", color: "var(--novel-highlight-yellow)" },
  { name: "Blue", color: "var(--novel-highlight-blue)" },
  { name: "Green", color: "var(--novel-highlight-green)" },
  { name: "Orange", color: "var(--novel-highlight-orange)" },
  { name: "Pink", color: "var(--novel-highlight-pink)" },
  { name: "Gray", color: "var(--novel-highlight-gray)" },
];

const activeColorItem = computed(() => {
  return TEXT_COLORS.find(({ color }) => props.editor.isActive("textStyle", { color }));
});

const activeHighlightItem = computed(() => {
  return HIGHLIGHT_COLORS.find(({ color }) => props.editor.isActive("highlight", { color }));
});

const handleOpenChange = (val: boolean) => {
  emit("update:open", val);
};

const selectColor = (name: string, color: string) => {
  props.editor.commands.unsetColor();
  if (name !== "Default") {
    props.editor.chain().focus().setColor(color).run();
  }
  emit("update:open", false);
};

const selectHighlight = (name: string, color: string) => {
  props.editor.commands.unsetHighlight();
  if (name !== "Default") {
    props.editor.chain().focus().setHighlight({ color }).run();
  }
  emit("update:open", false);
};
</script>

<template>
  <Dropdown :open="open" @update:open="handleOpenChange" align="end">
    <template #trigger>
      <Button
        size="sm"
        class="gap-2 rounded-none h-9 border-none hover:bg-accent focus:ring-0"
        variant="ghost"
        @click="handleOpenChange(!open)"
      >
        <span
          class="rounded-sm px-1.5 py-0.5 font-bold"
          :style="{
            color: activeColorItem?.color,
            backgroundColor: activeHighlightItem?.color,
          }"
        >
          A
        </span>
        <ChevronDown class="h-4 w-4" />
      </Button>
    </template>

    <template #content>
      <div class="flex max-h-80 w-48 flex-col overflow-hidden overflow-y-auto p-1 bg-popover">
        <!-- Text Colors -->
        <div class="flex flex-col">
          <div class="my-1 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            文字颜色
          </div>
          <button
            v-for="{ name, color } in TEXT_COLORS"
            :key="name"
            type="button"
            class="flex w-full cursor-pointer items-center justify-between px-2 py-1 text-sm text-left hover:bg-accent focus:outline-none rounded-sm"
            @click="selectColor(name, color)"
          >
            <div class="flex items-center gap-2">
              <div class="rounded-sm border px-2 py-px font-medium text-xs bg-background" :style="{ color }">
                A
              </div>
              <span>{{ name }}</span>
            </div>
            <Check v-if="editor.isActive('textStyle', { color })" class="h-4 w-4 text-primary" />
          </button>
        </div>

        <!-- Highlight Colors -->
        <div class="flex flex-col mt-2 border-t pt-2">
          <div class="my-1 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            背景高亮
          </div>
          <button
            v-for="{ name, color } in HIGHLIGHT_COLORS"
            :key="name"
            type="button"
            class="flex w-full cursor-pointer items-center justify-between px-2 py-1 text-sm text-left hover:bg-accent focus:outline-none rounded-sm"
            @click="selectHighlight(name, color)"
          >
            <div class="flex items-center gap-2">
              <div
                class="rounded-sm border px-2 py-px font-medium text-xs text-foreground"
                :style="{ backgroundColor: color }"
              >
                A
              </div>
              <span>{{ name }}</span>
            </div>
            <Check v-if="editor.isActive('highlight', { color })" class="h-4 w-4 text-primary" />
          </button>
        </div>
      </div>
    </template>
  </Dropdown>
</template>
