<script lang="ts">
  import { ICPToken, TokenAmount, type NeuronInfo } from "@dfinity/nns";
  import { i18n } from "$lib/stores/i18n";
  import {
    getDissolvingTimeInSeconds,
    getSpawningTimeInSeconds,
    hasJoinedCommunityFund,
    isHotKeyControllable,
    isSpawning,
    neuronStake,
  } from "$lib/utils/neuron.utils";
  import AmountDisplay from "$lib/components/ic/AmountDisplay.svelte";
  import { authStore } from "$lib/stores/auth.store";
  import type { CardType } from "$lib/types/card";
  import NeuronCardContainer from "./NeuronCardContainer.svelte";
  import { IconStackedLineChart } from "@dfinity/gix-components";
  import NeuronStateInfo from "./NeuronStateInfo.svelte";
  import NeuronStateRemainingTime from "./NeuronStateRemainingTime.svelte";

  export let neuron: NeuronInfo;
  export let proposerNeuron = false;
  // Setting default value avoids warning missing props during testing
  export let role: undefined | "link" | "button" | "checkbox" = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let selected = false;
  export let disabled = false;
  export let cardType: CardType = "card";

  let isCommunityFund: boolean;
  $: isCommunityFund = hasJoinedCommunityFund(neuron);
  let neuronICP: TokenAmount;
  $: neuronICP = TokenAmount.fromE8s({
    amount: neuronStake(neuron),
    token: ICPToken,
  });
  let isHotKeyControl: boolean;
  $: isHotKeyControl = isHotKeyControllable({
    neuron,
    identity: $authStore.identity,
  });
  let dissolvingTime: bigint | undefined;
  $: dissolvingTime = getDissolvingTimeInSeconds(neuron);

  let spawningTime: bigint | undefined;
  $: spawningTime = getSpawningTimeInSeconds(neuron);
</script>

<NeuronCardContainer
  {role}
  {selected}
  {disabled}
  {ariaLabel}
  on:click
  {cardType}
>
  <div slot="start" class="lock" data-tid="neuron-card-title">
    <h3 data-tid="neuron-id">{neuron.neuronId}</h3>

    {#if isCommunityFund}
      <span>{$i18n.neurons.community_fund}</span>
    {/if}
    {#if isHotKeyControl}
      <span>{$i18n.neurons.hotkey_control}</span>
    {/if}
  </div>

  <div slot="end" class="currency">
    {#if isSpawning(neuron)}
      <IconStackedLineChart />
    {:else if proposerNeuron}
      <AmountDisplay
        label={$i18n.neurons.voting_power}
        amount={TokenAmount.fromE8s({
          amount: neuron.votingPower,
          token: ICPToken,
        })}
        detailed
      />
    {:else if neuronICP}
      <AmountDisplay amount={neuronICP} detailed />
    {/if}
  </div>

  <NeuronStateInfo state={neuron.state} />

  <NeuronStateRemainingTime
    state={neuron.state}
    timeInSeconds={dissolvingTime ??
      spawningTime ??
      neuron.dissolveDelaySeconds}
  />

  <slot />
</NeuronCardContainer>

<style lang="scss">
  @use "@dfinity/gix-components/styles/mixins/card";

  // TODO: avoid root global styling
  :global(div.modal article > div) {
    margin-bottom: 0;
  }

  h3 {
    line-height: var(--line-height-standard);
    margin-bottom: 0;
  }

  .lock {
    @include card.stacked-title;
  }

  .currency {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
</style>
