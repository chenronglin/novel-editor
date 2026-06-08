<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { type Editor } from "@tiptap/vue-3";
import { BubbleMenu } from "@tiptap/vue-3/menus";
import { NodeSelection } from "@tiptap/pm/state";
import { MessageSquarePlus, Handshake, Trash2 } from "lucide-vue-next";
import { addCommentToRange } from "../lib/novel/extensions/comment";
import { insertEditSuggestionAfterSelection } from "../lib/novel/extensions/edit-suggestion";
import Button from "./ui/Button.vue";
import Separator from "./ui/Separator.vue";
import NodeSelector from "./selectors/NodeSelector.vue";
import TextButtons from "./selectors/TextButtons.vue";
import ColorSelector from "./selectors/ColorSelector.vue";

interface SelectionMenuProps {
  editor: Editor;
}

const props = defineProps<SelectionMenuProps>();

interface PendingComment {
  from: number;
  to: number;
}

const pendingComment = ref<PendingComment | null>(null);
const commentDraft = ref("");
const commentError = ref("");
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const openNode = ref(false);
const openColor = ref(false);

watch(pendingComment, (newVal) => {
  if (newVal) {
    nextTick(() => {
      textareaRef.value?.focus();
    });
  }
});

const shouldShowMenu = (props: any) => {
  const { editor, state } = props;
  const { selection } = state;
  const { empty } = selection;

  if (!editor.isEditable || editor.isActive("image") || empty || selection instanceof NodeSelection) {
    return false;
  }

  return true;
};

const triggerComment = () => {
  const { from, to, empty } = props.editor.state.selection;

  if (empty) return;

  pendingComment.value = { from, to };
  commentError.value = "";
};

const triggerSuggestion = () => {
  insertEditSuggestionAfterSelection(props.editor);
};

const triggerDeleteRevision = () => {
  props.editor.chain().focus().markSelectionAsDeletedRevision().run();
};

const closeCommentDialog = () => {
  pendingComment.value = null;
  commentDraft.value = "";
  commentError.value = "";
};

const saveComment = () => {
  const body = commentDraft.value.trim();

  if (!body || !pendingComment.value) return;

  const didSave = addCommentToRange(props.editor, {
    body,
    range: {
      from: pendingComment.value.from,
      to: pendingComment.value.to,
    },
  });

  if (!didSave) {
    commentError.value = "批注保存失败，请重新选择文本后再试。";
    return;
  }

  closeCommentDialog();
};
</script>

<template>
  <div>
    <BubbleMenu
      :editor="editor"
      :should-show="shouldShowMenu"
      :tippy-options="{ placement: 'top', duration: 150 }"
      class="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl items-center"
    >
      <!-- Annotation (Comment) -->
      <Button
        class="gap-1 rounded-none text-amber-700 h-9 px-3 hover:bg-accent"
        variant="ghost"
        size="sm"
        type="button"
        title="批注"
        @click="triggerComment"
      >
        <MessageSquarePlus class="h-4 w-4" />
        批注
      </Button>

      <!-- Edit Suggestion -->
      <Button
        class="gap-1 rounded-none text-amber-700 h-9 px-3 hover:bg-accent"
        variant="ghost"
        size="sm"
        type="button"
        title="建议"
        @click="triggerSuggestion"
      >
        <Handshake class="h-4 w-4" />
        建议
      </Button>

      <!-- Delete Revision -->
      <Button
        class="gap-1 rounded-none text-red-600 h-9 px-3 hover:bg-accent"
        variant="ghost"
        size="sm"
        type="button"
        title="删除"
        @click="triggerDeleteRevision"
      >
        <Trash2 class="h-4 w-4" />
        删除
      </Button>

      <!-- Separator -->
      <Separator orientation="vertical" class="h-6" />

      <!-- Format Block Selector -->
      <NodeSelector :editor="editor" v-model:open="openNode" />

      <!-- Separator -->
      <Separator orientation="vertical" class="h-6" />

      <!-- Inline Style Formatting Buttons -->
      <TextButtons :editor="editor" />

      <!-- Separator -->
      <Separator orientation="vertical" class="h-6" />

      <!-- Color Selector -->
      <ColorSelector :editor="editor" v-model:open="openColor" />
    </BubbleMenu>

    <!-- Comment Modal Dialog -->
    <div
      v-if="pendingComment"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-4"
      @mousedown.self="closeCommentDialog"
    >
      <div
        aria-labelledby="comment-dialog-title"
        aria-modal="true"
        class="w-full max-w-md rounded-md border bg-background p-4 text-foreground shadow-2xl"
        role="dialog"
      >
        <h2 id="comment-dialog-title" class="text-base font-semibold">添加批注</h2>
        <textarea
          ref="textareaRef"
          class="mt-3 min-h-[112px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="输入批注内容"
          v-model="commentDraft"
          @keydown.esc="closeCommentDialog"
          @keydown.meta.enter="saveComment"
          @keydown.ctrl.enter="saveComment"
        />
        <p v-if="commentError" class="mt-2 text-sm text-red-600">{{ commentError }}</p>
        <div class="mt-4 flex justify-end gap-2">
          <Button variant="ghost" type="button" @click="closeCommentDialog">取消</Button>
          <Button type="button" :disabled="!commentDraft.trim()" @click="saveComment">确认</Button>
        </div>
      </div>
    </div>
  </div>
</template>
