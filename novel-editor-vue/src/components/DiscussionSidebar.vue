<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { type Editor } from "@tiptap/vue-3";
import { type Mark as ProseMirrorMark } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";
import { ArrowRightLeft, MessageSquareText, Minus, Plus, Replace, Trash2 } from "lucide-vue-next";
import { cn } from "../lib/utils";

interface DiscussionSidebarProps {
  editor: Editor | null;
}

const props = defineProps<DiscussionSidebarProps>();

type DiscussionSource = "comment" | "revision";
type DiscussionKind = "comment" | "insert" | "delete" | "replace";
type RevisionKind = "insert" | "delete" | "replace";
type RevisionRole = "inserted" | "deleted" | "original";

interface DiscussionSegment {
  from: number;
  to: number;
  text: string;
  role?: RevisionRole;
}

interface DiscussionItem {
  key: string;
  source: DiscussionSource;
  id: string;
  kind: DiscussionKind;
  label: string;
  from: number;
  to: number;
  quote: string;
  body?: string;
  originalText?: string;
  insertedText?: string;
  segments: DiscussionSegment[];
}

const MAX_QUOTE_LENGTH = 90;

const normalizeText = (text: string) => text.replace(/\s+/g, " ").trim();

const appendText = (current: string, next: string) => normalizeText(`${current}${current ? " " : ""}${next}`);

const truncateText = (text: string, fallback = "空内容") => {
  const normalized = normalizeText(text);

  if (!normalized) return fallback;
  if (normalized.length <= MAX_QUOTE_LENGTH) return normalized;

  return `${normalized.slice(0, MAX_QUOTE_LENGTH)}...`;
};

const asString = (value: unknown) => (typeof value === "string" ? value : "");

const isRevisionKind = (value: unknown): value is RevisionKind =>
  value === "insert" || value === "delete" || value === "replace";

const isRevisionRole = (value: unknown): value is RevisionRole =>
  value === "inserted" || value === "deleted" || value === "original";

const keyFor = (source: DiscussionSource, id: string) => `${source}:${id}`;

const getRevisionLabel = (kind: RevisionKind) => {
  if (kind === "insert") return "新增";
  if (kind === "delete") return "删除";
  return "替换";
};

const getRevisionDiscussionKind = (kind: RevisionKind): DiscussionKind => {
  if (kind === "insert") return "insert";
  if (kind === "delete") return "delete";
  return "replace";
};

const getItemFromMap = (
  itemsByKey: Map<string, DiscussionItem>,
  base: Omit<DiscussionItem, "segments" | "quote">
) => {
  const existing = itemsByKey.get(base.key);

  if (existing) return existing;

  const nextItem: DiscussionItem = {
    ...base,
    quote: "",
    segments: [],
  };

  itemsByKey.set(base.key, nextItem);

  return nextItem;
};

const addSegment = (item: DiscussionItem, segment: DiscussionSegment) => {
  item.from = Math.min(item.from, segment.from);
  item.to = Math.max(item.to, segment.to);
  item.segments.push(segment);
};

const collectDiscussionItems = (state: EditorState): DiscussionItem[] => {
  const itemsByKey = new Map<string, DiscussionItem>();

  state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;

    const from = pos;
    const to = pos + node.nodeSize;
    const text = node.text;

    node.marks.forEach((mark) => {
      if (mark.type.name === "comment") {
        const id = asString(mark.attrs.id);

        if (!id) return;

        const item = getItemFromMap(itemsByKey, {
          key: keyFor("comment", id),
          source: "comment",
          id,
          kind: "comment",
          label: "批注",
          from,
          to,
          body: asString(mark.attrs.body),
        });

        item.body = item.body || asString(mark.attrs.body);
        item.quote = appendText(item.quote, text);
        addSegment(item, { from, to, text });
        return;
      }

      if (mark.type.name !== "revision") return;

      const id = asString(mark.attrs.id);
      const revisionKind = mark.attrs.kind;
      const role = mark.attrs.role;

      if (!id || !isRevisionKind(revisionKind) || !isRevisionRole(role)) return;

      const item = getItemFromMap(itemsByKey, {
        key: keyFor("revision", id),
        source: "revision",
        id,
        kind: getRevisionDiscussionKind(revisionKind),
        label: getRevisionLabel(revisionKind),
        from,
        to,
        originalText: "",
        insertedText: "",
      });

      if (revisionKind === "replace") {
        item.kind = "replace";
        item.label = "替换";

        if (role === "original") {
          item.originalText = appendText(item.originalText ?? "", text);
        } else if (role === "inserted") {
          item.insertedText = appendText(item.insertedText ?? "", text);
        }
      } else {
        item.quote = appendText(item.quote, text);
      }

      addSegment(item, { from, to, text, role });
    });
  });

  return Array.from(itemsByKey.values())
    .map((item) => {
      if (item.kind !== "replace") return item;

      return {
        ...item,
        quote: `${truncateText(item.originalText ?? "")} -> ${truncateText(item.insertedText ?? "")}`,
      };
    })
    .sort((a, b) => a.from - b.from);
};

