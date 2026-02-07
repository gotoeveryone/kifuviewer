import { writable } from "svelte/store";
import type { SgfCollection } from "../types/sgf";

export const canonicalSgf = writable<SgfCollection | null>(null);
