<script lang="ts">
  import { i18n } from "$lib/stores/i18n";
  import { IconClose } from "@dfinity/gix-components";
  import { DEV, IS_TESTNET } from "$lib/constants/environment.constants";

  const localstorageKey = "nnsdapp-testnet-banner-display";

  let visible = JSON.parse(
    localStorage.getItem(localstorageKey) ?? "true"
  ) as boolean;

  const testnet = IS_TESTNET;
  const localEnv = DEV;
  const banner = testnet && !localEnv;

  const close = () => {
    visible = false;

    localStorage.setItem(localstorageKey, "false");
  };

  $: visible,
    (() => {
      if (!banner) {
        // If no banner has to be displayed, setting or removing the header offset can be skipped
        return;
      }

      const {
        documentElement: { style },
      } = document;

      if (visible) {
        style.setProperty("--header-offset", "50px");
        return;
      }

      style.removeProperty("--header-offset");
    })();
</script>

{#if banner && visible}
  <div>
    <h4>For <strong>test</strong> purpose only.</h4>
    <button on:click={close} aria-label={$i18n.core.close}><IconClose /></button
    >
  </div>
{/if}

<style lang="scss">
  @use "@dfinity/gix-components/styles/mixins/text";

  div {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;

    z-index: var(--z-index);

    height: var(--header-offset);

    display: grid;
    grid-template-columns: 25% 50% 25%;

    justify-content: center;
    align-items: center;

    background: var(--negative-emphasis-light);
    color: var(--negative-emphasis-light-contrast);

    :global(:root) {
      --header-offset: 60px;
    }
  }

  h4 {
    font-weight: 400;
    @include text.clamp(2);

    margin: 0;

    grid-column-start: 2;

    text-align: center;

    line-height: inherit;
  }

  button {
    display: flex;
    justify-self: flex-end;
    margin: 0 var(--padding);
  }
</style>
