export type Point = {
  x: number;
  y: number;
};

export type BoardState = {
  size: number;
  stones: Array<{
    color: "B" | "W";
    point: Point | null;
    moveNumber?: number;
  }>;
  moveNumber: number;
  lastMove: {
    color: "B" | "W";
    coord: string;
    point: Point | null;
  } | null;
  captures: {
    B: number;
    W: number;
  };
};
