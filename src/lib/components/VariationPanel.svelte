<script lang="ts">
  import { canonicalSgf, getNodeByPath } from "../stores/sgf";
  import { currentPath, switchNextVariation } from "../stores/playback";

  $: root = $canonicalSgf?.games[0]?.root ?? null;
  $: currentNode = root ? getNodeByPath(root, $currentPath) : null;
  $: nextVariations = currentNode?.children ?? [];
</script>

<div class="variation">
  <h2>Variations</h2>
  <ul>
    {#if root && nextVariations.length > 0}
      {#each nextVariations as _, index}
        <li>
          <button type="button" on:click={() => switchNextVariation(index)}>分岐 {index + 1}</button>
        </li>
      {/each}
    {:else}
      <li class="empty">分岐なし</li>
    {/if}
  </ul>
</div>

<style>
  .variation {
    display: grid;
    gap: 8px;
  }

  h2 {
    margin: 0;
    font-size: 14px;
    color: #e5e7eb;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
    height: 52px;
    overflow-y: auto;
    align-content: start;
  }

  button {
    width: 100%;
    text-align: left;
    border: 1px solid #475569;
    background: #1f2937;
    color: #e5e7eb;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
  }

  button:hover {
    background: #334155;
  }

  .empty {
    border: 1px solid #475569;
    background: #1f2937;
    color: #94a3b8;
    border-radius: 8px;
    padding: 8px;
    font-size: 13px;
  }
</style>
