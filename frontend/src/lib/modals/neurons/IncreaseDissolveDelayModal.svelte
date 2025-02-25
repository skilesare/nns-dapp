<script lang="ts">
  import { i18n } from "$lib/stores/i18n";
  import SetDissolveDelay from "$lib/components/neurons/SetDissolveDelay.svelte";
  import type { NeuronInfo } from "@dfinity/nns";
  import ConfirmDissolveDelay from "$lib/components/neurons/ConfirmDissolveDelay.svelte";
  import {
    WizardModal,
    type WizardSteps,
    type WizardStep,
  } from "@dfinity/gix-components";
  import { createEventDispatcher } from "svelte";

  export let neuron: NeuronInfo;

  const steps: WizardSteps = [
    {
      name: "SetDissolveDelay",
      title: $i18n.neurons.set_dissolve_delay,
    },
    {
      name: "ConfirmDissolveDelay",
      title: $i18n.neurons.confirm_dissolve_delay,
    },
  ];

  let currentStep: WizardStep;
  let modal: WizardModal;

  let delayInSeconds = Number(neuron.dissolveDelaySeconds);

  const dispatcher = createEventDispatcher();
  const goNext = () => {
    modal.next();
  };
  const closeModal = () => {
    dispatcher("nnsClose");
  };
</script>

<WizardModal {steps} bind:currentStep bind:this={modal} on:nnsClose>
  <svelte:fragment slot="title">{currentStep?.title}</svelte:fragment>
  {#if currentStep.name === "SetDissolveDelay"}
    <SetDissolveDelay
      {neuron}
      cancelButtonText={$i18n.core.cancel}
      confirmButtonText={$i18n.neurons.update_delay}
      minDelayInSeconds={Number(neuron.dissolveDelaySeconds)}
      on:nnsCancel={closeModal}
      on:nnsConfirmDelay={goNext}
      bind:delayInSeconds
    />
  {/if}
  {#if currentStep.name === "ConfirmDissolveDelay"}
    <ConfirmDissolveDelay
      confirmButtonText={$i18n.neurons.confirm_update_delay}
      {neuron}
      {delayInSeconds}
      on:nnsUpdated={closeModal}
      on:nnsBack={modal.back}
    />
  {/if}
</WizardModal>
