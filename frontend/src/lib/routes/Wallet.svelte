<script lang="ts">
  import { isNnsProjectStore } from "$lib/derived/selected-project.derived";
  import NnsWallet from "$lib/pages/NnsWallet.svelte";
  import SnsWallet from "$lib/pages/SnsWallet.svelte";
</script>

{#if $isNnsProjectStore}
  <NnsWallet />
{:else}
  <SnsWallet />
{/if}
