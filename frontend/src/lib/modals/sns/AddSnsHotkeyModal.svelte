<script lang="ts">
  import { Modal } from "@dfinity/gix-components";
  import type { Principal } from "@dfinity/principal";
  import { i18n } from "$lib/stores/i18n";
  import { startBusy, stopBusy } from "$lib/stores/busy.store";
  import { addHotkey } from "$lib/services/sns-neurons.services";
  import { createEventDispatcher, getContext } from "svelte";
  import { toastsError } from "$lib/stores/toasts.store";
  import AddPrincipal from "$lib/components/common/AddPrincipal.svelte";
  import { snsProjectSelectedStore } from "$lib/derived/selected-project.derived";
  import {
    SELECTED_SNS_NEURON_CONTEXT_KEY,
    type SelectedSnsNeuronContext,
  } from "$lib/types/sns-neuron-detail.context";

  const { reload, store }: SelectedSnsNeuronContext =
    getContext<SelectedSnsNeuronContext>(SELECTED_SNS_NEURON_CONTEXT_KEY);

  let principal: Principal | undefined = undefined;
  const dispatcher = createEventDispatcher();

  const add = async () => {
    // Edge case: button is only enabled when principal is defined
    if (principal === undefined) {
      toastsError({
        labelKey: "error.principal_not_valid",
      });
      return;
    }
    // Edge case: modal can't be shown when neuron is not defined
    const neuronId = $store.neuron?.id[0];
    if (neuronId === undefined) {
      return;
    }
    startBusy({ initiator: "add-sns-hotkey-neuron" });
    const { success } = await addHotkey({
      neuronId,
      hotkey: principal,
      rootCanisterId: $snsProjectSelectedStore,
    });
    if (success) {
      await reload();
    }
    stopBusy("add-sns-hotkey-neuron");
    if (success) {
      dispatcher("nnsClose");
    }
  };
</script>

<Modal on:nnsClose testId="add-hotkey-neuron-modal">
  <svelte:fragment slot="title"
    >{$i18n.neuron_detail.add_hotkey_modal_title}</svelte:fragment
  >

  <AddPrincipal bind:principal on:nnsSelectPrincipal={add} on:nnsClose>
    <span slot="title">{$i18n.neuron_detail.enter_hotkey}</span>
    <span slot="button">{$i18n.core.confirm}</span>
  </AddPrincipal>
</Modal>
