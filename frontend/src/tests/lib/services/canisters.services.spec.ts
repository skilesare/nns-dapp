import * as api from "$lib/api/canisters.api";
import { UserNotTheControllerError } from "$lib/canisters/ic-management/ic-management.errors";
import { syncAccounts } from "$lib/services/accounts.services";
import {
  addController,
  attachCanister,
  createCanister,
  detachCanister,
  getCanisterDetails,
  getIcpToCyclesExchangeRate,
  listCanisters,
  removeController,
  routePathCanisterId,
  topUpCanister,
  updateSettings,
} from "$lib/services/canisters.services";
import { canistersStore } from "$lib/stores/canisters.store";
import { toastsError, toastsShow } from "$lib/stores/toasts.store";
import type { Identity } from "@dfinity/agent";
import { ICPToken, TokenAmount } from "@dfinity/nns";
import { get } from "svelte/store";
import { mockMainAccount } from "../../mocks/accounts.store.mock";
import {
  mockIdentity,
  mockIdentityErrorMsg,
  resetIdentity,
  setNoIdentity,
} from "../../mocks/auth.store.mock";
import {
  mockCanister,
  mockCanisterDetails,
  mockCanisters,
  mockCanisterSettings,
} from "../../mocks/canisters.mock";

let identity: Identity | undefined = mockIdentity;
const setNoAccountIdentity = () => (identity = undefined);
const resetAccountIdentity = () => (identity = mockIdentity);
jest.mock("$lib/services/accounts.services", () => {
  return {
    syncAccounts: jest.fn().mockResolvedValue(undefined),
    getAccountIdentity: jest.fn().mockImplementation(() => {
      if (!identity) {
        throw new Error(mockIdentityErrorMsg);
      }

      return Promise.resolve(identity);
    }),
  };
});

jest.mock("$lib/stores/toasts.store", () => {
  return {
    toastsError: jest.fn(),
    toastsShow: jest.fn(),
    toastsSuccess: jest.fn(),
  };
});

