<script lang="ts">
  import type { NeuronInfo } from "@dfinity/nns";
  import type { Topic } from "@dfinity/nns";
  import FollowTopicSection from "./FollowTopicSection.svelte";
  import { i18n } from "$lib/stores/i18n";
  import { onMount } from "svelte";
  import { listKnownNeurons } from "$lib/services/knownNeurons.services";
  import { topicsToFollow } from "$lib/utils/neuron.utils";

  export let neuron: NeuronInfo;

  // Load KnownNeurons which are used in the FollowTopicSections
  onMount(() => listKnownNeurons());

  const topics: Topic[] = topicsToFollow(neuron);
</script>

<div data-tid="edit-followers-screen">
  <p class="description">{$i18n.follow_neurons.description}</p>
  <div>
    {#each topics as topic}
      <FollowTopicSection {neuron} {topic} />
    {/each}
  </div>
 
  <h3>
    {$i18n.topics_description.Advanced}
  </h3>
  <div>
     <FollowTopicSection {neuron} topic={1} />
  </div>
</div>

<style lang="scss">
  div {
    display: flex;
    flex-direction: column;
    gap: var(--padding-1_5x);
  }
</style>
