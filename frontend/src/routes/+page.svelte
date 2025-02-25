<script lang="ts">
  import Route from "$lib/components/common/Route.svelte";
  import PrivateRoute from "$lib/components/common/PrivateRoute.svelte";
  import Guard from "$lib/components/common/Guard.svelte";
  import type { Unsubscriber } from "svelte/types/runtime/store";
  import { onDestroy, onMount } from "svelte";
  import { authStore } from "$lib/stores/auth.store";
  import type { AuthStore } from "$lib/stores/auth.store";
  import { routeStore } from "$lib/stores/route.store";
  import { AppPath } from "$lib/constants/routes.constants";
  import { Toasts, BusyScreen } from "@dfinity/gix-components";
  import { initWorker } from "$lib/services/worker.services";
  import { initApp } from "$lib/services/app.services";
  import { syncBeforeUnload } from "$lib/utils/before-unload.utils";
  import { voteRegistrationActive } from "$lib/utils/proposals.utils";
  import { voteRegistrationStore } from "$lib/stores/vote-registration.store";

  let worker: { syncAuthIdle: (auth: AuthStore) => void } | undefined;

  onMount(async () => (worker = await initWorker()));

  const unsubscribeAuth: Unsubscriber = authStore.subscribe(
    async (auth: AuthStore) => {
      worker?.syncAuthIdle(auth);

      if (!auth.identity) {
        return;
      }

      await initApp();
    }
  );

  const unsubscribeRoute: Unsubscriber = routeStore.subscribe(
    ({ isKnownPath }) => {
      if (isKnownPath) {
        return;
      }
      // if the path is unsupported (to mock the flutter dapp) the user will be redirected to the first page (/accounts/) page (unknown path will not be saved in session History)
      routeStore.replace({ path: AppPath.LegacyAccounts });
    }
  );

  const unsubscribeVoteInProgress: Unsubscriber =
    voteRegistrationStore.subscribe(({ registrations }) =>
      syncBeforeUnload(voteRegistrationActive(registrations))
    );

  onDestroy(() => {
    unsubscribeAuth();
    unsubscribeRoute();
    unsubscribeVoteInProgress();
  });
</script>

<Guard>
  <Route path={AppPath.Authentication} />
  <PrivateRoute path={AppPath.Accounts} />
  <PrivateRoute path={AppPath.LegacyAccounts} />
  <PrivateRoute path={AppPath.LegacyNeurons} />
  <PrivateRoute path={AppPath.Neurons} />
  <PrivateRoute path={AppPath.Proposals} />
  <PrivateRoute path={AppPath.Canisters} />
  <PrivateRoute path={AppPath.LegacyWallet} />
  <PrivateRoute path={AppPath.Wallet} />
  <PrivateRoute path={AppPath.ProposalDetail} />
  <PrivateRoute path={AppPath.LegacyNeuronDetail} />
  <PrivateRoute path={AppPath.CanisterDetail} />
  <PrivateRoute path={AppPath.Launchpad} />
  <PrivateRoute path={AppPath.ProjectDetail} />
  <PrivateRoute path={AppPath.NeuronDetail} />
</Guard>

<Toasts />
<BusyScreen />
