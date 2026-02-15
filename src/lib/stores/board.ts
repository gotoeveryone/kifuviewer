import { derived } from "svelte/store";
import type { BoardState, Point } from "../types/board";
import { canonicalSgf } from "./sgf";
import { currentPath } from "./playback";
import { pointToSgfCoord, sgfCoordToPoint, simulateBoardAtPath } from "../logic/rules";

export { pointToSgfCoord, sgfCoordToPoint };

export const boardState = derived([canonicalSgf, currentPath], ([$canonicalSgf, $currentPath]): BoardState => {
  if (!$canonicalSgf || !$canonicalSgf.games[0]) {
    return {
      size: 19,
      stones: [],
      moveNumber: 0,
      lastMove: null,
      captures: { B: 0, W: 0 }
    };
  }

  const root = $canonicalSgf.games[0].root;
  const simulation = simulateBoardAtPath(root, $currentPath);

  return {
    size: simulation.size,
    stones: [...simulation.stones.entries()].map(([pointKey, color]) => {
      const [x, y] = pointKey.split(",").map((v) => Number.parseInt(v, 10));
      return {
        color,
        point: { x, y } as Point
      };
    }),
    moveNumber: simulation.moveNumber,
    lastMove: simulation.lastMove,
    captures: simulation.captures
  };
});