describe("canisters-services", () => {
  const spyQueryCanisters = jest
    .spyOn(api, "queryCanisters")
    .mockImplementation(() => Promise.resolve(mockCanisters));

  const spyAttachCanister = jest
    .spyOn(api, "attachCanister")
    .mockImplementation(() => Promise.resolve(undefined));

  const spyDetachCanister = jest
    .spyOn(api, "detachCanister")
    .mockImplementation(() => Promise.resolve(undefined));

  const spyUpdateSettings = jest
    .spyOn(api, "updateSettings")
    .mockImplementation(() => Promise.resolve(undefined));

  const spyCreateCanister = jest
    .spyOn(api, "createCanister")
    .mockImplementation(() => Promise.resolve(mockCanisterDetails.id));

  const spyTopUpCanister = jest
    .spyOn(api, "topUpCanister")
    .mockImplementation(() => Promise.resolve(undefined));

  const spyQueryCanisterDetails = jest
    .spyOn(api, "queryCanisterDetails")
    .mockImplementation(() => Promise.resolve(mockCanisterDetails));

  const exchangeRate = BigInt(10_000);
  const spyGetExchangeRate = jest
    .spyOn(api, "getIcpToCyclesExchangeRate")
    .mockImplementation(() => Promise.resolve(exchangeRate));

  describe("listCanisters", () => {
    afterEach(() => {
      jest.clearAllMocks();
      canistersStore.setCanisters({ canisters: [], certified: true });
    });

    it("should list canisters", async () => {
      await listCanisters({});

      expect(spyQueryCanisters).toHaveBeenCalled();

      const store = get(canistersStore);
      expect(store.canisters).toEqual(mockCanisters);
    });

    it("should not list canisters if no identity", async () => {
      setNoIdentity();

      const call = async () => await listCanisters({});

      await expect(call).rejects.toThrow(Error(mockIdentityErrorMsg));

      resetIdentity();
    });
  });

  describe("attachCanister", () => {
    afterEach(() => {
      jest.clearAllMocks();
      canistersStore.setCanisters({ canisters: [], certified: true });
    });

    it("should call api to attach canister and list canisters again", async () => {
      const response = await attachCanister(mockCanisterDetails.id);
      expect(response.success).toBe(true);
      expect(spyAttachCanister).toBeCalled();
      expect(spyQueryCanisters).toBeCalled();

      const store = get(canistersStore);
      expect(store.canisters).toEqual(mockCanisters);
    });

    it("should not attach canister if no identity", async () => {
      setNoIdentity();

      const response = await attachCanister(mockCanisterDetails.id);
      expect(response.success).toBe(false);
      expect(spyAttachCanister).not.toBeCalled();
      expect(spyQueryCanisters).not.toBeCalled();

      resetIdentity();
    });
  });

  describe("detachCanister", () => {
    afterEach(() => {
      jest.clearAllMocks();
      canistersStore.setCanisters({ canisters: [], certified: true });
    });

    it("should call api to attach canister and list canisters again", async () => {
      const response = await detachCanister(mockCanisterDetails.id);
      expect(response.success).toBe(true);
      expect(spyDetachCanister).toBeCalled();
      expect(spyQueryCanisters).toBeCalled();

      const store = get(canistersStore);
      expect(store.canisters).toEqual(mockCanisters);
    });

    it("should not detach canister if no identity", async () => {
      setNoIdentity();

      const response = await detachCanister(mockCanisterDetails.id);
      expect(response.success).toBe(false);
      expect(spyDetachCanister).not.toBeCalled();
      expect(spyQueryCanisters).not.toBeCalled();

      resetIdentity();
    });
  });

  describe("updateSettings", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should call api to update settings", async () => {
      const response = await updateSettings({
        canisterId: mockCanisterDetails.id,
        settings: mockCanisterSettings,
      });
      expect(response.success).toBe(true);
      expect(spyUpdateSettings).toBeCalled();
    });

    it("should not update settings if no identity", async () => {
      setNoIdentity();

      const response = await updateSettings({
        canisterId: mockCanisterDetails.id,
        settings: mockCanisterSettings,
      });
      expect(response.success).toBe(false);
      expect(spyUpdateSettings).not.toBeCalled();

      resetIdentity();
    });
  });

  describe("addController", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should call api to update the settings", async () => {
      const response = await addController({
        controller: "some-controller",
        canisterDetails: mockCanisterDetails,
      });
      expect(response.success).toBe(true);
      expect(spyUpdateSettings).toBeCalled();
    });

    it("should not update settings if controller is already present", async () => {
      const controller = "some-controller";
      const canisterDetails = {
        ...mockCanisterDetails,
        settings: {
          ...mockCanisterDetails.settings,
          controllers: [controller],
        },
      };

      const response = await addController({
        controller,
        canisterDetails: canisterDetails,
      });
      expect(response.success).toBe(false);
      expect(spyUpdateSettings).not.toBeCalled();
      expect(toastsError).toBeCalled();
    });

    it("should not update settings if no identity", async () => {
      setNoIdentity();

      const response = await addController({
        controller: "some-controller",
        canisterDetails: mockCanisterDetails,
      });
      expect(response.success).toBe(false);
      expect(spyUpdateSettings).not.toBeCalled();

      resetIdentity();
    });
  });

  describe("removeController", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should call api to update the settings", async () => {
      const controller = "aaaaa-aa";
      const canisterDetails = {
        ...mockCanisterDetails,
        settings: {
          ...mockCanisterDetails.settings,
          controllers: [controller],
        },
      };
      const response = await removeController({
        controller,
        canisterDetails,
      });
      expect(response.success).toBe(true);
      expect(spyUpdateSettings).toBeCalled();
    });

    it("should not call api if controller is not in the list of current controllers", async () => {
      const controller = "aaaaa-aa";
      const canisterDetails = {
        ...mockCanisterDetails,
        settings: {
          ...mockCanisterDetails.settings,
          controllers: [controller],
        },
      };
      const response = await removeController({
        controller: "not-a-controller",
        canisterDetails,
      });
      expect(response.success).toBe(false);
      expect(spyUpdateSettings).not.toBeCalled();
      expect(toastsError).toBeCalled();
    });

    it("should not update settings if no identity", async () => {
      setNoIdentity();

      const response = await removeController({
        controller: "some-controller",
        canisterDetails: mockCanisterDetails,
      });
      expect(response.success).toBe(false);
      expect(spyUpdateSettings).not.toBeCalled();

      resetIdentity();
    });
  });

  describe("routePathCanisterId", () => {
    beforeAll(() => {
      // Avoid to print errors during test
      jest.spyOn(console, "error").mockImplementation(() => undefined);
    });
    afterAll(() => jest.clearAllMocks());

    it("should get canister id from valid path", () => {
      expect(
        routePathCanisterId(`/#/canister/${mockCanister.canister_id.toText()}`)
      ).toEqual(mockCanister.canister_id.toText());
    });

    it("should not get canister id from invalid path", () => {
      expect(routePathCanisterId("/#/canister/")).toBeUndefined();
      expect(routePathCanisterId("/#/canisters")).toBeUndefined();
      expect(routePathCanisterId(undefined)).toBeUndefined();
    });
  });

  describe("getCanisterDetails", () => {
    it("should fetch canister details", async () => {
      const canister = await getCanisterDetails(mockCanisterDetails.id);

      expect(spyQueryCanisterDetails).toBeCalled();
      expect(canister).toEqual(mockCanisterDetails);
    });

    it("should not fetch canister details if no identity", async () => {
      setNoIdentity();

      const call = () => getCanisterDetails(mockCanisterDetails.id);

      await expect(call).rejects.toThrow(Error(mockIdentityErrorMsg));
      resetIdentity();
    });

    it("should throw if getCanisterDetails api throws", async () => {
      spyQueryCanisterDetails.mockRejectedValue(
        new UserNotTheControllerError()
      );

      const call = () => getCanisterDetails(mockCanisterDetails.id);

      await expect(call).rejects.toThrow(UserNotTheControllerError);
      spyQueryCanisterDetails.mockRestore();
    });
  });

  describe("getIcpToCyclesExchangeRate", () => {
    afterEach(() => jest.clearAllMocks());

    it("should call api to get conversion rate", async () => {
      const response = await getIcpToCyclesExchangeRate();
      expect(response).toBe(exchangeRate);
      expect(spyGetExchangeRate).toBeCalled();
    });

    it("should return undefined if no identity", async () => {
      setNoIdentity();

      const response = await getIcpToCyclesExchangeRate();
      expect(response).toBeUndefined();
      expect(spyGetExchangeRate).not.toBeCalled();

      resetIdentity();
    });
  });

  describe("createCanister", () => {
    afterEach(() => jest.clearAllMocks());

    it("should call api to create a canister", async () => {
      const account = {
        ...mockMainAccount,
        balance: TokenAmount.fromNumber({
          amount: 5,
          token: ICPToken,
        }),
      };
      const canisterId = await createCanister({
        amount: 3,
        account,
      });
      expect(canisterId).not.toBeUndefined();
      expect(spyCreateCanister).toBeCalled();
      expect(spyQueryCanisters).toBeCalled();
      expect(syncAccounts).toBeCalled();
    });

    it("should not call api if account doesn't have enough funds", async () => {
      const account = {
        ...mockMainAccount,
        balance: TokenAmount.fromNumber({
          amount: 2,
          token: ICPToken,
        }),
      };
      const canisterId = await createCanister({
        amount: 3,
        account,
      });
      expect(canisterId).toBeUndefined();
      expect(spyCreateCanister).not.toBeCalled();
      expect(spyQueryCanisters).not.toBeCalled();
      expect(syncAccounts).not.toBeCalled();
    });

    it("should show toast error if account doesn't have enough funds", async () => {
      const account = {
        ...mockMainAccount,
        balance: TokenAmount.fromNumber({
          amount: 2,
          token: ICPToken,
        }),
      };
      const canisterId = await createCanister({
        amount: 3,
        account,
      });
      expect(canisterId).toBeUndefined();
      expect(toastsShow).toBeCalled();
    });

    it("should return undefined if no identity", async () => {
      setNoAccountIdentity();

      const canisterId = await createCanister({
        amount: 3,
        account: mockMainAccount,
      });
      expect(canisterId).toBeUndefined();
      expect(spyCreateCanister).not.toBeCalled();

      resetAccountIdentity();
    });
  });

  describe("topUpCanister", () => {
    afterEach(() => jest.clearAllMocks());

    it("should call api to top up a canister", async () => {
      const account = {
        ...mockMainAccount,
        balance: TokenAmount.fromNumber({
          amount: 5,
          token: ICPToken,
        }),
      };
      const { success } = await topUpCanister({
        amount: 3,
        canisterId: mockCanisterDetails.id,
        account,
      });
      expect(success).toBe(true);
      expect(spyTopUpCanister).toBeCalled();
      expect(syncAccounts).toBeCalled();
    });

    it("should not call api if account doesn't have enough funds", async () => {
      const account = {
        ...mockMainAccount,
        balance: TokenAmount.fromNumber({
          amount: 2,
          token: ICPToken,
        }),
      };
      const { success } = await topUpCanister({
        amount: 3,
        canisterId: mockCanisterDetails.id,
        account,
      });
      expect(success).toBe(false);
      expect(spyTopUpCanister).not.toBeCalled();
      expect(syncAccounts).not.toBeCalled();
    });

    it("should show toast error if account doesn't have enough funds", async () => {
      const account = {
        ...mockMainAccount,
        balance: TokenAmount.fromNumber({
          amount: 2,
          token: ICPToken,
        }),
      };
      const { success } = await topUpCanister({
        amount: 3,
        canisterId: mockCanisterDetails.id,
        account,
      });
      expect(success).toBe(false);
      expect(toastsShow).toBeCalled();
    });

    it("should return success false if no identity", async () => {
      setNoAccountIdentity();

      const { success } = await topUpCanister({
        amount: 3,
        account: mockMainAccount,
        canisterId: mockCanisterDetails.id,
      });
      expect(success).toBe(false);
      expect(spyTopUpCanister).not.toBeCalled();

      resetAccountIdentity();
    });
  });
});
