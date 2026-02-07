<script lang="ts">
  import BoardCanvas from "./lib/components/BoardCanvas.svelte";
  import PlaybackControls from "./lib/components/PlaybackControls.svelte";
  import InfoPanel from "./lib/components/InfoPanel.svelte";
  import VariationPanel from "./lib/components/VariationPanel.svelte";
</script>

<main class="app">
  <section class="panel">
    <BoardCanvas />
  </section>
  <section class="panel">
    <PlaybackControls />
  </section>
  <section class="panel">
    <VariationPanel />
  </section>
  <section class="panel">
    <InfoPanel />
  </section>
</main>