const keyFromMarks = (marks: readonly ProseMirrorMark[]) => {
  const comment = marks.find((mark) => mark.type.name === "comment" && asString(mark.attrs.id));

  if (comment) return keyFor("comment", asString(comment.attrs.id));

  const revision = marks.find((mark) => mark.type.name === "revision" && asString(mark.attrs.id));

  if (revision) return keyFor("revision", asString(revision.attrs.id));

  return null;
};

const getActiveKeyFromSelection = (state: EditorState) => {
  const { selection } = state;

  if (selection.empty) {
    const directKey = keyFromMarks(selection.$from.marks());

    if (directKey) return directKey;

    const beforeKey = keyFromMarks(selection.$from.nodeBefore?.marks ?? []);

    if (beforeKey) return beforeKey;

    return keyFromMarks(selection.$from.nodeAfter?.marks ?? []);
  }

  let activeKey: string | null = null;

  state.doc.nodesBetween(selection.from, selection.to, (node) => {
    if (activeKey || !node.isText) return false;

    activeKey = keyFromMarks(node.marks);

    return !activeKey;
  });

  return activeKey;
};

const items = ref<DiscussionItem[]>([]);
const activeKey = ref<string | null>(null);
const cardRefs = ref<Record<string, HTMLElement>>({});

const updateSidebar = () => {
  if (!props.editor) {
    items.value = [];
    activeKey.value = null;
    return;
  }
  const state = props.editor.state;
  items.value = collectDiscussionItems(state);
  activeKey.value = getActiveKeyFromSelection(state);
};

// Listen to editor transaction and selection changes to update sidebar items
const registerEditorEvents = (editor: Editor) => {
  editor.on("transaction", updateSidebar);
  editor.on("selectionUpdate", updateSidebar);
  updateSidebar();
};

const unregisterEditorEvents = (editor: Editor) => {
  editor.off("transaction", updateSidebar);
  editor.off("selectionUpdate", updateSidebar);
};

onMounted(() => {
  if (props.editor) {
    registerEditorEvents(props.editor);
  }
});

onBeforeUnmount(() => {
  if (props.editor) {
    unregisterEditorEvents(props.editor);
  }
});

watch(
  () => props.editor,
  (newEditor, oldEditor) => {
    if (oldEditor) {
      unregisterEditorEvents(oldEditor);
    }
    if (newEditor) {
      registerEditorEvents(newEditor);
    }
  }
);

// Watch activeKey to highlight corresponding items in editor DOM and scroll sidebar card into view
watch([activeKey, items], () => {
  if (!props.editor) return;

  const dom = props.editor.view.dom;

  dom.querySelectorAll<HTMLElement>("span[data-discussion-active]").forEach((element) => {
    element.removeAttribute("data-discussion-active");
  });

  const activeItem = items.value.find((item) => item.key === activeKey.value);

  if (!activeItem) return;

  const attributeName = activeItem.source === "comment" ? "data-comment-id" : "data-revision-id";

  dom.querySelectorAll<HTMLElement>(`span[${attributeName}]`).forEach((element) => {
    if (element.getAttribute(attributeName) === activeItem.id) {
      element.setAttribute("data-discussion-active", "true");
    }
  });

  // Scroll matching sidebar card into view
  if (activeKey.value) {
    const card = cardRefs.value[activeKey.value];
    if (card) {
      card.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }
}, { flush: "post", deep: true });

const clampPosition = (editor: Editor, pos: number) => Math.max(0, Math.min(pos, editor.state.doc.content.size));

const selectDiscussionItem = (item: DiscussionItem) => {
  if (!props.editor) return;

  const from = clampPosition(props.editor, item.from);
  const to = clampPosition(props.editor, item.to);

  if (from === to) return;

  const tr = props.editor.state.tr.setSelection(TextSelection.create(props.editor.state.doc, from, to)).scrollIntoView();

  props.editor.view.dispatch(tr);
  props.editor.view.focus();
};

const removeDiscussionMark = (item: DiscussionItem) => {
  if (!props.editor) return;

  const markName = item.source === "comment" ? "comment" : "revision";
  const tr = props.editor.state.tr;
  let didRemove = false;

  props.editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return;

    node.marks.forEach((mark) => {
      if (mark.type.name !== markName || asString(mark.attrs.id) !== item.id) return;

      tr.removeMark(pos, pos + node.nodeSize, mark);
      didRemove = true;
    });
  });

  if (!didRemove) return;

  props.editor.view.dispatch(tr.scrollIntoView());
  props.editor.view.focus();
};

