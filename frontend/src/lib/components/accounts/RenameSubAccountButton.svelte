<script lang="ts">
  import RenameSubAccountModal from "$lib/modals/accounts/RenameSubAccountModal.svelte";
  import { i18n } from "$lib/stores/i18n";

  let modalOpen = false;
</script>

<button
  class="primary"
  type="button"
  on:click={() => (modalOpen = true)}
  data-tid="open-rename-subaccount-button"
>
  {$i18n.accounts.rename}
</button>

{#if modalOpen}
  <RenameSubAccountModal on:nnsClose={() => (modalOpen = false)} />
{/if}
