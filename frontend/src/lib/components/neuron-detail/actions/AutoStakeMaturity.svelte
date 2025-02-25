<script lang="ts">
  import type { NeuronInfo } from "@dfinity/nns";
  import ConfirmationModal from "$lib/modals/ConfirmationModal.svelte";
  import { toggleAutoStakeMaturity } from "$lib/services/neurons.services";
  import { startBusy, stopBusy } from "$lib/stores/busy.store";
  import { i18n } from "$lib/stores/i18n";
  import { toastsSuccess } from "$lib/stores/toasts.store";
  import { hasAutoStakeMaturityOn } from "$lib/utils/neuron.utils";
  import { Checkbox, Html } from "@dfinity/gix-components";

  export let neuron: NeuronInfo;

  let hasAutoStakeOn: boolean;
  $: hasAutoStakeOn = hasAutoStakeMaturityOn(neuron);

  let isOpen = false;

  const showModal = () => (isOpen = true);
  const closeModal = () => (isOpen = false);

  const autoStake = async () => {
    startBusy({ initiator: "auto-stake-maturity" });

    const { success } = await toggleAutoStakeMaturity(neuron);

    if (success) {
      toastsSuccess({
        labelKey: `neuron_detail.auto_stake_maturity_${
          hasAutoStakeOn ? "on" : "off"
        }_success`,
      });
    }

    closeModal();
    stopBusy("auto-stake-maturity");
  };
</script>

<div class="auto-stake">
  <Checkbox
    preventDefault
    inputId="auto-stake-maturity-checkbox"
    checked={hasAutoStakeOn}
    on:nnsChange={showModal}
  >
    <span>{$i18n.neuron_detail.auto_stake_maturity}</span>
  </Checkbox>
</div>

{#if isOpen}
  <ConfirmationModal on:nnsClose={closeModal} on:nnsConfirm={autoStake}>
    <div data-tid="auto-stake-confirm-modal" class="wrapper">
      <h4>{$i18n.core.confirm}</h4>
      <p>
        <Html
          text={hasAutoStakeOn
            ? $i18n.neuron_detail.auto_stake_maturity_off
            : $i18n.neuron_detail.auto_stake_maturity_on}
        />
      </p>
    </div>
  </ConfirmationModal>
{/if}

<style lang="scss">
  @use "../../../themes/mixins/confirmation-modal";

  .auto-stake {
    padding: var(--padding-2x) 0 0;

    --checkbox-label-order: 1;
    --checkbox-padding: var(--padding) 0;
  }

  .wrapper {
    @include confirmation-modal.wrapper;
  }

  h4 {
    @include confirmation-modal.title;
  }

  p {
    @include confirmation-modal.text;
  }
</style>