const getKindIcon = (kind: DiscussionKind) => {
  if (kind === "comment") return MessageSquareText;
  if (kind === "insert") return Plus;
  if (kind === "delete") return Minus;
  if (kind === "replace") return Replace;
  return ArrowRightLeft;
};

const getKindClasses = (kind: DiscussionKind, isActive: boolean) => {
  const base =
    "w-full rounded-md border bg-background p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (isActive) {
    return cn(base, "border-emerald-300 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-200");
  }

  if (kind === "comment") return cn(base, "border-amber-200 hover:bg-amber-50/60");
  if (kind === "insert") return cn(base, "border-emerald-200 hover:bg-emerald-50/60");
  if (kind === "delete") return cn(base, "border-red-200 hover:bg-red-50/50");

  return cn(base, "border-orange-200 hover:bg-orange-50/60");
};

const getBadgeClasses = (kind: DiscussionKind) => {
  if (kind === "comment") return "border-amber-200 bg-amber-50 text-amber-700";
  if (kind === "insert") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (kind === "delete") return "border-red-200 bg-red-50 text-red-700";

  return "border-orange-200 bg-orange-50 text-orange-700";
};

const setRef = (el: any, key: string) => {
  if (el) {
    cardRefs.value[key] = el as HTMLElement;
  } else {
    delete cardRefs.value[key];
  }
};
</script>

<template>
  <aside
    class="h-fit max-h-[calc(100vh-4rem)] overflow-hidden rounded-lg border border-muted bg-background lg:sticky lg:top-6"
  >
    <div class="border-b border-muted px-4 py-4">
      <h2 class="text-base font-semibold text-foreground">批注讨论中心</h2>
      <p class="mt-1 text-xs text-muted-foreground">同步显示批注和修订标记</p>
    </div>
    <div class="max-h-[calc(100vh-10rem)] overflow-y-auto p-4">
      <div
        v-if="items.length === 0"
        class="rounded-md border border-dashed border-muted p-5 text-center text-sm leading-6 text-muted-foreground"
      >
        暂无批注或修订标记
      </div>
      <div v-else class="grid gap-3">
        <article
          v-for="item in items"
          :key="item.key"
          :ref="(el) => setRef(el, item.key)"
          :aria-current="item.key === activeKey ? 'true' : undefined"
          :class="getKindClasses(item.kind, item.key === activeKey)"
          role="button"
          tabindex="0"
          @click="selectDiscussionItem(item)"
          @keydown.enter.prevent="selectDiscussionItem(item)"
          @keydown.space.prevent="selectDiscussionItem(item)"
        >
          <div class="flex items-start justify-between gap-3">
            <span
              :class="
                cn(
                  'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium',
                  getBadgeClasses(item.kind)
                )
              "
            >
              <component :is="getKindIcon(item.kind)" class="h-3.5 w-3.5" />
              {{ item.label }}
            </span>
            <button
              :aria-label="`删除${item.label}标记`"
              class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
              type="button"
              @click.stop="removeDiscussionMark(item)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>

          <blockquote class="mt-3 border-l-2 border-muted pl-3 text-sm leading-6 text-muted-foreground">
            “{{ truncateText(item.quote) }}”
          </blockquote>

          <!-- Detail display based on type -->
          <div v-if="item.kind === 'comment' && item.body" class="mt-2 text-sm leading-6 text-foreground">
            <p>{{ item.body }}</p>
          </div>
          <div v-else-if="item.kind === 'replace'" class="mt-2 grid gap-1 text-sm leading-6">
            <p class="text-muted-foreground">
              原文：<span class="text-orange-700 line-through">{{ truncateText(item.originalText ?? "") }}</span>
            </p>
            <p class="text-muted-foreground">
              替换：<span class="text-emerald-700 underline">{{ truncateText(item.insertedText ?? "") }}</span>
            </p>
          </div>
        </article>
      </div>
    </div>
  </aside>
</template>
