/**
 * @jest-environment jsdom
 */

import SelectDestinationAddress from "$lib/components/accounts/SelectDestinationAddress.svelte";
import { OWN_CANISTER_ID } from "$lib/constants/canister-ids.constants";
import { accountsStore } from "$lib/stores/accounts.store";
import { snsAccountsStore } from "$lib/stores/sns-accounts.store";
import { fireEvent, render, waitFor } from "@testing-library/svelte";
import {
  mockAccountsStoreSubscribe,
  mockHardwareWalletAccount,
  mockSubAccount,
} from "../../../mocks/accounts.store.mock";
import { mockPrincipal } from "../../../mocks/auth.store.mock";
import { mockSnsAccountsStoreSubscribe } from "../../../mocks/sns-accounts.mock";

describe("SelectDestinationAddress", () => {
  describe("nns accounts", () => {
    const mockSubAccount2 = {
      ...mockSubAccount,
      identifier: "test-identifier",
    };
    const subaccounts = [mockSubAccount, mockSubAccount2];
    const hardwareWallets = [mockHardwareWalletAccount];

    jest
      .spyOn(accountsStore, "subscribe")
      .mockImplementation(
        mockAccountsStoreSubscribe(subaccounts, hardwareWallets)
      );

    it("should render address input as default", () => {
      const { container } = render(SelectDestinationAddress, {
        props: {
          rootCanisterId: OWN_CANISTER_ID,
        },
      });

      expect(
        container.querySelector("input[name='accounts-address']")
      ).toBeInTheDocument();
    });

    it("should render toggle", () => {
      const { container } = render(SelectDestinationAddress, {
        props: {
          rootCanisterId: OWN_CANISTER_ID,
        },
      });

      const toggle = container.querySelector("input[id='toggle']");
      expect(toggle).toBeInTheDocument();
    });

    it("should not render toggle if no extra accounts to choose from", () => {
      const { container } = render(SelectDestinationAddress, {
        props: {
          filterAccounts: () => false,
          rootCanisterId: OWN_CANISTER_ID,
        },
      });

      const toggle = container.querySelector("input[id='toggle']");
      expect(toggle).not.toBeInTheDocument();
    });

    it("should render select account dropdown when toggle is clicked", async () => {
      const { container, queryByTestId } = render(SelectDestinationAddress, {
        props: {
          rootCanisterId: OWN_CANISTER_ID,
        },
      });

      expect(
        container.querySelector("input[name='accounts-address']")
      ).toBeInTheDocument();

      const toggle = container.querySelector("input[id='toggle']");
      toggle && fireEvent.click(toggle);

      await waitFor(() =>
        expect(queryByTestId("select-account-dropdown")).toBeInTheDocument()
      );
    });
  });

  describe("sns accounts", () => {
    jest
      .spyOn(snsAccountsStore, "subscribe")
      .mockImplementation(mockSnsAccountsStoreSubscribe(mockPrincipal));

    it("should render the sns account", async () => {
      const { container, queryByTestId } = render(SelectDestinationAddress, {
        props: {
          rootCanisterId: mockPrincipal,
        },
      });

      expect(
        container.querySelector("input[name='accounts-address']")
      ).toBeInTheDocument();

      const toggle = container.querySelector("input[id='toggle']");
      toggle && fireEvent.click(toggle);

      await waitFor(() =>
        expect(queryByTestId("select-account-dropdown")).toBeInTheDocument()
      );
    });
  });
});
