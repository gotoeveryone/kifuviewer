import { writable } from "svelte/store";

export const currentMove = writable(0);
export const isPlaying = writable(false);
export const playbackSpeedMs = writable(1000);
