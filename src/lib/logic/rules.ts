import type { Point } from "../types/board";
import type { SgfNode } from "../types/sgf";

export type StoneColor = "B" | "W";

type MoveValidationResult =
  | {
      ok: true;
      stones: Map<string, StoneColor>;
      captured: number;
      removedKeys: string[];
      playedPointKey: string | null;
    }
  | {
      ok: false;
      reason: string;
    };

export type BoardSimulation = {
  size: number;
  stones: Map<string, StoneColor>;
  moveMarks: Map<string, number>;
  currentHash: string;
  hashBeforeLastMove: string | null;
  moveNumber: number;
  lastMove: {
    color: StoneColor;
    coord: string;
    point: Point | null;
  } | null;
  captures: {
    B: number;
    W: number;
  };
};

const getPropertyValues = (node: SgfNode, ident: string): string[] => {
  return node.properties.find((prop) => prop.ident === ident)?.values ?? [];
};

const firstPropertyValue = (node: SgfNode, ident: string): string => {
  return getPropertyValues(node, ident)[0] ?? "";
};

const key = (point: Point): string => `${point.x},${point.y}`;

const decodeKey = (pointKey: string): Point => {
  const [x, y] = pointKey.split(",").map((v) => Number.parseInt(v, 10));
  return { x, y };
};

const opposite = (color: StoneColor): StoneColor => {
  return color === "B" ? "W" : "B";
};

export const pointToSgfCoord = (point: Point): string => {
  const a = "a".charCodeAt(0);
  return String.fromCharCode(a + point.x) + String.fromCharCode(a + point.y);
};

export const sgfCoordToPoint = (coord: string, size: number): Point | null => {
  if (coord.length !== 2) {
    return null;
  }

  const a = "a".charCodeAt(0);
  const x = coord.charCodeAt(0) - a;
  const y = coord.charCodeAt(1) - a;

  if (x < 0 || y < 0 || x >= size || y >= size) {
    return null;
  }

  return { x, y };
};

const neighbors = (point: Point, size: number): Point[] => {
  const out: Point[] = [];
  if (point.x > 0) out.push({ x: point.x - 1, y: point.y });
  if (point.x + 1 < size) out.push({ x: point.x + 1, y: point.y });
  if (point.y > 0) out.push({ x: point.x, y: point.y - 1 });
  if (point.y + 1 < size) out.push({ x: point.x, y: point.y + 1 });
  return out;
};

const collectGroup = (stones: Map<string, StoneColor>, size: number, start: Point): Set<string> => {
  const startKey = key(start);
  const color = stones.get(startKey);
  if (!color) {
    return new Set<string>();
  }

  const visited = new Set<string>();
  const stack = [start];

  while (stack.length > 0) {
    const point = stack.pop()!;
    const pointKey = key(point);
    if (visited.has(pointKey)) {
      continue;
    }

    if (stones.get(pointKey) !== color) {
      continue;
    }

    visited.add(pointKey);
    for (const n of neighbors(point, size)) {
      const nKey = key(n);
      if (!visited.has(nKey) && stones.get(nKey) === color) {
        stack.push(n);
      }
    }
  }

  return visited;
};

const countLiberties = (stones: Map<string, StoneColor>, size: number, group: Set<string>): number => {
  const liberties = new Set<string>();

  for (const stoneKey of group) {
    const point = decodeKey(stoneKey);
    for (const n of neighbors(point, size)) {
      const nKey = key(n);
      if (!stones.has(nKey)) {
        liberties.add(nKey);
      }
    }
  }

  return liberties.size;
};

const boardHash = (stones: Map<string, StoneColor>): string => {
  return [...stones.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, c]) => `${k}:${c}`)
    .join("|");
};

const applySetups = (stones: Map<string, StoneColor>, size: number, node: SgfNode): void => {
  for (const coord of getPropertyValues(node, "AB")) {
    const point = sgfCoordToPoint(coord, size);
    if (point) {
      stones.set(key(point), "B");
    }
  }

  for (const coord of getPropertyValues(node, "AW")) {
    const point = sgfCoordToPoint(coord, size);
    if (point) {
      stones.set(key(point), "W");
    }
  }

  for (const coord of getPropertyValues(node, "AE")) {
    const point = sgfCoordToPoint(coord, size);
    if (point) {
      stones.delete(key(point));
    }
  }
};

