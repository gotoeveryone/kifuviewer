<script lang="ts">
  import { onMount } from "svelte";

  const boardSize = 19;
  const margin = 28;
  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;
  let selectedPoint: { x: number; y: number } | null = null;

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
    ]
  };

  const draw = () => {
    if (!canvas || !container) return;
    const cssSize = Math.max(320, Math.min(760, container.clientWidth - 16));
    const inner = cssSize - margin * 2;
    const cell = inner / (boardSize - 1);
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

    if (selectedPoint) {
      const px = margin + selectedPoint.x * cell;
      const py = margin + selectedPoint.y * cell;
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(5, cell * 0.25), 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const onCanvasClick = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const cssSize = rect.width;
    const inner = cssSize - margin * 2;
    const cell = inner / (boardSize - 1);
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    const x = Math.round((localX - margin) / cell);
    const y = Math.round((localY - margin) / cell);
    if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
      return;
    }

    selectedPoint = { x, y };
    draw();
  };

  const toSgfCoord = (point: { x: number; y: number }): string => {
    const a = "a".charCodeAt(0);
    return String.fromCharCode(a + point.x) + String.fromCharCode(a + point.y);
  };

  onMount(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });
</script>

<div class="board-wrap" bind:this={container}>
  <h2>BoardCanvas</h2>
  <canvas bind:this={canvas} aria-label="go board" on:click={onCanvasClick}></canvas>
  <p class="coord">
    {#if selectedPoint}
      選択: ({selectedPoint.x}, {selectedPoint.y}) / {toSgfCoord(selectedPoint)}
    {:else}
      選択: なし
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
