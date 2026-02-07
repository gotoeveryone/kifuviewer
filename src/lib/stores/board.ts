import { writable } from "svelte/store";
import type { BoardState } from "../types/board";

export const boardState = writable<BoardState>({
  size: 19,
  stones: []
});
