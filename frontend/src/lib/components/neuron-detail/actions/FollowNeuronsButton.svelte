<script lang="ts">
  import { i18n } from "$lib/stores/i18n";
  import type { NeuronInfo } from "@dfinity/nns";
  import FollowNeuronsModal from "$lib/modals/neurons/FollowNeuronsModal.svelte";

  export let neuron: NeuronInfo;

  let showModal = false;
  const openModal = () => (showModal = true);
  const closeModal = () => (showModal = false);
</script>

<button class="primary" on:click={openModal}
  >{$i18n.neuron_detail.follow_neurons}</button
>

{#if showModal}
  <FollowNeuronsModal on:nnsClose={closeModal} {neuron} />
{/if}
