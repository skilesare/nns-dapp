<script lang="ts">
  import { IconFiberNew } from "@dfinity/gix-components";
  import { i18n } from "$lib/stores/i18n";
</script>

<span aria-label={$i18n.core.badgeNew}>
  <IconFiberNew />
</span>

<style lang="scss">
  span {
    width: var(--padding-4x);
    height: auto;
    line-height: 0;
    color: var(--primary);

    :global(svg) {
      width: 100%;
      height: auto;
    }
  }
</style>
