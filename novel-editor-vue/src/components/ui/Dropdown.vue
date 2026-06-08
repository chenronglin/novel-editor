<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface DropdownProps {
  open: boolean;
  align?: "start" | "center" | "end";
}

const props = withDefaults(defineProps<DropdownProps>(), {
  open: false,
  align: "start",
});

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const dropdownRef = ref<HTMLElement | null>(null);

const closeDropdown = () => {
  emit("update:open", false);
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside, true);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside, true);
});
</script>

<template>
  <div class="relative inline-block text-left" ref="dropdownRef">
    <!-- Trigger Slot -->
    <div class="flex items-center">
      <slot name="trigger" />
    </div>

    <!-- Content Slot -->
    <div
      v-if="open"
      class="absolute z-50 mt-1 origin-top-left rounded-md border bg-popover text-popover-foreground shadow-md outline-none"
      :class="[
        align === 'start' ? 'left-0' : '',
        align === 'end' ? 'right-0' : '',
        align === 'center' ? 'left-1/2 -translate-x-1/2' : '',
      ]"
    >
      <slot name="content" />
    </div>
  </div>
</template>
