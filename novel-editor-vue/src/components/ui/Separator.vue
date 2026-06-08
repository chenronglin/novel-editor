<script setup lang="ts">
import { computed } from "vue";
import { cn } from "../../lib/utils";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  class?: string;
}

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: "horizontal",
});

const classes = computed(() => {
  return cn(
    "shrink-0 bg-border",
    props.orientation === "horizontal" ? "h-[1px] w-full" : "h-auto w-[1px]",
    props.class
  );
});
</script>

<template>
  <div :class="classes" role="separator" />
</template>
