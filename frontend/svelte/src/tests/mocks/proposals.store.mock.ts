import type { ProposalInfo } from "@dfinity/nns";
import { ProposalStatus } from "@dfinity/nns";
import type { Subscriber } from "svelte/store";

export const mockProposals: ProposalInfo[] = [
  {
    id: "test1",
    proposal: {
      title: "Proposal1",
    },
    status: ProposalStatus.PROPOSAL_STATUS_OPEN,
    ballots: [],
    proposer: BigInt(123456789),
  },
  {
    id: "test2",
    proposal: {
      title: "Proposal2",
    },
    status: ProposalStatus.PROPOSAL_STATUS_EXECUTED,
    ballots: [],
    proposer: BigInt(987654321),
  },
] as unknown as ProposalInfo[];

export const mockProposalsStoreSubscribe = (
  run: Subscriber<ProposalInfo[]>
): (() => void) => {
  run(mockProposals);

  return () => {};
};

export const mockEmptyProposalsStoreSubscribe = (
  run: Subscriber<ProposalInfo[]>
): (() => void) => {
  run([]);

  return () => {};
};
