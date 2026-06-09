import { describe, expect, it } from "vitest";
import { createPrefixedId } from "./id";

describe("createPrefixedId", () => {
  it("generates unique ids with the requested prefix", () => {
    const a = createPrefixedId("rev");
    const b = createPrefixedId("rev");

    expect(a.startsWith("rev-")).toBe(true);
    expect(b.startsWith("rev-")).toBe(true);
    expect(a).not.toBe(b);
  });
});
