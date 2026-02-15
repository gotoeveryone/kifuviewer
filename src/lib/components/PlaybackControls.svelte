<script lang="ts">
  import { boardState } from "../stores/board";
  import { goNext, goPrev, goToEndByMainLine, goToStart, isPlaying, showMoveNumbers, toggleMoveNumbers, togglePlayback } from "../stores/playback";
  import { uiMessage } from "../stores/ui";
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
    color: #e5e7eb;
  }

  .message {
    margin: 0;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
  }

  .message.info {
    background: #0b2942;
    color: #bfdbfe;
    border: 1px solid #1d4ed8;
  }

  .message.error {
    background: #3f1d1d;
    color: #fecaca;
    border: 1px solid #ef4444;
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
    border: 1px solid #475569;
    background: #1f2937;
    color: #e5e7eb;
    border-radius: 8px;
    padding: 6px 10px;
    cursor: pointer;
  }

  button:hover {
    background: #334155;
  }

  .status {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
  }

  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #cbd5e1;
  }
</style>
