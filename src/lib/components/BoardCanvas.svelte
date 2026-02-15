<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import type { Point } from "../types/board";
  import { boardState, pointToSgfCoord } from "../stores/board";
  import { appendMoveAtPath } from "../stores/sgf";
  import { currentPath, showMoveNumbers } from "../stores/playback";
  import { setUiError } from "../stores/ui";

  const margin = 38;
  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;
  let hoverPoint: Point | null = null;

  const starPointsBySize: Record<number, Array<[number, number]>> = {
    19: [
      [3, 3],
      [3, 9],
      [3, 15],
      [9, 3],
      [9, 9],
      [9, 15],
      [15, 3],
      [15, 9],
      [15, 15]
    ],
    13: [[3, 3], [3, 9], [6, 6], [9, 3], [9, 9]],
    9: [[2, 2], [2, 6], [4, 4], [6, 2], [6, 6]]
  };

  const boardXLabel = (x: number): string => {
    const letters = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
    return letters[x] ?? "?";
  };

  const boardYLabel = (y: number): string => {
    return String(y + 1);
  };

  const computeLayout = () => {
    const boardSize = $boardState.size;
    const cssSize = Math.max(280, Math.min(620, container.clientWidth - 16));
    const inner = cssSize - margin * 2;
    const cell = inner / (boardSize - 1);
    return { boardSize, cssSize, cell };
  };

  const draw = () => {
    if (!canvas || !container) return;

    const { boardSize, cssSize, cell } = computeLayout();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssSize * dpr);
    canvas.height = Math.floor(cssSize * dpr);
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssSize, cssSize);

    ctx.fillStyle = "#d6b178";
    ctx.fillRect(0, 0, cssSize, cssSize);

    ctx.strokeStyle = "#2f2a22";
    ctx.lineWidth = 1;
    for (let i = 0; i < boardSize; i += 1) {
      const p = margin + i * cell;
      ctx.beginPath();
      ctx.moveTo(margin, p);
      ctx.lineTo(cssSize - margin, p);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(p, margin);
      ctx.lineTo(p, cssSize - margin);
      ctx.stroke();
    }

    ctx.fillStyle = "#2f2a22";
    for (const [x, y] of starPointsBySize[boardSize] ?? []) {
      const px = margin + x * cell;
      const py = margin + y * cell;
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let x = 0; x < boardSize; x += 1) {
      const px = margin + x * cell;
      ctx.fillText(boardXLabel(x), px, margin * 0.45);
    }

    ctx.textAlign = "right";
    for (let y = 0; y < boardSize; y += 1) {
      const py = margin + y * cell;
      ctx.fillText(boardYLabel(y), margin * 0.75, py);
    }

    for (const stone of $boardState.stones) {
      if (!stone.point) {
        continue;
      }
      const px = margin + stone.point.x * cell;
      const py = margin + stone.point.y * cell;
      const r = Math.max(7, cell * 0.46);

      const grad = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.25, px, py, r);
      if (stone.color === "B") {
        grad.addColorStop(0, "#666");
        grad.addColorStop(1, "#111");
      } else {
        grad.addColorStop(0, "#fff");
        grad.addColorStop(1, "#ddd");
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = stone.color === "B" ? "#111" : "#777";
      ctx.lineWidth = 1;
      ctx.stroke();

      if ($showMoveNumbers && stone.moveNumber !== undefined) {
        ctx.fillStyle = stone.color === "B" ? "#f3f4f6" : "#111827";
        ctx.font = `${Math.max(9, Math.floor(cell * 0.34))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(stone.moveNumber), px, py);
      }
    }

    const currentMovePoint = $boardState.lastMove?.point;
    if (currentMovePoint) {
      const px = margin + currentMovePoint.x * cell;
      const py = margin + currentMovePoint.y * cell;
      const r = Math.max(8, cell * 0.28);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (hoverPoint) {
      const px = margin + hoverPoint.x * cell;
      const py = margin + hoverPoint.y * cell;
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(6, cell * 0.23), 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const toBoardPoint = (event: MouseEvent): Point | null => {
    const { boardSize, cell } = computeLayout();
    const rect = canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    const x = Math.round((localX - margin) / cell);
    const y = Math.round((localY - margin) / cell);

    if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
      return null;
    }

    return { x, y };
  };

  const onMouseMove = (event: MouseEvent) => {
    hoverPoint = toBoardPoint(event);
  };

  const onCanvasClick = (event: MouseEvent) => {
    const point = toBoardPoint(event);
    if (!point) {
      return;
    }

    const result = appendMoveAtPath(get(currentPath), pointToSgfCoord(point));
    if (result.error) {
      setUiError(result.error);
      return;
    }

    currentPath.set(result.path);
  };

  const onMouseLeave = () => {
    hoverPoint = null;
  };

  onMount(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    draw();
    return () => {
      window.removeEventListener("resize", onResize);
    };
  });

  $: canvas, container, $boardState, $showMoveNumbers, hoverPoint, draw();
</script>

<div class="board-wrap" bind:this={container}>
  <h2>Board</h2>
  <canvas
    bind:this={canvas}
    aria-label="go board"
    on:click={onCanvasClick}
    on:mousemove={onMouseMove}
    on:mouseleave={onMouseLeave}
  ></canvas>
  <p class="coord">
    {#if hoverPoint}
      候補: {boardXLabel(hoverPoint.x)}{boardYLabel(hoverPoint.y)}
    {:else}
      候補: なし
    {/if}
  </p>
</div>

<style>
  .board-wrap {
    display: grid;
    gap: 8px;
    justify-items: center;
  }

  h2 {
    margin: 0;
    font-size: 14px;
    color: #374151;
  }

  canvas {
    border: 1px solid #a16207;
    border-radius: 6px;
    box-shadow: 0 3px 10px rgba(17, 24, 39, 0.15);
  }

  .coord {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
  }
</style>
