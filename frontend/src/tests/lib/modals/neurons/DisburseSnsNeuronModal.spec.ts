/**
 * @jest-environment jsdom
 */

import * as accountsApi from "$lib/api/accounts.api";
import { CONTEXT_PATH } from "$lib/constants/routes.constants";
import { snsTokenSymbolSelectedStore } from "$lib/derived/sns/sns-token-symbol-selected.store";
import DisburseSnsNeuronModal from "$lib/modals/neurons/DisburseSnsNeuronModal.svelte";
import { syncSnsAccounts } from "$lib/services/sns-accounts.services";
import { disburse } from "$lib/services/sns-neurons.services";
import { accountsStore } from "$lib/stores/accounts.store";
import { routeStore } from "$lib/stores/route.store";
import { snsAccountsStore } from "$lib/stores/sns-accounts.store";
import type { SnsNeuron } from "@dfinity/sns";
import { fireEvent, waitFor, type RenderResult } from "@testing-library/svelte";
import { get } from "svelte/store";
import {
  mockAccountsStoreSubscribe,
  mockMainAccount,
  mockSubAccount,
} from "../../../mocks/accounts.store.mock";
import { mockPrincipal } from "../../../mocks/auth.store.mock";
import { renderModal } from "../../../mocks/modal.mock";
import {
  mockSnsMainAccount,
  mockSnsSubAccount,
} from "../../../mocks/sns-accounts.mock";
import { mockSnsNeuron } from "../../../mocks/sns-neurons.mock";
import { mockTokenStore } from "../../../mocks/sns-projects.mock";

jest.mock("$lib/services/sns-neurons.services", () => {
  return {
    disburse: jest.fn().mockResolvedValue({ success: true }),
  };
});

jest.mock("../../../../lib/services/sns-accounts.services", () => {
  return {
    syncSnsAccounts: jest.fn().mockResolvedValue(undefined),
  };
});

describe("DisburseSnsNeuronModal", () => {
  const principalString = `${mockSnsMainAccount.principal}`;
  const renderDisburseModal = async (
    neuron: SnsNeuron,
    reloadContext: () => Promise<void> = () => Promise.resolve()
  ): Promise<RenderResult> => {
    return renderModal({
      component: DisburseSnsNeuronModal,
      props: {
        neuron,
        reloadContext,
      },
    });
  };

  beforeAll(() => {
    jest
      .spyOn(accountsStore, "subscribe")
      .mockImplementation(mockAccountsStoreSubscribe([mockSubAccount]));

    jest
      .spyOn(accountsApi, "loadAccounts")
      .mockImplementation(() =>
        Promise.resolve({ main: mockMainAccount, subAccounts: [] })
      );

    jest
      .spyOn(snsTokenSymbolSelectedStore, "subscribe")
      .mockImplementation(mockTokenStore);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    accountsStore.set({
      ...get(accountsStore),
      main: mockMainAccount,
    });

    snsAccountsStore.setAccounts({
      rootCanisterId: mockPrincipal,
      accounts: [mockSnsMainAccount, mockSnsSubAccount],
      certified: true,
    });

    (syncSnsAccounts as jest.Mock).mockClear();
  });

  it("should display modal", async () => {
    const { container } = await renderDisburseModal(mockSnsNeuron);

    expect(container.querySelector("div.modal")).not.toBeNull();
  });

  it("should render a confirmation screen", async () => {
    routeStore.update({
      path: `${CONTEXT_PATH}/${principalString}/neuron/12344`,
    });
    const { queryByTestId } = await renderDisburseModal(mockSnsNeuron);

    await waitFor(() =>
      expect(queryByTestId("confirm-disburse-screen")).not.toBeNull()
    );
  });

  it("should call disburse service", async () => {
    routeStore.update({
      path: `${CONTEXT_PATH}/${principalString}/neuron/12344`,
    });

    const { queryByTestId } = await renderDisburseModal(mockSnsNeuron);

    expect(queryByTestId("confirm-disburse-screen")).not.toBeNull();

    const confirmButton = queryByTestId("disburse-neuron-button");
    expect(confirmButton).not.toBeNull();

    confirmButton && (await fireEvent.click(confirmButton));
    expect(disburse).toBeCalled();
  });

  it("should call reloadContext", async () => {
    routeStore.update({
      path: `${CONTEXT_PATH}/${principalString}/neuron/12344`,
    });
    const reloadContext = jest.fn().mockResolvedValue(null);
    const { queryByTestId } = await renderDisburseModal(
      mockSnsNeuron,
      reloadContext
    );

    expect(queryByTestId("confirm-disburse-screen")).not.toBeNull();

    const confirmButton = queryByTestId("disburse-neuron-button");
    expect(confirmButton).not.toBeNull();

    confirmButton && (await fireEvent.click(confirmButton));

    await waitFor(() => expect(reloadContext).toBeCalled());
  });

  it("should trigger the project account load", async () => {
    snsAccountsStore.reset();

    routeStore.update({
      path: `${CONTEXT_PATH}/${principalString}/neuron/12344`,
    });
    const reloadContext = jest.fn().mockResolvedValue(null);
    await renderDisburseModal(mockSnsNeuron, reloadContext);

    await waitFor(() => expect(syncSnsAccounts).toBeCalled());
  });

  it("should not trigger the project account load if already available", async () => {
    routeStore.update({
      path: `${CONTEXT_PATH}/${principalString}/neuron/12344`,
    });
    const reloadContext = jest.fn().mockResolvedValue(null);
    const { queryByTestId } = await renderDisburseModal(
      mockSnsNeuron,
      reloadContext
    );

    await waitFor(() =>
      expect(queryByTestId("disburse-neuron-button")).not.toBeNull()
    );

    await fireEvent.click(queryByTestId("disburse-neuron-button") as Element);

    await waitFor(() => expect(syncSnsAccounts).not.toBeCalled());
  });
});
