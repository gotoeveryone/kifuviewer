<script lang="ts">
  import { boardState } from "../stores/board";
  import { goNext, goPrev, goToEndByMainLine, goToStart, isPlaying, showMoveNumbers, toggleMoveNumbers, togglePlayback } from "../stores/playback";
  import { uiMessage } from "../stores/ui";

  const boardXLabel = (x: number): string => {
    const letters = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
    return letters[x] ?? "?";
  };

  const boardYLabel = (y: number): string => {
    return String(y + 1);
  };

  $: currentMoveLabel = (() => {
    const last = $boardState.lastMove;
    if (!last) {
      return "開始局面";
    }
    if (!last.point) {
      return `${last.color} パス`;
    }
    return `${last.color} ${boardXLabel(last.point.x)}${boardYLabel(last.point.y)}`;
  })();
</script>

<div class="playback">
  <h2>Playback</h2>
  {#if $uiMessage}
    <p class={`message ${$uiMessage.kind}`}>{$uiMessage.text}</p>
  {/if}
  <div class="row buttons">
    <button type="button" on:click={goToStart}>|&lt;</button>
    <button type="button" on:click={goPrev}>&lt;</button>
    <button type="button" on:click={togglePlayback}>{$isPlaying ? "停止" : "再生"}</button>
    <button type="button" on:click={goNext}>&gt;</button>
    <button type="button" on:click={goToEndByMainLine}>&gt;|</button>
  </div>

  <p class="status">現在手数: {$boardState.moveNumber}</p>
  <p class="status">現在手: {currentMoveLabel}</p>
  <p class="status">黒のアゲハマ: {$boardState.captures.B} / 白のアゲハマ: {$boardState.captures.W}</p>
  <label class="toggle">
    <input type="checkbox" checked={$showMoveNumbers} on:change={toggleMoveNumbers} />
    手数表示
  </label>
</div>

<style>
  .playback {
    display: grid;
    gap: 10px;
  }

  h2 {
    margin: 0;
    font-size: 14px;
    color: #374151;
  }

  .message {
    margin: 0;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
  }

  .message.info {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .message.error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .buttons button {
    min-width: 56px;
  }

  button {
    border: 1px solid #d1d5db;
    background: #f9fafb;
    border-radius: 8px;
    padding: 6px 10px;
    cursor: pointer;
  }

  button:hover {
    background: #f3f4f6;
  }

  .status {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
  }

  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #374151;
  }
</style>
