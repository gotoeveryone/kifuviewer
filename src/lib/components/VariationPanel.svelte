<script lang="ts">
  import { canonicalSgf, getNodeByPath } from "../stores/sgf";
  import { currentPath, switchNextVariation } from "../stores/playback";

  $: root = $canonicalSgf?.games[0]?.root ?? null;
  $: currentNode = root ? getNodeByPath(root, $currentPath) : null;
  $: nextVariations = currentNode?.children ?? [];
</script>

<div class="variation">
  <h2>Variations</h2>
  {#if root && nextVariations.length > 0}
    <ul>
      {#each nextVariations as _, index}
        <li>
          <button type="button" on:click={() => switchNextVariation(index)}>分岐 {index + 1}</button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .variation {
    display: grid;
    gap: 8px;
  }

  h2 {
    margin: 0;
    font-size: 14px;
    color: #374151;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }

  button {
    width: 100%;
    text-align: left;
    border: 1px solid #d1d5db;
    background: #f9fafb;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
  }

  button:hover {
    background: #f3f4f6;
  }
</style>
