<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from "vue";
import { nodeViewProps, NodeViewWrapper } from "@tiptap/vue-3";
import { Check, Handshake, PencilLine, Trash2 } from "lucide-vue-next";

const props = defineProps(nodeViewProps);

const attrs = computed(() => props.node.attrs);
const body = computed(() => attrs.value.body ?? "");
const saved = computed(() => attrs.value.saved === true || attrs.value.saved === "true");

const draft = ref(body.value);
const isEditing = ref(!saved.value);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const focusTextarea = () => {
  if (isEditing.value) {
    nextTick(() => {
      textareaRef.value?.focus();
    });
  }
};

onMounted(focusTextarea);

watch(isEditing, focusTextarea);

// Sync draft with body changes from outside if necessary
watch(body, (newBody) => {
  if (!isEditing.value) {
    draft.value = newBody;
  }
});

const saveSuggestion = () => {
  const nextBody = draft.value.trim();

  if (!nextBody) return;

  props.updateAttributes({
    body: nextBody,
    saved: true,
  });
  isEditing.value = false;
};

const startEditing = () => {
  draft.value = body.value;
  isEditing.value = true;
};
</script>

<template>
  <NodeViewWrapper
    as="section"
    class="my-6 rounded-md border border-amber-300 bg-amber-50/85 shadow-sm"
    :contentEditable="false"
    data-edit-suggestion-card=""
  >
    <div class="border-l-4 border-amber-400 px-5 py-4">
      <div class="flex items-center justify-between gap-3 border-b border-dashed border-amber-200 pb-3">
        <div class="flex items-center gap-2 text-sm font-semibold text-amber-700">
          <Handshake class="h-4 w-4" />
          编辑建议
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <button
            v-if="saved && !isEditing"
            class="inline-flex h-8 items-center gap-1 rounded px-2 text-sm text-amber-700 transition-colors hover:bg-amber-100"
            type="button"
            @click="startEditing"
          >
            <PencilLine class="h-4 w-4" />
            修改
          </button>
          <button
            class="inline-flex h-8 items-center gap-1 rounded px-2 text-sm text-red-500 transition-colors hover:bg-red-50"
            type="button"
            @click="deleteNode"
          >
            <Trash2 class="h-4 w-4" />
            删除
          </button>
        </div>
      </div>

      <div v-if="isEditing" class="pt-3">
        <textarea
          ref="textareaRef"
          class="min-h-[96px] w-full resize-y rounded border border-amber-200 bg-white/80 px-3 py-2 text-sm leading-6 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          placeholder="输入编辑建议"
          v-model="draft"
          @keydown.meta.enter="saveSuggestion"
          @keydown.ctrl.enter="saveSuggestion"
        />
        <div class="mt-3 flex justify-end">
          <button
            class="inline-flex h-8 items-center gap-1 rounded bg-amber-500 px-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            :disabled="!draft.trim()"
            @click="saveSuggestion"
          >
            <Check class="h-4 w-4" />
            确认
          </button>
        </div>
      </div>
      <p v-else class="whitespace-pre-wrap pt-3 text-sm leading-7 text-muted-foreground">{{ body }}</p>
    </div>
  </NodeViewWrapper>
</template>
