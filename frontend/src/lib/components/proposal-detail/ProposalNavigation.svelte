<script lang="ts">
  import { IconWest, IconEast } from "@dfinity/gix-components";
  import { routeStore } from "$lib/stores/route.store";
  import { AppPath } from "$lib/constants/routes.constants";
  import type { ProposalInfo } from "@dfinity/nns";
  import {
    filteredProposals,
    uiProposals,
  } from "$lib/derived/proposals.derived";
  import { onDestroy } from "svelte";
  import { i18n } from "$lib/stores/i18n";

  export let proposalInfo: ProposalInfo | undefined;

  const next = () => {
    if (nextProposal === undefined) {
      return;
    }

    routeStore.navigate({
      path: `${AppPath.ProposalDetail}/${nextProposal.id}`,
    });
  };

  const previous = () => {
    if (previousProposal === undefined) {
      return;
    }

    routeStore.navigate({
      path: `${AppPath.ProposalDetail}/${previousProposal.id}`,
    });
  };

  let previousProposal: ProposalInfo | undefined;
  let nextProposal: ProposalInfo | undefined;

  const reset = () => {
    nextProposal = undefined;
    previousProposal = undefined;
  };

  $: proposalInfo,
    (() => {
      if (proposalInfo === undefined) {
        reset();
        return;
      }

      // TODO: replace [...array].reverse().find() with findLast() once Firefox >= v104 is widely adopted - https://caniuse.com/?search=findlast
      previousProposal = [...$filteredProposals.proposals]
        .reverse()
        .find(
          ({ id }) =>
            proposalInfo?.id !== undefined &&
            id !== undefined &&
            id > proposalInfo.id
        );
      nextProposal = $filteredProposals.proposals.find(
        ({ id }) =>
          proposalInfo?.id !== undefined &&
          id !== undefined &&
          id < proposalInfo.id
      );
    })();

  onDestroy(reset);

  let lastProposal: boolean;
  $: lastProposal =
    proposalInfo !== undefined &&
    nextProposal === undefined &&
    previousProposal === undefined;
</script>

{#if $uiProposals.proposals.length > 0 && !lastProposal}
  <div role="toolbar">
    <button
      class="ghost"
      type="button"
      aria-label={$i18n.proposal_detail.previous}
      on:click={previous}
      class:hidden={proposalInfo !== undefined &&
        previousProposal === undefined}
      disabled={proposalInfo !== undefined && previousProposal === undefined}
      data-tid="proposal-nav-previous"
    >
      <IconWest />
      {$i18n.core.previous}</button
    >

    <button
      class="ghost"
      type="button"
      aria-label={$i18n.proposal_detail.next}
      on:click={next}
      class:hidden={proposalInfo !== undefined && nextProposal === undefined}
      disabled={proposalInfo !== undefined && nextProposal === undefined}
      data-tid="proposal-nav-next"
    >
      {$i18n.core.next}
      <IconEast />
    </button>
  </div>
{/if}

<style lang="scss">
  div {
    display: flex;
    justify-content: space-between;

    margin-bottom: var(--padding-3x);
  }

  button {
    display: flex;
    align-items: center;
    gap: var(--padding-0_5x);

    font-size: inherit;

    &.hidden {
      visibility: hidden;
      opacity: 0;
    }
  }
</style>
