<script lang="ts">
  import type { Transaction as NnsTransaction } from "$lib/canisters/nns-dapp/nns-dapp.types";
  import type { Account } from "$lib/types/account";
  import { i18n } from "$lib/stores/i18n";
  import SkeletonCard from "$lib/components/ui/SkeletonCard.svelte";
  import NnsTransactionCard from "./NnsTransactionCard.svelte";
  import { getContext } from "svelte";
  import {
    SELECTED_ACCOUNT_CONTEXT_KEY,
    type SelectedAccountContext,
  } from "$lib/types/selected-account.context";
  import { mapToSelfNnsTransaction } from "$lib/utils/transactions.utils";

  export let transactions: NnsTransaction[] | undefined;

  const { store } = getContext<SelectedAccountContext>(
    SELECTED_ACCOUNT_CONTEXT_KEY
  );

  let account: Account | undefined;
  $: ({ account } = $store);

  let extendedTransactions: {
    transaction: NnsTransaction;
    toSelfTransaction: boolean;
  }[];
  $: extendedTransactions = mapToSelfNnsTransaction(transactions ?? []);
</script>

{#if account === undefined || transactions === undefined}
  <SkeletonCard cardType="info" />
{:else if transactions.length === 0}
  {$i18n.wallet.no_transactions}
{:else}
  {#each extendedTransactions as { toSelfTransaction, transaction } (`${transaction.timestamp.timestamp_nanos}${toSelfTransaction}`)}
    <NnsTransactionCard {account} {transaction} {toSelfTransaction} />
  {/each}
{/if}
