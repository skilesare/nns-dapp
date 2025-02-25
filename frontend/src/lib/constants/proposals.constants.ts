import { Color } from "@dfinity/gix-components";
import { ProposalRewardStatus, ProposalStatus, Topic } from "@dfinity/nns";

// TODO: suggest to move into the store and add typing
export const DEFAULT_PROPOSALS_FILTERS = {
  topics: [
    Topic.NetworkEconomics,
    Topic.Governance,
    Topic.NodeAdmin,
    Topic.ParticipantManagement,
    Topic.SubnetManagement,
    Topic.NetworkCanisterManagement,
    Topic.NodeProviderRewards,
    Topic.SnsAndCommunityFund,
  ],
  rewards: [
    ProposalRewardStatus.AcceptVotes,
    ProposalRewardStatus.ReadyToSettle,
    ProposalRewardStatus.Settled,
    ProposalRewardStatus.Ineligible,
  ],
  status: [ProposalStatus.Open],
  excludeVotedProposals: false,
  lastAppliedFilter: undefined,
};

export const PROPOSAL_COLOR: Record<ProposalStatus, Color | undefined> = {
  [ProposalStatus.Executed]: Color.SUCCESS,
  [ProposalStatus.Open]: Color.WARNING,
  [ProposalStatus.Unknown]: undefined,
  [ProposalStatus.Rejected]: Color.ERROR,
  [ProposalStatus.Accepted]: undefined,
  [ProposalStatus.Failed]: Color.ERROR,
};

export const DEPRECATED_TOPICS = [Topic.SnsDecentralizationSale];
