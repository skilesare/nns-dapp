<script lang="ts">
  import { NeuronState } from "@dfinity/nns";
  import type { NeuronId } from "@dfinity/nns";
  import ConfirmationModal from "$lib/modals/ConfirmationModal.svelte";
  import {
    startDissolving,
    stopDissolving,
  } from "$lib/services/neurons.services";
  import { stopBusy } from "$lib/stores/busy.store";
  import { i18n } from "$lib/stores/i18n";
  import { startBusyNeuron } from "$lib/services/busy.services";
  import { keyOf } from "$lib/utils/utils";

  export let neuronId: NeuronId;
  export let neuronState: NeuronState;

  let isOpen = false;

  const showModal = () => (isOpen = true);
  const closeModal = () => (isOpen = false);

  let isDissolving: boolean;
  let buttonKey: string;
  let descriptionKey: string;
  $: {
    isDissolving = neuronState === NeuronState.Dissolving;
    buttonKey = isDissolving ? "stop_dissolving" : "start_dissolving";
    descriptionKey = isDissolving
      ? "stop_dissolve_description"
      : "start_dissolve_description";
  }

  const dissolveAction = async () => {
    const action = isDissolving ? stopDissolving : startDissolving;
    startBusyNeuron({ initiator: "dissolve-action", neuronId });
    await action(neuronId);
    closeModal();
    stopBusy("dissolve-action");
  };
</script>

<button on:click={showModal} class="warning"
  >{keyOf({ obj: $i18n.neuron_detail, key: buttonKey })}</button
>
{#if isOpen}
  <ConfirmationModal on:nnsClose={closeModal} on:nnsConfirm={dissolveAction}>
    <div data-tid="dissolve-action-modal">
      <h4>{$i18n.core.confirm}</h4>
      <p>{keyOf({ obj: $i18n.neuron_detail, key: descriptionKey })}</p>
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
