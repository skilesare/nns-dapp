<script lang="ts">
  import type { Topic } from "@dfinity/nns";
  import type { FolloweesNeuron } from "$lib/utils/neuron.utils";
  import { i18n } from "$lib/stores/i18n";
  import VotingHistoryModal from "$lib/modals/neurons/VotingHistoryModal.svelte";
  import { knownNeuronsStore } from "$lib/stores/knownNeurons.store";
  import { Tag } from "@dfinity/gix-components";

  export let followee: FolloweesNeuron;

  // TODO: Align with `en.governance.json` "topics.[topic]"
  const topicTitle = (topic: Topic) =>
    $i18n.follow_neurons[`topic_${topic}_title`];

  let modalOpen = false;
  let id: string;
  $: id = `followee-${followee.neuronId}`;
  let name: string;
  $: name =
    $knownNeuronsStore.find(({ id }) => id === followee.neuronId)?.name ??
    followee.neuronId.toString();
</script>

<button {id} class="text" on:click|stopPropagation={() => (modalOpen = true)}>
  {name}
</button>

<ul aria-labelledby={id}>
  {#each followee.topics as topic}
    <Tag tagName="li">{topicTitle(topic)}</Tag>
  {/each}
</ul>

{#if modalOpen}
  <VotingHistoryModal
    neuronId={followee.neuronId}
    on:nnsClose={() => (modalOpen = false)}
  />
{/if}

<style lang="scss">
  button {
    margin: 0 0 calc(0.5 * var(--padding));
    font-size: var(--font-size-h5);
  }

  ul {
    display: flex;
    gap: calc(0.5 * var(--padding));
    flex-wrap: wrap;

    list-style: none;

    margin-bottom: var(--padding);
    padding: 0 0 calc(2 * var(--padding));
    border-bottom: 1px solid currentColor;
  }
</style>
