/**
 * Creates a proposal and verifies that a user can see it, without changing filters.
 */
import { MyNavigator } from "../common/navigator";
import { register } from "../common/register";
import { skipUnlessBrowserIs } from "../common/test";
import { NAV_PROPOSALS_SELECTOR } from "../components/nav";
import { ProposalsTab } from "../components/proposals-tab";

describe("Makes a proposal and verifies that the filters work", () => {
  let proposalId: number | undefined = undefined;

  before(function () {
    skipUnlessBrowserIs.bind(this)(["chrome"]);
  });

  it("Setup: Register user", async () => {
    await browser.url("/");
    const userId = await register(browser);
    console.warn(`Created user: ${JSON.stringify(userId)}`);
  });

  it("Setup: Create proposal", async () => {
    proposalId = await ProposalsTab.propose("set-firewall-config");
  });

  it("Go to voting tab", async () => {
    const navigator = new MyNavigator(browser);
    await navigator.navigate({
      selector: NAV_PROPOSALS_SELECTOR,
      description: "Go to the neurons view",
    });
  });

  // The next steps all follow the same pattern:
  // - Refresh, to reset the filters.
  // - Check some fields, verify that the proposal is shown,
  // - Refresh, to reset the filters.
  // - Invert the selection, verify that the proposal is not shown.
  const testFilter = (
    filterSelector: string,
    selection: Array<string>
  ): void => {
    it(`Can see the new proposal if ${selection.join(
      " & "
    )} proposals are selected`, async () => {
      await browser.refresh();
      const proposalsTab = new ProposalsTab(browser);
      // Default status is only "Open".
      // Yet, the proposal Fails immediately in local tests.
      await proposalsTab.filter("filters-by-status", ["Open", "Failed"]);

      await proposalsTab.filter(filterSelector, selection);
      const proposalMetadataSelector = ProposalsTab.proposalCardSelector(
        proposalId as number
      );
      await proposalsTab.getElement(
        proposalMetadataSelector,
        "Proposal should appear, if it was not already displayed"
      );
      const disappears = await proposalsTab
        .waitForGone(proposalMetadataSelector, "Seeing if it disappears", {
          timeout: 1_000,
        })
        .then(() => true)
        .catch(() => false);
      expect(disappears).toBe(false);
    });
    it(`Can not see the new proposal if ${selection.join(
      " "
    )} proposals are deselected`, async () => {
      await browser.refresh();
      const proposalsTab = new ProposalsTab(browser);
      // Default status is only "Open".
      // Yet, the proposal Fails immediately in local tests.
      await proposalsTab.filter("filters-by-status", ["Open", "Failed"]);

      await proposalsTab.filter(filterSelector, selection, false);
      const proposalMetadataSelector = ProposalsTab.proposalCardSelector(
        proposalId as number
      );
      await proposalsTab.waitForGone(
        proposalMetadataSelector,
        "Proposal should disappear",
        { timeout: 10_000 }
      );
      const appears = await proposalsTab
        .getElement(proposalMetadataSelector, "Seeing if it appears", {
          timeout: 1_000,
        })
        .then(() => true)
        .catch(() => false);
      expect(appears).toBe(false);
    });
  };

  testFilter("filters-by-topics", ["Subnet Management"]);
  // We can't test "Accepting Votes" because the proposal Fails immediately in local tests.
  // testFilter("filters-by-rewards", ["Accepting Votes"]);
});
