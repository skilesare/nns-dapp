import type { CanisterDetails } from "$lib/canisters/ic-management/ic-management.canister.types";
import type { CanisterDetails as CanisterInfo } from "$lib/canisters/nns-dapp/nns-dapp.types";
import { ONE_TRILLION } from "$lib/constants/icp.constants";
import type { AuthStore } from "$lib/stores/auth.store";
import type { CanistersStore } from "$lib/stores/canisters.store";
import { formatNumber } from "./format.utils";

export const getCanisterFromStore = ({
  canisterId,
  canistersStore: { canisters },
}: {
  canisterId: string | undefined;
  canistersStore: CanistersStore;
}): CanisterInfo | undefined =>
  canisters?.find(({ canister_id }) => canister_id.toText() === canisterId);

export const formatCyclesToTCycles = (cycles: bigint): string =>
  formatNumber(Number(cycles) / Number(ONE_TRILLION), {
    minFraction: 3,
    maxFraction: 3,
  });

/**
 * If no name is provided for the canister the information fallbacks to its ID.
 */
export const mapCanisterDetails = ({
  canister_id,
  name,
}: CanisterInfo): {
  name: string;
  validName: boolean;
  canisterId: string;
} => {
  const canisterId = canister_id.toText();
  return {
    name: name ?? canisterId,
    validName: name.length > 0,
    canisterId,
  };
};

export const isController = ({
  controller,
  canisterDetails,
}: {
  controller: string;
  canisterDetails: CanisterDetails;
}): boolean => canisterDetails.settings.controllers.includes(controller);

export const isUserController = ({
  controller,
  authStore,
}: {
  controller: string;
  authStore: AuthStore;
}): boolean => controller === authStore.identity?.getPrincipal().toText();
