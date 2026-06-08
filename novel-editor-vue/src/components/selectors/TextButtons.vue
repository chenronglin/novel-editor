<script setup lang="ts">
import { type Editor } from "@tiptap/vue-3";
import { Bold, Italic, Underline, Strikethrough } from "lucide-vue-next";
import Button from "../ui/Button.vue";

interface TextButtonsProps {
  editor: Editor;
}

defineProps<TextButtonsProps>();

const items = [
  {
    name: "bold",
    isActive: (editor: Editor) => editor.isActive("bold"),
    command: (editor: Editor) => editor.chain().focus().toggleBold().run(),
    icon: Bold,
  },
  {
    name: "italic",
    isActive: (editor: Editor) => editor.isActive("italic"),
    command: (editor: Editor) => editor.chain().focus().toggleItalic().run(),
    icon: Italic,
  },
  {
    name: "underline",
    isActive: (editor: Editor) => editor.isActive("underline"),
    command: (editor: Editor) => editor.chain().focus().toggleUnderline().run(),
    icon: Underline,
  },
  {
    name: "strike",
    isActive: (editor: Editor) => editor.isActive("strike"),
    command: (editor: Editor) => editor.chain().focus().toggleStrike().run(),
    icon: Strikethrough,
  },
];
</script>

<template>
  <div class="flex">
    <Button
      v-for="item in items"
      :key="item.name"
      size="sm"
      class="rounded-none h-9 w-9"
      variant="ghost"
      type="button"
      @click="item.command(editor)"
    >
      <component
        :is="item.icon"
        class="h-4 w-4"
        :class="{
          'text-blue-500': item.isActive(editor),
        }"
      />
    </Button>
  </div>
</template>
