<script setup lang="ts">
import { computed } from "vue";
import { type Editor } from "@tiptap/vue-3";
import { Check, ChevronDown, Heading1, Heading2, Heading3, Type } from "lucide-vue-next";
import Button from "../ui/Button.vue";
import Dropdown from "../ui/Dropdown.vue";

interface NodeSelectorProps {
  editor: Editor;
  open: boolean;
}

const props = defineProps<NodeSelectorProps>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const items = [
  {
    name: "Text",
    icon: Type,
    command: (editor: Editor) => editor.chain().focus().clearNodes().run(),
    isActive: (editor: Editor) => editor.isActive("paragraph"),
  },
  {
    name: "Heading 1",
    icon: Heading1,
    command: (editor: Editor) => editor.chain().focus().clearNodes().toggleHeading({ level: 1 }).run(),
    isActive: (editor: Editor) => editor.isActive("heading", { level: 1 }),
  },
  {
    name: "Heading 2",
    icon: Heading2,
    command: (editor: Editor) => editor.chain().focus().clearNodes().toggleHeading({ level: 2 }).run(),
    isActive: (editor: Editor) => editor.isActive("heading", { level: 2 }),
  },
  {
    name: "Heading 3",
    icon: Heading3,
    command: (editor: Editor) => editor.chain().focus().clearNodes().toggleHeading({ level: 3 }).run(),
    isActive: (editor: Editor) => editor.isActive("heading", { level: 3 }),
  },
];

const activeItem = computed(() => {
  return items.find((item) => item.isActive(props.editor)) ?? { name: "Multiple" };
});

const handleOpenChange = (val: boolean) => {
  emit("update:open", val);
};

const selectItem = (item: typeof items[number]) => {
  item.command(props.editor);
  emit("update:open", false);
};
</script>

<template>
  <Dropdown :open="open" @update:open="handleOpenChange" align="start">
    <template #trigger>
      <Button
        size="sm"
        variant="ghost"
        class="gap-2 rounded-none border-none hover:bg-accent focus:ring-0"
        @click="handleOpenChange(!open)"
      >
        <span class="whitespace-nowrap text-sm">{{ activeItem.name }}</span>
        <ChevronDown class="h-4 w-4" />
      </Button>
    </template>

    <template #content>
      <div class="w-48 p-1 flex flex-col">
        <button
          v-for="item in items"
          :key="item.name"
          type="button"
          class="flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent focus:outline-none"
          @click="selectItem(item)"
        >
          <div class="flex items-center space-x-2">
            <div class="rounded-sm border p-1 bg-background">
              <component :is="item.icon" class="h-3.5 w-3.5" />
            </div>
            <span>{{ item.name }}</span>
          </div>
          <Check v-if="activeItem.name === item.name" class="h-4 w-4 text-primary" />
        </button>
      </div>
    </template>
  </Dropdown>
</template>
