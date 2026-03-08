<script lang="ts">
  import { tick } from "svelte";

  export let open = false;
  export let ariaLabel = "確認ダイアログ";
  export let title = "確認";
  export let message = "";
  export let cancelLabel = "キャンセル";
  export let confirmLabel = "OK";
  export let confirmKind: "normal" | "danger" = "normal";
  export let onCancel: () => void = () => {};
  export let onConfirm: () => void = () => {};

  let cancelButton: HTMLButtonElement | null = null;

  const onWindowKeydown = (event: KeyboardEvent): void => {
    if (!open) {
      return;
    }
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    onCancel();
  };

  $: if (open) {
    void tick().then(() => {
      cancelButton?.focus();
    });
  }
</script>

<svelte:window on:keydown={onWindowKeydown} />

{#if open}
  <div class="confirm-modal-backdrop" role="presentation">
    <div class="confirm-modal" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <p class="confirm-modal-title">{title}</p>
      <p class="confirm-modal-text">{message}</p>
      <div class="confirm-modal-actions">
        <button type="button" bind:this={cancelButton} on:click={onCancel}>{cancelLabel}</button>
        <button type="button" class:danger={confirmKind === "danger"} on:click={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confirm-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 23, 0.62);
    display: grid;
    place-items: center;
    z-index: 1000;
    padding: 16px;
  }

  .confirm-modal {
    width: min(460px, 100%);
    display: grid;
    gap: 10px;
    border: 1px solid #374151;
    border-radius: 8px;
    padding: 16px;
    background: #111827;
    color: #e5e7eb;
  }

  .confirm-modal-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #e5e7eb;
  }

  .confirm-modal-text {
    margin: 0;
    font-size: 14px;
    color: #94a3b8;
  }

  .confirm-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .confirm-modal-actions button {
    border: 1px solid #475569;
    background: #1f2937;
    color: #e5e7eb;
    border-radius: 8px;
    padding: 7px 12px;
    cursor: pointer;
  }

  .confirm-modal-actions button:hover {
    background: #334155;
  }

  .confirm-modal-actions button.danger {
    border-color: #b91c1c;
    background: #3f1d1d;
    color: #fecaca;
  }

  .confirm-modal-actions button.danger:hover {
    background: #522727;
  }
</style>
