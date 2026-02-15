<script lang="ts">
  import { canonicalSgf, getFirstPropertyValue, getNodeByPath, setCurrentNodeComment, setRootGameInfo } from "../stores/sgf";
  import { currentPath } from "../stores/playback";

  $: root = $canonicalSgf?.games[0]?.root ?? null;
  $: currentNode = root ? getNodeByPath(root, $currentPath) : null;

  $: ev = root ? getFirstPropertyValue(root, "EV") : "";
  $: dt = root ? getFirstPropertyValue(root, "DT") : "";
  $: km = root ? getFirstPropertyValue(root, "KM") : "";
  $: re = root ? getFirstPropertyValue(root, "RE") : "";
  $: pb = root ? getFirstPropertyValue(root, "PB") : "";
  $: br = root ? getFirstPropertyValue(root, "BR") : "";
  $: pw = root ? getFirstPropertyValue(root, "PW") : "";
  $: wr = root ? getFirstPropertyValue(root, "WR") : "";
  $: comment = currentNode ? getFirstPropertyValue(currentNode, "C") : "";

  const updateRoot = (ident: string, value: string) => {
    setRootGameInfo({ [ident]: value });
  };

  const updateComment = (value: string) => {
    setCurrentNodeComment($currentPath, value);
  };
</script>

<div class="info">
  <h2>Info</h2>

  {#if !root}
    <p>棋譜を読み込むと情報を編集できます。</p>
  {:else}
    <div class="grid">
      <label class="full">
        <span>棋戦</span>
        <input type="text" value={ev} on:input={(e) => updateRoot("EV", (e.currentTarget as HTMLInputElement).value)} />
      </label>

      <div class="row three">
        <label>
          <span>日付</span>
          <input type="text" value={dt} on:input={(e) => updateRoot("DT", (e.currentTarget as HTMLInputElement).value)} />
        </label>
        <label class="komi">
          <span>コミ</span>
          <input type="text" value={km} on:input={(e) => updateRoot("KM", (e.currentTarget as HTMLInputElement).value)} />
        </label>
        <label>
          <span>結果</span>
          <input type="text" value={re} on:input={(e) => updateRoot("RE", (e.currentTarget as HTMLInputElement).value)} />
        </label>
      </div>

      <div class="row two">
        <label>
          <span>黒番</span>
          <input type="text" value={pb} on:input={(e) => updateRoot("PB", (e.currentTarget as HTMLInputElement).value)} />
        </label>
        <label>
          <span>黒番段位</span>
          <input type="text" value={br} on:input={(e) => updateRoot("BR", (e.currentTarget as HTMLInputElement).value)} />
        </label>
      </div>

      <div class="row two">
        <label>
          <span>白番</span>
          <input type="text" value={pw} on:input={(e) => updateRoot("PW", (e.currentTarget as HTMLInputElement).value)} />
        </label>
        <label>
          <span>白番段位</span>
          <input type="text" value={wr} on:input={(e) => updateRoot("WR", (e.currentTarget as HTMLInputElement).value)} />
        </label>
      </div>

      <label class="full">
        <span>コメント（現在ノード）</span>
        <textarea rows="4" value={comment} on:input={(e) => updateComment((e.currentTarget as HTMLTextAreaElement).value)}></textarea>
      </label>
    </div>
  {/if}
</div>

<style>
  .info {
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

  .grid {
    display: grid;
    gap: 8px;
  }

  .row {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .three {
    grid-template-columns: 1.3fr minmax(76px, 0.5fr) 1fr;
  }

  .two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  label {
    min-width: 0;
    display: grid;
    gap: 4px;
    font-size: 12px;
    color: #6b7280;
  }

  .komi input {
    max-width: 7ch;
  }

  .full {
    width: 100%;
  }

  input,
  textarea {
    width: 100%;
    min-width: 0;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 14px;
    font-family: inherit;
  }

  @media (max-width: 960px) {
    .three,
    .two {
      grid-template-columns: 1fr;
    }

    .komi input {
      max-width: 100%;
    }
  }
</style>
