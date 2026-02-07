export type Point = {
  x: number;
  y: number;
};

export type BoardState = {
  size: number;
  stones: Array<{
    color: "B" | "W";
    point: Point | null;
  }>;
};
