<script lang="ts">
  import { Vote } from "@dfinity/nns";
  import { IconThumbDown, IconThumbUp } from "@dfinity/gix-components";
  import { i18n } from "$lib/stores/i18n";
  import { replacePlaceholders } from "$lib/utils/i18n.utils";
  import { formatVotingPower } from "$lib/utils/neuron.utils";
  import ConfirmationModal from "$lib/modals/ConfirmationModal.svelte";

  export let voteType: Vote;
  export let votingPower: bigint;
</script>

<ConfirmationModal on:nnsClose on:nnsConfirm>
  <div>
    {#if voteType === Vote.Yes}
      <IconThumbUp />
      <h4>{$i18n.proposal_detail__vote.confirm_adopt_headline}</h4>
      <p>
        {replacePlaceholders($i18n.proposal_detail__vote.confirm_adopt_text, {
          $votingPower: formatVotingPower(votingPower),
        })}
      </p>
    {:else}
      <IconThumbDown />
      <h4>{$i18n.proposal_detail__vote.confirm_reject_headline}</h4>
      <p>
        {replacePlaceholders($i18n.proposal_detail__vote.confirm_reject_text, {
          $votingPower: formatVotingPower(votingPower),
        })}
      </p>
    {/if}
  </div>
</ConfirmationModal>

<style lang="scss">
  @use "@dfinity/gix-components/styles/mixins/media";
  @use "@dfinity/gix-components/styles/mixins/text";

  div {
    padding: var(--padding-2x) 0;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: var(--padding-1_5x);

    color: var(--background-contrast);

    :global(svg) {
      width: var(--padding-6x);
      height: var(--padding-6x);
    }
  }

  h4 {
    margin: 0;
    font-size: var(--font-size-h3);
  }

  p {
    margin: 0;

    font-size: var(--font-size-h4);
    text-align: center;
  }
</style>