const applyMove = (
  stones: Map<string, StoneColor>,
  size: number,
  color: StoneColor,
  coord: string,
  hashBeforeLastMove: string | null
): MoveValidationResult => {
  if (coord === "") {
    return {
      ok: true,
      stones: new Map(stones),
      captured: 0,
      removedKeys: [],
      playedPointKey: null
    };
  }

  const point = sgfCoordToPoint(coord, size);
  if (!point) {
    return { ok: false, reason: "盤外への着手です。" };
  }

  const pointKey = key(point);
  if (stones.has(pointKey)) {
    return { ok: false, reason: "その点にはすでに石があります。" };
  }

  const next = new Map(stones);
  next.set(pointKey, color);

  let captured = 0;
  const removedKeys: string[] = [];
  for (const n of neighbors(point, size)) {
    const nKey = key(n);
    if (next.get(nKey) !== opposite(color)) {
      continue;
    }

    const group = collectGroup(next, size, n);
    if (countLiberties(next, size, group) === 0) {
      for (const removeKey of group) {
        next.delete(removeKey);
        captured += 1;
        removedKeys.push(removeKey);
      }
    }
  }

  const ownGroup = collectGroup(next, size, point);
  if (countLiberties(next, size, ownGroup) === 0) {
    return { ok: false, reason: "自殺手は打てません。" };
  }

  const nextHash = boardHash(next);
  if (hashBeforeLastMove !== null && nextHash === hashBeforeLastMove) {
    return { ok: false, reason: "コウで同形再現になるため打てません。" };
  }

  return { ok: true, stones: next, captured, removedKeys, playedPointKey: pointKey };
};

export const simulateBoardAtPath = (root: SgfNode, path: number[]): BoardSimulation => {
  const size = Number.parseInt(firstPropertyValue(root, "SZ"), 10) || 19;
  let current: SgfNode | null = root;
  const stones = new Map<string, StoneColor>();
  const moveMarks = new Map<string, number>();

  let hashBeforeLastMove: string | null = null;
  let moveNumber = 0;
  let lastMove: BoardSimulation["lastMove"] = null;
  const captures = { B: 0, W: 0 };

  const processMoveNode = (node: SgfNode, color: StoneColor, coord: string): void => {
    const beforeHash = boardHash(stones);
    const result = applyMove(stones, size, color, coord, null);
    if (!result.ok) {
      return;
    }

    stones.clear();
    for (const [k, v] of result.stones.entries()) {
      stones.set(k, v);
    }

    hashBeforeLastMove = beforeHash;
    captures[color] += result.captured;
    moveNumber += 1;
    for (const removedKey of result.removedKeys) {
      moveMarks.delete(removedKey);
    }
    if (result.playedPointKey) {
      moveMarks.set(result.playedPointKey, moveNumber);
    }
    lastMove = {
      color,
      coord,
      point: coord === "" ? null : sgfCoordToPoint(coord, size)
    };
  };

  const processNode = (node: SgfNode): void => {
    applySetups(stones, size, node);

    const blackMove = getPropertyValues(node, "B")[0];
    if (blackMove !== undefined) {
      processMoveNode(node, "B", blackMove);
      return;
    }

    const whiteMove = getPropertyValues(node, "W")[0];
    if (whiteMove !== undefined) {
      processMoveNode(node, "W", whiteMove);
    }
  };

  processNode(root);
  for (const childIndex of path) {
    if (!current) {
      break;
    }

    const nextNode: SgfNode | undefined = current.children[childIndex];
    if (!nextNode) {
      break;
    }

    processNode(nextNode);
    current = nextNode;
  }

  return {
    size,
    stones,
    moveMarks,
    currentHash: boardHash(stones),
    hashBeforeLastMove,
    moveNumber,
    lastMove,
    captures
  };
};

export const validateMoveAtPath = (
  root: SgfNode,
  path: number[],
  color: StoneColor,
  coord: string
): { ok: true } | { ok: false; reason: string } => {
  const simulation = simulateBoardAtPath(root, path);
  const result = applyMove(
    simulation.stones,
    simulation.size,
    color,
    coord,
    simulation.hashBeforeLastMove
  );

  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  return { ok: true };
};
