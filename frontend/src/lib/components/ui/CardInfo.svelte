<script lang="ts">
  // Same data-tid as <Card /> for backwards compatibility with existing jest test
  export let testId = "card";

  let showHeadline: boolean;
  $: showHeadline = $$slots.start !== undefined || $$slots.end !== undefined;
</script>

<article data-tid={testId}>
  {#if showHeadline}
    <div>
      <slot name="start" />
      <slot name="end" />
    </div>
  {/if}

  <slot />
</article>

<style lang="scss">
  @use "@dfinity/gix-components/styles/mixins/interaction";
  @use "@dfinity/gix-components/styles/mixins/media";
  @use "@dfinity/gix-components/styles/mixins/display";

  article {
    text-decoration: none;

    padding: var(--padding-2x) 0;
    margin: var(--padding-2x) 0;

    outline: 2px solid transparent;

    box-shadow: none;
  }

  div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    @include media.min-width(small) {
      @include display.space-between;
      flex-direction: row;

      margin: 0 0 var(--padding);
    }
  }
</style>
