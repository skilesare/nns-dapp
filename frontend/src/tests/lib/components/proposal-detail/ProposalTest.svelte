<script lang="ts">
  import { setContext } from "svelte";
  import { ProposalInfo } from "@dfinity/nns";
  import Proposal from "$lib/components/proposal-detail/Proposal.svelte";
  import {
    SELECTED_PROPOSAL_CONTEXT_KEY,
    type SelectedProposalStore,
  } from "$lib/types/selected-proposal.context";
  import { writable } from "svelte/store";

  export let proposalInfo: ProposalInfo;
  export let neuronsReady: boolean;

  const store = writable<SelectedProposalStore>({
    proposalId: proposalInfo.id,
    proposal: proposalInfo,
  });

  setContext(SELECTED_PROPOSAL_CONTEXT_KEY, { store });
</script>

<Proposal {neuronsReady} />
