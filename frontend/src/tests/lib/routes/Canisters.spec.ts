/**
 * @jest-environment jsdom
 */

import Canisters from "$lib/routes/Canisters.svelte";
import { listCanisters } from "$lib/services/canisters.services";
import { authStore } from "$lib/stores/auth.store";
import { canistersStore } from "$lib/stores/canisters.store";
import { fireEvent } from "@testing-library/dom";
import { render, waitFor } from "@testing-library/svelte";
import {
  mockAuthStoreSubscribe,
  mockPrincipal,
} from "../../mocks/auth.store.mock";
import { mockCanistersStoreSubscribe } from "../../mocks/canisters.mock";
import en from "../../mocks/i18n.mock";

jest.mock("$lib/services/canisters.services", () => {
  return {
    listCanisters: jest.fn(),
    getIcpToCyclesExchangeRate: jest.fn(),
  };
});

describe("Canisters", () => {
  let authStoreMock: jest.SpyInstance;

  beforeEach(() => {
    authStoreMock = jest
      .spyOn(authStore, "subscribe")
      .mockImplementation(mockAuthStoreSubscribe);

    jest
      .spyOn(canistersStore, "subscribe")
      .mockImplementation(mockCanistersStoreSubscribe);
  });

  it("should render content", () => {
    const { getByText } = render(Canisters);

    expect(getByText(en.canisters.text)).toBeInTheDocument();
  });

  it("should subscribe to store", () =>
    expect(authStoreMock).toHaveBeenCalled());

  it("should load canisters", () => expect(listCanisters).toHaveBeenCalled());

  it("should render a principal as text", () => {
    const { getByText } = render(Canisters);

    expect(
      getByText(mockPrincipal.toText(), { exact: false })
    ).toBeInTheDocument();
  });

  it("should render canister cards for canisters", () => {
    const { queryAllByTestId } = render(Canisters);

    expect(queryAllByTestId("canister-card").length).toBe(2);
  });

  it("should open the LinkCanisterModal on click to Link Canister", async () => {
    const { queryByTestId } = render(Canisters);

    const toolbarButton = queryByTestId("link-canister-button");
    expect(toolbarButton).not.toBeNull();

    toolbarButton !== null && (await fireEvent.click(toolbarButton));

    await waitFor(() =>
      expect(queryByTestId("link-canister-modal-title")).toBeInTheDocument()
    );
  });

  it("should open the CreateCanisterModal on click to Create Canister", async () => {
    const { queryByTestId } = render(Canisters);

    const toolbarButton = queryByTestId("create-canister-button");
    expect(toolbarButton).not.toBeNull();

    toolbarButton !== null && (await fireEvent.click(toolbarButton));

    await waitFor(() =>
      expect(queryByTestId("create-canister-modal-title")).toBeInTheDocument()
    );
  });
});
