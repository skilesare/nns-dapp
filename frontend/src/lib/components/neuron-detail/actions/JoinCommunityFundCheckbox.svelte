<script lang="ts">
  import type { NeuronInfo } from "@dfinity/nns";
  import ConfirmationModal from "$lib/modals/ConfirmationModal.svelte";
  import { toggleCommunityFund } from "$lib/services/neurons.services";
  import { startBusy, stopBusy } from "$lib/stores/busy.store";
  import { i18n } from "$lib/stores/i18n";
  import { toastsSuccess } from "$lib/stores/toasts.store";
  import { hasJoinedCommunityFund } from "$lib/utils/neuron.utils";
  import { Checkbox, Html } from "@dfinity/gix-components";

  export let neuron: NeuronInfo;

  let isCommunityFund: boolean;
  $: isCommunityFund = hasJoinedCommunityFund(neuron);

  let isOpen = false;

  const showModal = () => (isOpen = true);
  const closeModal = () => (isOpen = false);

  const joinFund = async () => {
    startBusy({ initiator: "toggle-community-fund" });
    const successMessageKey = isCommunityFund
      ? "neuron_detail.leave_community_fund_success"
      : "neuron_detail.join_community_fund_success";
    const id = await toggleCommunityFund(neuron);
    if (id !== undefined) {
      toastsSuccess({
        labelKey: successMessageKey,
      });
    }
    closeModal();
    stopBusy("toggle-community-fund");
  };
</script>

<Checkbox
  preventDefault
  inputId="join-community-fund-checkbox"
  checked={isCommunityFund}
  on:nnsChange={showModal}
>
  <span>{$i18n.neuron_detail.participate_community_fund}</span>
</Checkbox>

{#if isOpen}
  <ConfirmationModal on:nnsClose={closeModal} on:nnsConfirm={joinFund}>
    <div data-tid="join-community-fund-modal">
      <h4>{$i18n.core.confirm}</h4>
      {#if isCommunityFund}
        <p>
          <Html text={$i18n.neuron_detail.leave_community_fund_description} />
        </p>
      {:else}
        <p>
          <Html text={$i18n.neuron_detail.join_community_fund_description} />
        </p>
      {/if}
    </div>
  </ConfirmationModal>
{/if}

<style lang="scss">
  @use "../../../themes/mixins/confirmation-modal";
  div {
    @include confirmation-modal.wrapper;
  }

  h4 {
    @include confirmation-modal.title;
  }

  p {
    @include confirmation-modal.text;
  }
</style>
