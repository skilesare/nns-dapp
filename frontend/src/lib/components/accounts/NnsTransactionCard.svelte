<script lang="ts">
  import type { Account } from "$lib/types/account";
  import type { Transaction as NnsTransaction } from "$lib/canisters/nns-dapp/nns-dapp.types";
  import {
    mapNnsTransaction,
    type Transaction,
  } from "$lib/utils/transactions.utils";
  import { toastsError } from "$lib/stores/toasts.store";
  import TransactionCard from "./TransactionCard.svelte";

  export let account: Account;
  export let transaction: NnsTransaction;
  export let toSelfTransaction = false;

  let transactionData: Transaction | undefined;

  $: account,
    transaction,
    (() => {
      try {
        transactionData = mapNnsTransaction({
          transaction,
          toSelfTransaction,
          account,
        });
      } catch (err: unknown) {
        transactionData = undefined;
        toastsError(
          err instanceof Error
            ? { labelKey: err.message }
            : { labelKey: "error.unknown", err }
        );
      }
    })();
</script>

{#if transactionData !== undefined}
  <TransactionCard transaction={transactionData} {toSelfTransaction} />
{/if}
