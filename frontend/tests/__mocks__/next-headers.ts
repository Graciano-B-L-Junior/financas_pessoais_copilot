import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const cookies = jest.fn(() => {
  const store = new Map<string, RequestCookie>();

  return {
    get: (name: string) => store.get(name),
    set: (name: string, value: string, options?: any) => {
      store.set(name, {
        name,
        value,
        ...options,
      } as RequestCookie);
    },
    delete: (name: string) => {
      store.delete(name);
    },
    getAll: () => Array.from(store.values()),
    has: (name: string) => store.has(name),
    clear: () => store.clear(),
  };
});
