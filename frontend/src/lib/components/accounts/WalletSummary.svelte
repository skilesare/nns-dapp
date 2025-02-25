<script lang="ts">
  import { ICPToken, TokenAmount } from "@dfinity/nns";
  import { accountName as getAccountName } from "$lib/utils/accounts.utils";
  import { i18n } from "$lib/stores/i18n";
  import AmountDisplay from "$lib/components/ic/AmountDisplay.svelte";
  import Identifier from "$lib/components/ui/Identifier.svelte";
  import { isAccountHardwareWallet } from "$lib/utils/accounts.utils";
  import { getContext } from "svelte";
  import {
    SELECTED_ACCOUNT_CONTEXT_KEY,
    type SelectedAccountContext,
  } from "$lib/types/selected-account.context";
  import { formatToken } from "$lib/utils/token.utils";
  import Tooltip from "$lib/components/ui/Tooltip.svelte";
  import { replacePlaceholders } from "$lib/utils/i18n.utils";

  const { store } = getContext<SelectedAccountContext>(
    SELECTED_ACCOUNT_CONTEXT_KEY
  );

  let accountName: string;
  $: accountName = getAccountName({
    account: $store.account,
    mainName: $i18n.accounts.main,
  });

  let accountBalance: TokenAmount;
  $: accountBalance =
    $store.account?.balance ??
    (TokenAmount.fromString({ amount: "0", token: ICPToken }) as TokenAmount);

  let detailedICP: string;
  $: detailedICP = formatToken({
    value: accountBalance.toE8s(),
    detailed: true,
  });
</script>

<div class="title" data-tid="wallet-summary">
  <h1>{accountName}</h1>
  <Tooltip
    id="wallet-detailed-icp"
    text={replacePlaceholders($i18n.accounts.current_balance_detail, {
      $amount: detailedICP,
    })}
  >
    <AmountDisplay amount={accountBalance} />
  </Tooltip>
</div>
<div class="address">
  <Identifier
    identifier={$store.account?.identifier ?? ""}
    label={$i18n.wallet.address}
    showCopy
    size="medium"
  />
  {#if isAccountHardwareWallet($store.account)}
    <Identifier
      identifier={$store.account?.principal?.toString() ?? ""}
      label={$i18n.wallet.principal}
      showCopy
    />
  {/if}
</div>

<style lang="scss">
  @use "@dfinity/gix-components/styles/mixins/media";

  .title {
    display: block;
    width: 100%;

    margin: 0 0 var(--padding-2x);

    --token-font-size: var(--font-size-h1);
    --tooltip-display: inline-block;

    // Minimum height of ICP value + ICP label (ICP component)
    min-height: calc(
      var(--line-height-standard) * (var(--token-font-size) + 1rem)
    );

    @include media.min-width(medium) {
      display: inline-flex;
      justify-content: space-between;
      align-items: baseline;
    }
  }

  .address {
    margin-bottom: var(--padding-4x);
    :global(p:first-of-type) {
      margin-bottom: var(--padding);
    }
  }
</style>
