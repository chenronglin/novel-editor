"use client";

import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { defaultEditorContent } from "@/lib/content";
import type { JSONContent } from "@/lib/novel";
import { useState } from "react";

const CONTENT_KEY = "novel-content";
const HTML_KEY = "html-content";

const loadStoredContent = (): JSONContent => {
  if (typeof window === "undefined") return defaultEditorContent as JSONContent;

  try {
    const raw = window.localStorage.getItem(CONTENT_KEY);

    if (raw) return JSON.parse(raw) as JSONContent;
  } catch {
    // Fall back to the bundled example content if local data is missing or invalid.
  }

  return defaultEditorContent as JSONContent;
};

export default function Home() {
  const [content, setContent] = useState<JSONContent>(() => loadStoredContent());
  const [saveStatus, setSaveStatus] = useState("已保存");

  const handleChange = (value: JSONContent) => {
    setContent(value);
    setSaveStatus("未保存");
  };

  const handleSave = ({ json, html }: { json: JSONContent; html: string }) => {
    window.localStorage.setItem(CONTENT_KEY, JSON.stringify(json));
    window.localStorage.setItem(HTML_KEY, html);
    setSaveStatus("已保存");
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/30 px-3 py-6 sm:px-5">
      <TailwindAdvancedEditor
        value={content}
        saveStatus={saveStatus}
        onChange={handleChange}
        onSave={handleSave}
      />
    </main>
  );
}
