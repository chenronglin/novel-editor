import { describe, it, expect } from "vitest";
import { createPrefixedId } from "./id";

describe("createPrefixedId", () => {
  it("生成带前缀且互不相同的 id", () => {
    const a = createPrefixedId("rev");
    const b = createPrefixedId("rev");

    expect(a.startsWith("rev-")).toBe(true);
    expect(a).not.toBe(b);
  });
});
