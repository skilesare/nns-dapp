/**
 * @jest-environment jsdom
 */

import VotingConfirmationToolbar from "$lib/components/proposal-detail/VotingCard/VotingConfirmationToolbar.svelte";
import { E8S_PER_ICP } from "$lib/constants/icp.constants";
import { votingNeuronSelectStore } from "$lib/stores/proposals.store";
import { formatVotingPower } from "$lib/utils/neuron.utils";
import { Vote } from "@dfinity/nns";
import { fireEvent } from "@testing-library/dom";
import { render, waitFor } from "@testing-library/svelte";
import { mockNeuron } from "../../../../mocks/neurons.mock";
import {
  mockProposalInfo,
  mockVoteRegistration,
} from "../../../../mocks/proposal.mock";

describe("VotingConfirmationToolbar", () => {
  const votingPower = BigInt(100 * E8S_PER_ICP);
  const neuron = {
    ...mockNeuron,
    neuronId: BigInt(111),
    votingPower,
  };

  const props = {
    proposalInfo: mockProposalInfo,
  };

  beforeEach(() => {
    votingNeuronSelectStore.set([neuron]);
  });

  it("should disable buttons if nothing is selected", async () => {
    const { container } = render(VotingConfirmationToolbar, { props });
    votingNeuronSelectStore.toggleSelection(neuron.neuronId);
    await waitFor(() =>
      expect(
        container.querySelector('[data-tid="vote-yes"][disabled]')
      ).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(
        container.querySelector('[data-tid="vote-no"][disabled]')
      ).toBeInTheDocument()
    );
  });

  it("should display Vote.Yes modal", async () => {
    const { container } = render(VotingConfirmationToolbar, { props });
    fireEvent.click(
      container.querySelector('[data-tid="vote-yes"]') as Element
    );
    await waitFor(() =>
      expect(
        container.querySelector('[data-tid="thumb-up"]')
      ).toBeInTheDocument()
    );
  });

  it("should display Vote.No modal", async () => {
    const { container } = render(VotingConfirmationToolbar, { props });
    fireEvent.click(container.querySelector('[data-tid="vote-no"]') as Element);
    await waitFor(() =>
      expect(
        container.querySelector('[data-tid="thumb-down"]')
      ).toBeInTheDocument()
    );
  });

  it("should disable Adapt/Reject buttons when voteInProgress", async () => {
    const { getByTestId } = render(VotingConfirmationToolbar, {
      props: { ...props, voteRegistration: mockVoteRegistration },
    });
    const adaptButton = getByTestId("vote-yes");
    const rejectButton = getByTestId("vote-no");

    expect(adaptButton?.getAttribute("disabled")).not.toBeNull();
    expect(rejectButton?.getAttribute("disabled")).not.toBeNull();
  });

  it('should display "total" in modal', async () => {
    const { getByText, container } = render(VotingConfirmationToolbar, {
      props,
    });
    fireEvent.click(
      container.querySelector('[data-tid="vote-yes"]') as Element
    );
    await waitFor(() =>
      expect(
        getByText(formatVotingPower(votingPower), { exact: false })
      ).toBeInTheDocument()
    );
  });

  it("should hide confirmation on cancel", async () => {
    const { container } = render(VotingConfirmationToolbar, { props });
    fireEvent.click(
      container.querySelector('[data-tid="vote-yes"]') as Element
    );
    await waitFor(() =>
      expect(
        container.querySelector('[data-tid="confirm-no"]')
      ).toBeInTheDocument()
    );
    await fireEvent.click(
      container.querySelector('[data-tid="confirm-no"]') as Element
    );
    await waitFor(() =>
      expect(
        container.querySelector('[data-tid="confirm-no"]')
      ).not.toBeInTheDocument()
    );
  });

  it("should hide confirmation and dispatch on confirm", async () => {
    const { component, container } = render(VotingConfirmationToolbar, {
      props,
    });
    let calledVoteType: Vote = Vote.Unspecified;
    const onConfirm = jest.fn((ev) => (calledVoteType = ev?.detail?.voteType));
    component.$on("nnsConfirm", onConfirm);

    await fireEvent.click(
      container.querySelector('[data-tid="vote-no"]') as Element
    );
    await waitFor(() => container.querySelector('[data-tid="confirm-yes"]'));
    await fireEvent.click(
      container.querySelector('[data-tid="confirm-yes"]') as Element
    );
    await waitFor(() =>
      expect(
        container.querySelector('[data-tid="confirm-no"]')
      ).not.toBeInTheDocument()
    );
    expect(onConfirm).toBeCalled();
    expect(calledVoteType).toBe(Vote.No);
  });
});
