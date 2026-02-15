<script lang="ts">
  import type { SgfNode } from "../types/sgf";
  import { canonicalSgf, getFirstPropertyValue, getNodeByPath } from "../stores/sgf";
  import { currentPath, switchNextVariation } from "../stores/playback";

  const moveLabel = (coord: string, color: string): string => {
    if (!coord) {
      return `${color} pass`;
    }
    return `${color}[${coord}]`;
  };

  const describeNode = (node: SgfNode): string => {
    const b = getFirstPropertyValue(node, "B");
    if (b !== "") {
      return moveLabel(b, "B");
    }
    const w = getFirstPropertyValue(node, "W");
    if (w !== "") {
      return moveLabel(w, "W");
    }
    return "(非着手ノード)";
  };

  $: root = $canonicalSgf?.games[0]?.root ?? null;
  $: currentNode = root ? getNodeByPath(root, $currentPath) : null;
  $: nextVariations = currentNode?.children ?? [];
</script>

<div class="variation">
  <h2>Variations</h2>
  {#if !root}
    <p>棋譜を読み込むと分岐を表示します。</p>
  {:else if nextVariations.length === 0}
    <p>次の分岐はありません。</p>
  {:else}
    <ul>
      {#each nextVariations as node, index}
        <li>
          <button type="button" on:click={() => switchNextVariation(index)}>{index + 1}. {describeNode(node)}</button>
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

  p {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
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
