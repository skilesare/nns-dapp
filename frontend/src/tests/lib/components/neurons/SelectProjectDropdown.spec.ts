/**
 * @jest-environment jsdom
 */
import SelectProjectDropdown from "$lib/components/neurons/SelectProjectDropdown.svelte";
import { OWN_CANISTER_ID } from "$lib/constants/canister-ids.constants";
import { AppPath } from "$lib/constants/routes.constants";
import { snsProjectSelectedStore } from "$lib/derived/selected-project.derived";
import { committedProjectsStore } from "$lib/stores/projects.store";
import { routeStore } from "$lib/stores/route.store";
import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { get } from "svelte/store";
import en from "../../../mocks/i18n.mock";
import {
  mockProjectSubscribe,
  mockSnsFullProject,
} from "../../../mocks/sns-projects.mock";

jest.mock("$lib/services/sns.services", () => {
  return {
    loadSnsSummaries: jest.fn().mockResolvedValue(undefined),
  };
});

describe("SelectProjectDropdown", () => {
  jest
    .spyOn(committedProjectsStore, "subscribe")
    .mockImplementation(mockProjectSubscribe([mockSnsFullProject]));

  beforeEach(() => {
    // Dropdown changes context only in the Neurons page for now.
    routeStore.update({ path: AppPath.LegacyNeurons });
  });

  it("should render NNS and projects as options", () => {
    const { container } = render(SelectProjectDropdown);

    // NNS + projects store
    expect(container.querySelectorAll("option").length).toBe(2);
  });

  it("should render NNS and project name", () => {
    const { container } = render(SelectProjectDropdown);

    expect(
      (
        (container.querySelector("option:first-of-type") as HTMLElement)
          .textContent ?? ""
      ).trim()
    ).toBe(en.core.nns);
    expect(
      (
        (container.querySelector("option:last-of-type") as HTMLElement)
          .textContent ?? ""
      ).trim()
    ).toBe(mockSnsFullProject.summary.metadata.name);
  });

  it("should select NNS as default", () => {
    const { container } = render(SelectProjectDropdown);

    expect(container.querySelector("select")?.value).toBe(
      OWN_CANISTER_ID.toText()
    );
  });

  it("can select another project", async () => {
    const { container } = render(SelectProjectDropdown);

    const selectElement = container.querySelector("select");
    selectElement && expect(selectElement.value).toBe(OWN_CANISTER_ID.toText());

    const projectCanisterId = mockSnsFullProject.rootCanisterId.toText();
    selectElement &&
      fireEvent.change(selectElement, {
        target: { value: projectCanisterId },
      });

    selectElement && expect(selectElement.value).toBe(projectCanisterId);
  });

  it("changes in dropdown are propagated to the snsProjectSelectedStore", async () => {
    const { container } = render(SelectProjectDropdown);

    const $store1 = get(snsProjectSelectedStore);
    expect($store1.toText()).toEqual(OWN_CANISTER_ID.toText());

    const selectElement = container.querySelector("select");
    const projectCanisterId = mockSnsFullProject.rootCanisterId.toText();
    selectElement &&
      fireEvent.change(selectElement, {
        target: { value: projectCanisterId },
      });

    await waitFor(() => {
      const $store2 = get(snsProjectSelectedStore);
      return expect($store2.toText()).toEqual(projectCanisterId);
    });
  });
});
