import { get, writable } from "svelte/store";
import type { SgfCollection, SgfNode, SgfProperty } from "../types/sgf";
import { validateMoveAtPath } from "../logic/rules";

export const canonicalSgf = writable<SgfCollection | null>(null);
export const currentFilePath = writable<string>("");
export const isDirty = writable(false);

const cloneCollection = (collection: SgfCollection): SgfCollection => {
  return structuredClone(collection);
};

export const createEmptyCollection = (): SgfCollection => ({
  games: [
    {
      root: {
        properties: [
          { ident: "FF", values: ["4"] },
          { ident: "GM", values: ["1"] },
          { ident: "SZ", values: ["19"] }
        ],
        children: []
      }
    }
  ]
});

const findProperty = (node: SgfNode, ident: string): SgfProperty | undefined => {
  return node.properties.find((prop) => prop.ident === ident);
};

export const getPropertyValues = (node: SgfNode, ident: string): string[] => {
  return findProperty(node, ident)?.values ?? [];
};

export const getFirstPropertyValue = (node: SgfNode, ident: string): string => {
  return getPropertyValues(node, ident)[0] ?? "";
};

export const setSingleProperty = (node: SgfNode, ident: string, value: string): void => {
  const found = findProperty(node, ident);
  if (found) {
    if (value === "") {
      node.properties = node.properties.filter((prop) => prop.ident !== ident);
      return;
    }
    found.values = [value];
    return;
  }

  if (value !== "") {
    node.properties.push({ ident, values: [value] });
  }
};

export const getNodeByPath = (root: SgfNode, path: number[]): SgfNode | null => {
  let current: SgfNode = root;
  for (const childIndex of path) {
    const next = current.children[childIndex];
    if (!next) {
      return null;
    }
    current = next;
  }
  return current;
};

const getLastMoveColor = (root: SgfNode, path: number[]): "B" | "W" | null => {
  const nodes: SgfNode[] = [];
  let current: SgfNode = root;
  nodes.push(current);
  for (const childIndex of path) {
    const next = current.children[childIndex];
    if (!next) {
      break;
    }
    current = next;
    nodes.push(current);
  }

  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
    if (getPropertyValues(node, "B").length > 0) {
      return "B";
    }
    if (getPropertyValues(node, "W").length > 0) {
      return "W";
    }
  }

  return null;
};

export const setCollection = (collection: SgfCollection): void => {
  canonicalSgf.set(collection);
  isDirty.set(false);
};

export const ensureCollection = (): SgfCollection => {
  const current = get(canonicalSgf);
  if (current) {
    return current;
  }
  const initial = createEmptyCollection();
  canonicalSgf.set(initial);
  return initial;
};

export type AppendMoveResult = {
  path: number[];
  error: string | null;
};

export const appendMoveAtPath = (path: number[], coord: string): AppendMoveResult => {
  let result: AppendMoveResult = { path, error: null };

  canonicalSgf.update((current) => {
    const working = cloneCollection(current ?? createEmptyCollection());
    const root = working.games[0].root;
    const node = getNodeByPath(root, path);
    if (!node) {
      result = { path, error: "現在のノードが見つかりません。" };
      return working;
    }

    const lastColor = getLastMoveColor(root, path);
    const nextColor = lastColor === "B" ? "W" : "B";

    const validation = validateMoveAtPath(root, path, nextColor, coord);
    if (!validation.ok) {
      result = { path, error: validation.reason };
      return working;
    }

    const newNode: SgfNode = {
      properties: [{ ident: nextColor, values: [coord] }],
      children: []
    };

    node.children.push(newNode);
    result = { path: [...path, node.children.length - 1], error: null };
    isDirty.set(true);
    return working;
  });

  return result;
};

export const setCurrentNodeComment = (path: number[], comment: string): void => {
  canonicalSgf.update((current) => {
    if (!current) {
      return current;
    }
    const working = cloneCollection(current);
    const root = working.games[0].root;
    const node = getNodeByPath(root, path);
    if (!node) {
      return current;
    }

    setSingleProperty(node, "C", comment);
    isDirty.set(true);
    return working;
  });
};

export const setRootGameInfo = (updates: Record<string, string>): void => {
  canonicalSgf.update((current) => {
    if (!current) {
      return current;
    }
    const working = cloneCollection(current);
    const root = working.games[0].root;

    for (const [ident, value] of Object.entries(updates)) {
      setSingleProperty(root, ident, value);
    }

    isDirty.set(true);
    return working;
  });
};
