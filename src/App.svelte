<script lang="ts">
  import { onMount } from "svelte";
  import { listen } from "@tauri-apps/api/event";
  import BoardCanvas from "./lib/components/BoardCanvas.svelte";
  import PlaybackControls from "./lib/components/PlaybackControls.svelte";
  import InfoPanel from "./lib/components/InfoPanel.svelte";
  import VariationPanel from "./lib/components/VariationPanel.svelte";
  import logoKifu from "./lib/assets/logo-kifu.svg";
  import { openSgfFile, pickSaveSgfFile, pickSgfFile, saveSgfTextFile } from "./lib/tauri/commands";
  import { serializeSgfCollection } from "./lib/sgf/serializer";
  import { canonicalSgf, createEmptyCollection, currentFilePath, ensureCollection, isDirty, setCollection } from "./lib/stores/sgf";
  import { goToStart } from "./lib/stores/playback";
  import { setUiError, setUiInfo } from "./lib/stores/ui";

  let openedName = "";
  let showUnsavedConfirm = false;
  let pendingAction: "new" | "open" | null = null;

  const basename = (path: string): string => {
    return path.split(/[\\/]/).pop() ?? path;
  };

  const openFromPath = async (path: string) => {
    try {
      const loaded = await openSgfFile(path);
      setCollection(loaded);
      currentFilePath.set(path);
      openedName = basename(path);
      goToStart();
      setUiInfo(`読み込み成功: ${basename(path)}`);
    } catch (error) {
      setUiError(`読み込み失敗: ${String(error)}`);
    }
  };

  const runOpenFlow = async () => {
    try {
      const path = await pickSgfFile();
      if (!path) {
        return;
      }
      await openFromPath(path);
    } catch (error) {
      setUiError(`ファイル選択に失敗: ${String(error)}`);
    }
  };

  const onOpenClick = async () => {
    if ($isDirty) {
      pendingAction = "open";
      showUnsavedConfirm = true;
      return;
    }
    await runOpenFlow();
  };

  const onSaveClick = async () => {
    try {
      const collection = ensureCollection();
      const sgfText = serializeSgfCollection(collection);
      let savePath = $currentFilePath;
      if (!savePath) {
        const picked = await pickSaveSgfFile();
        if (!picked) {
          return;
        }
        savePath = picked;
        currentFilePath.set(savePath);
        openedName = basename(savePath);
      }

      await saveSgfTextFile(savePath, sgfText);
      isDirty.set(false);
      setUiInfo(`保存成功: ${basename(savePath)}`);
    } catch (error) {
      setUiError(`保存失敗: ${String(error)}`);
    }
  };

  const runNewFlow = () => {
    setCollection(createEmptyCollection());
    currentFilePath.set("");
    openedName = "";
    setUiInfo("新規棋譜を作成しました。");
    goToStart();
  };

  const onNewClick = () => {
    if ($isDirty) {
      pendingAction = "new";
      showUnsavedConfirm = true;
      return;
    }
    runNewFlow();
  };

  const onUnsavedConfirmCancel = () => {
    showUnsavedConfirm = false;
    pendingAction = null;
  };

  const onUnsavedConfirmProceed = async () => {
    showUnsavedConfirm = false;
    const action = pendingAction;
    pendingAction = null;
    if (action === "new") {
      runNewFlow();
      return;
    }
    if (action === "open") {
      await runOpenFlow();
    }
  };

  onMount(() => {
    if (!$canonicalSgf) {
      setCollection(createEmptyCollection());
    }

    const unlistenPromise = listen<string>("file-open-request", async (event) => {
      await openFromPath(event.payload);
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  });
</script>

<main class="app">
  <section class="toolbar panel">
    <div class="brand">
      <img src={logoKifu} alt="Go Kifu Viewer logo" />
      <div class="titles">
        <strong>Go Kifu Viewer</strong>
        <span>棋譜ビューア</span>
      </div>
    </div>
    <button type="button" on:click={onNewClick}>新規</button>
    <button type="button" on:click={onOpenClick}>開く...</button>
    <button type="button" on:click={onSaveClick}>保存</button>
    <span class="meta">{#if openedName}現在: {openedName}{/if}</span>
    <span class="meta">{#if $isDirty}未保存の変更あり{/if}</span>
  </section>

  <section class="panel board-panel">
    <BoardCanvas />
  </section>

  <section class="panel">
    <PlaybackControls />
  </section>

  <section class="panel two-col">
    <VariationPanel />
    <InfoPanel />
  </section>

  {#if showUnsavedConfirm}
    <div class="modal-backdrop" role="presentation">
      <div class="modal panel" role="dialog" aria-modal="true" aria-label="未保存確認">
        <p class="modal-title">未保存の変更があります</p>
        <p class="modal-text">保存せずに続行してもよろしいですか？</p>
        <div class="modal-actions">
          <button type="button" on:click={onUnsavedConfirmCancel}>キャンセル</button>
          <button type="button" class="danger" on:click={onUnsavedConfirmProceed}>保存せずに続行</button>
        </div>
      </div>
    </div>
  {/if}
</main>
