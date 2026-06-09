const randomId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
};

export const createPrefixedId = (prefix: string): string => `${prefix}-${randomId()}`;
