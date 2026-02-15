import { writable } from "svelte/store";

export type UiMessage = {
  kind: "info" | "error";
  text: string;
};

export const uiMessage = writable<UiMessage | null>(null);

export const setUiInfo = (text: string): void => {
  uiMessage.set({ kind: "info", text });
};

export const setUiError = (text: string): void => {
  uiMessage.set({ kind: "error", text });
};

export const clearUiMessage = (): void => {
  uiMessage.set(null);
};
