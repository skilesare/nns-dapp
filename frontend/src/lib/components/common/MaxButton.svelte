<script lang="ts">
  import { IconSubdirectory } from "@dfinity/gix-components";
  import { i18n } from "$lib/stores/i18n";
</script>

<button on:click|preventDefault class="ghost" type="button">
  <span class="icon">
    <IconSubdirectory />
  </span>
  {$i18n.core.max}
</button>

<style lang="scss">
  button {
    display: flex;
    align-items: center;
    gap: var(--padding-0_5x);
  }
  .icon {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
