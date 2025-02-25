<script lang="ts">
  import type { SvelteComponent } from "svelte";
  import { onMount } from "svelte";
  import { AppPath } from "$lib/constants/routes.constants";
  import { Spinner } from "@dfinity/gix-components";
  import Layout from "./Layout.svelte";
  import AuthLayout from "./AuthLayout.svelte";
  import { layoutBackStore, layoutTitleStore } from "$lib/stores/layout.store";
  import { i18n } from "$lib/stores/i18n";
  import { isNode } from "$lib/utils/dev.utils";

  export let path: AppPath;

  let component: typeof SvelteComponent | undefined = undefined;

  const loadModule = async (): Promise<typeof SvelteComponent> => {
    switch (path) {
      case AppPath.Accounts:
      case AppPath.LegacyAccounts:
        return (await import("../../routes/Accounts.svelte")).default;
      case AppPath.LegacyNeurons:
      case AppPath.Neurons:
        return (await import("../../routes/Neurons.svelte")).default;
      case AppPath.Proposals:
        return (await import("../../routes/Proposals.svelte")).default;
      case AppPath.Canisters:
        return (await import("../../routes/Canisters.svelte")).default;
      case AppPath.Wallet:
        return (await import("../../routes/Wallet.svelte")).default;
      case AppPath.LegacyWallet:
        return (await import("../../routes/LegacyWallet.svelte")).default;
      case AppPath.ProposalDetail:
        return (await import("../../routes/ProposalDetail.svelte")).default;
      case AppPath.LegacyNeuronDetail:
        return (await import("../../routes/LegacyNeuronDetail.svelte")).default;
      case AppPath.CanisterDetail:
        return (await import("../../routes/CanisterDetail.svelte")).default;
      case AppPath.Launchpad:
        return (await import("../../routes/Launchpad.svelte")).default;
      case AppPath.ProjectDetail:
        return (await import("../../routes/ProjectDetail.svelte")).default;
      case AppPath.NeuronDetail:
        return (await import("../../routes/NeuronDetail.svelte")).default;
      default:
        return (await import("../../routes/Auth.svelte")).default;
    }
  };

  const routesConfig: Record<AppPath, { title: string }> = {
    [AppPath.Authentication]: {
      title: "",
    },
    [AppPath.Accounts]: {
      title: $i18n.navigation.tokens,
    },
    [AppPath.LegacyAccounts]: {
      title: $i18n.navigation.tokens,
    },
    [AppPath.LegacyNeurons]: {
      title: $i18n.navigation.neurons,
    },
    [AppPath.Neurons]: {
      title: $i18n.navigation.neurons,
    },
    [AppPath.Proposals]: {
      title: $i18n.navigation.voting,
    },
    [AppPath.Canisters]: {
      title: $i18n.navigation.canisters,
    },
    [AppPath.Wallet]: { title: $i18n.wallet.title },
    [AppPath.LegacyWallet]: { title: $i18n.wallet.title },
    [AppPath.ProposalDetail]: {
      title: $i18n.proposal_detail.title,
    },
    [AppPath.LegacyNeuronDetail]: {
      title: $i18n.neuron_detail.title,
    },
    [AppPath.CanisterDetail]: {
      title: $i18n.canister_detail.title,
    },
    [AppPath.Launchpad]: {
      title: $i18n.sns_launchpad.header,
    },
    [AppPath.NeuronDetail]: {
      title: $i18n.sns_neuron_detail.header,
    },
    [AppPath.ProjectDetail]: { title: "" },
  };

  onMount(async () => {
    layoutTitleStore.set(routesConfig[path].title);

    // Reset back action because only detail routes have such feature other views use the menu
    layoutBackStore.set(undefined);

    // Lazy loading not supported in jest environment
    if (isNode()) {
      return;
    }

    component = await loadModule();
  });

  let authLayout = true;
  $: authLayout = path === AppPath.Authentication;

  let layout: typeof SvelteComponent | undefined = undefined;
  $: layout = authLayout ? AuthLayout : Layout;
</script>

<svelte:component this={layout}>
  {#if component !== undefined}
    <svelte:component this={component} />
  {:else}
    <div class:authLayout>
      <Spinner />
    </div>
  {/if}
</svelte:component>

<style lang="scss">
  @use "../../themes/mixins/login";
  @use "@dfinity/gix-components/styles/mixins/display";

  div {
    position: absolute;
    @include display.inset;

    color: rgba(var(--background-contrast-rgb), var(--very-light-opacity));
  }

  .authLayout {
    @include login.background;
  }
</style>
