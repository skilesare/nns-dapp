<script lang="ts">
  import { i18n } from "$lib/stores/i18n";
  import { formatCyclesToTCycles } from "$lib/utils/canisters.utils";
  import CardInfo from "$lib/components/ui/CardInfo.svelte";

  export let cycles: bigint;
</script>

<CardInfo testId="canister-cycles-card">
  <p aria-label={$i18n.canister_detail.cycles}>
    <span class="cycles value">{formatCyclesToTCycles(cycles)}</span>
    <span>{$i18n.canister_detail.t_cycles}</span>
  </p>
</CardInfo>

<style lang="scss">
  p {
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: var(--padding);
  }

  .cycles {
    font-weight: 700;
    font-size: var(--font-size-h3);
  }
</style>
