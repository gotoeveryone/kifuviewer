import { get, writable } from "svelte/store";
import { canonicalSgf, getNodeByPath } from "./sgf";

export const currentPath = writable<number[]>([]);
export const isPlaying = writable(false);
export const playbackSpeedMs = writable(900);

const getRoot = () => {
  const sgf = get(canonicalSgf);
  return sgf?.games[0]?.root ?? null;
};

const hasNextMove = (path: number[]): boolean => {
  const root = getRoot();
  if (!root) {
    return false;
  }
  const node = getNodeByPath(root, path);
  return Boolean(node && node.children.length > 0);
};

export const goToStart = (): void => {
  currentPath.set([]);
};

export const goToEndByMainLine = (): void => {
  const root = getRoot();
  if (!root) {
    return;
  }

  const path: number[] = [];
  let node = root;
  while (node.children.length > 0) {
    path.push(0);
    node = node.children[0];
  }

  currentPath.set(path);
};

export const goPrev = (): void => {
  const path = get(currentPath);
  if (path.length === 0) {
    return;
  }
  currentPath.set(path.slice(0, -1));
};

export const goNext = (): void => {
  const root = getRoot();
  if (!root) {
    return;
  }

  const path = get(currentPath);
  const node = getNodeByPath(root, path);
  if (!node || node.children.length === 0) {
    return;
  }

  currentPath.set([...path, 0]);
};

export const switchNextVariation = (variationIndex: number): void => {
  const root = getRoot();
  if (!root) {
    return;
  }

  const path = get(currentPath);
  const node = getNodeByPath(root, path);
  if (!node || !node.children[variationIndex]) {
    return;
  }

  currentPath.set([...path, variationIndex]);
};

export const stopPlayback = (): void => {
  isPlaying.set(false);
};

export const togglePlayback = (): void => {
  isPlaying.update((value) => !value);
};

let timer: ReturnType<typeof setInterval> | null = null;

const restartTimer = (): void => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  if (!get(isPlaying)) {
    return;
  }

  timer = setInterval(() => {
    const path = get(currentPath);
    if (!hasNextMove(path)) {
      isPlaying.set(false);
      return;
    }
    goNext();
  }, get(playbackSpeedMs));
};

isPlaying.subscribe(() => {
  restartTimer();
});

playbackSpeedMs.subscribe(() => {
  if (get(isPlaying)) {
    restartTimer();
  }
});

canonicalSgf.subscribe(() => {
  const root = getRoot();
  if (!root) {
    currentPath.set([]);
    isPlaying.set(false);
    return;
  }

  const path = get(currentPath);
  const node = getNodeByPath(root, path);
  if (!node) {
    currentPath.set([]);
  }
});
