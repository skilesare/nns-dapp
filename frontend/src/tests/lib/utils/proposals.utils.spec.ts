import {
  DEFAULT_PROPOSALS_FILTERS,
  PROPOSAL_COLOR,
} from "$lib/constants/proposals.constants";
import { nowInSeconds } from "$lib/utils/date.utils";
import {
  concatenateUniqueProposals,
  excludeProposals,
  getNnsFunctionKey,
  getVotingBallot,
  getVotingPower,
  hasMatchingProposals,
  hideProposal,
  isProposalDeadlineInTheFuture,
  lastProposalId,
  mapProposalInfo,
  preserveNeuronSelectionAfterUpdate,
  proposalActionFields,
  proposalFirstActionKey,
  proposalIdSet,
  proposalsHaveSameIds,
  replaceAndConcatenateProposals,
  replaceProposals,
  selectedNeuronsVotingPower,
} from "$lib/utils/proposals.utils";
import type {
  Ballot,
  ExecuteNnsFunction,
  NeuronInfo,
  Proposal,
  ProposalInfo,
} from "@dfinity/nns";
import {
  NnsFunction,
  ProposalRewardStatus,
  ProposalStatus,
  Topic,
  Vote,
} from "@dfinity/nns";
import type { KnownNeuron } from "@dfinity/nns/dist/types/types/governance_converters";
import en from "../../mocks/i18n.mock";
import { mockNeuron } from "../../mocks/neurons.mock";
import {
  generateMockProposals,
  mockProposalInfo,
  proposalActionNnsFunction21,
  proposalActionRewardNodeProvider,
} from "../../mocks/proposal.mock";
import { mockProposals } from "../../mocks/proposals.store.mock";

const proposalWithNnsFunctionAction = {
  ...mockProposalInfo.proposal,
  action: proposalActionNnsFunction21,
} as Proposal;

const proposalWithRewardNodeProviderAction = {
  ...mockProposalInfo.proposal,
  action: proposalActionRewardNodeProvider,
} as Proposal;

describe("proposals-utils", () => {
  it("should find no last proposal id", () =>
    expect(lastProposalId([])).toBeUndefined());

  it("should find fist action key", () =>
    expect(proposalFirstActionKey(proposalWithNnsFunctionAction)).toEqual(
      "ExecuteNnsFunction"
    ));

  describe("hideProposal", () => {
    const proposalWithBallot = ({
      proposal,
      vote,
    }: {
      proposal: ProposalInfo;
      vote?: Vote;
    }): ProposalInfo => ({
      ...proposal,
      ballots: [
        {
          neuronId: BigInt(0),
          vote: vote ?? Vote.Unspecified,
        } as Ballot,
      ],
    });
    const neurons = [
      {
        neuronId: BigInt(0),
      } as NeuronInfo,
    ];

    it("hideProposal", () => {
      expect(
        hideProposal({
          proposalInfo: mockProposals[0],
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeFalsy();

      expect(
        hideProposal({
          proposalInfo: mockProposals[1],
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeFalsy();

      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({ proposal: mockProposals[0] }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeFalsy();

      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({ proposal: mockProposals[1] }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeFalsy();

      expect(
        hideProposal({
          proposalInfo: {
            ...mockProposals[0],
            ballots: [
              {
                neuronId: BigInt(0),
                vote: Vote.Unspecified,
              } as Ballot,
            ],
          },
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeFalsy();

      expect(
        hideProposal({
          proposalInfo: {
            ...mockProposals[1],
            ballots: [
              {
                neuronId: BigInt(0),
                vote: Vote.Unspecified,
              } as Ballot,
            ],
          },
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeFalsy();

      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({ proposal: mockProposals[0] }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeFalsy();

      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({ proposal: mockProposals[1] }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeFalsy();
    });

    it("should hide proposal", () => {
      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({
            proposal: mockProposals[0],
            vote: Vote.Yes,
          }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeTruthy();

      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({
            proposal: mockProposals[0],
            vote: Vote.No,
          }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeTruthy();
    });

    it("should hide proposal if a filter is empty", () => {
      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({
            proposal: mockProposals[0],
          }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            topics: [],
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeTruthy();

      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({
            proposal: mockProposals[0],
          }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            status: [],
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeTruthy();

      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({
            proposal: mockProposals[0],
          }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            rewards: [],
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeTruthy();
    });

    it("should hide proposal if does not match filter", () => {
      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({
            proposal: mockProposals[0],
          }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            topics: [Topic.Kyc],
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeTruthy();

      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({
            proposal: mockProposals[0],
          }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            status: [ProposalStatus.Executed],
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeTruthy();

      expect(
        hideProposal({
          proposalInfo: proposalWithBallot({
            proposal: mockProposals[0],
          }),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            rewards: [ProposalRewardStatus.ReadyToSettle],
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeTruthy();
    });

    it("should not show proposal without ballots", () => {
      expect(
        hideProposal({
          proposalInfo: {
            ...mockProposals[0],
            ballots: [],
          },
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeTruthy();

      expect(
        hideProposal({
          proposalInfo: {
            ...mockProposals[0],
            ballots: [
              {
                neuronId: BigInt(0),
                vote: Vote.Unspecified,
              } as Ballot,
            ],
          },
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeFalsy();
    });

    it("should ignore ballots neuronIds that are not in neurons", () => {
      expect(
        hideProposal({
          proposalInfo: {
            ...mockProposals[0],
            ballots: [
              {
                neuronId: BigInt(0),
                vote: Vote.Unspecified,
              } as Ballot,
            ],
          },
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons: [
            {
              neuronId: BigInt(666),
            } as NeuronInfo,
          ],
        })
      ).toBeTruthy();
    });
  });

  describe("hasMatchingProposals", () => {
    const neurons = [
      {
        neuronId: BigInt(0),
      } as NeuronInfo,
    ];

    it("should have matching proposals", () => {
      expect(
        hasMatchingProposals({
          proposals: mockProposals,
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeTruthy();

      expect(
        hasMatchingProposals({
          proposals: mockProposals.map((proposal) => ({
            ...proposal,
            ballots: [
              {
                neuronId: BigInt(0),
                vote: Vote.Unspecified,
              } as Ballot,
            ],
          })),
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeTruthy();

      expect(
        hasMatchingProposals({
          proposals: [
            ...mockProposals,
            {
              ...mockProposals[0],
              ballots: [
                {
                  neuronId: BigInt(0),
                  vote: Vote.Unspecified,
                } as Ballot,
              ],
            },
          ],
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeTruthy();

      expect(
        hasMatchingProposals({
          proposals: [
            ...mockProposals,
            {
              ...mockProposals[1],
              ballots: [
                {
                  neuronId: BigInt(0),
                  vote: Vote.Unspecified,
                } as Ballot,
              ],
            },
          ],
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeTruthy();

      expect(
        hasMatchingProposals({
          proposals: [
            ...mockProposals,
            {
              ...mockProposals[0],
              ballots: [
                {
                  neuronId: BigInt(0),
                  vote: Vote.Unspecified,
                } as Ballot,
              ],
            },
          ],
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeTruthy();

      expect(
        hasMatchingProposals({
          proposals: [
            ...mockProposals,
            {
              ...mockProposals[1],
              ballots: [
                {
                  neuronId: BigInt(0),
                  vote: Vote.Unspecified,
                } as Ballot,
              ],
            },
          ],
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeTruthy();
    });

    it("should not have matching proposals", () => {
      expect(
        hasMatchingProposals({
          proposals: [],
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: false,
          },
          neurons,
        })
      ).toBeFalsy();

      expect(
        hasMatchingProposals({
          proposals: [
            {
              ...mockProposals[0],
              ballots: [
                {
                  neuronId: BigInt(0),
                  vote: Vote.Yes,
                } as Ballot,
              ],
            },
          ],
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeFalsy();

      expect(
        hasMatchingProposals({
          proposals: [
            {
              ...mockProposals[0],
              ballots: [
                {
                  neuronId: BigInt(0),
                  vote: Vote.No,
                } as Ballot,
              ],
            },
          ],
          filters: {
            ...DEFAULT_PROPOSALS_FILTERS,
            excludeVotedProposals: true,
          },
          neurons,
        })
      ).toBeFalsy();
    });
  });

  describe("proposalActionFields", () => {
    it("should filter action fields", () => {
      const fields = proposalActionFields(proposalWithRewardNodeProviderAction);

      expect(fields.map(([key]) => key).join()).toEqual(
        "nodeProvider,amountE8s,rewardMode"
      );
    });

    it("should return empty array if no `action`", () => {
      const proposal = {
        ...mockProposalInfo.proposal,
        action: undefined,
      } as Proposal;
      const fields = proposalActionFields(proposal);

      expect(fields.length).toBe(0);
    });
  });

  describe("selectedNeuronsVotingPover", () => {
    const neuron = (id: number, votingPower: number): NeuronInfo =>
      ({
        ...mockNeuron,
        neuronId: BigInt(id),
        votingPower: BigInt(votingPower),
      } as NeuronInfo);

    const proposalInfo = (neurons: NeuronInfo[]): ProposalInfo => ({
      ...mockProposalInfo,
      ballots: neurons.map(({ neuronId, votingPower }) => ({
        neuronId,
        votingPower: votingPower - BigInt(1),
        vote: Vote.No,
      })),
    });

    it("should calculate total ballot voting power", () => {
      const neurons = [neuron(1, 1), neuron(2, 3), neuron(3, 5)];
      const proposal = proposalInfo(neurons);
      expect(
        selectedNeuronsVotingPower({
          neurons,
          selectedIds: [1, 2, 3].map(BigInt),
          proposal,
        })
      ).toBe(BigInt(6));
    });

    it("should take into account only selected neurons", () => {
      const neurons = [neuron(1, 1), neuron(2, 3), neuron(3, 5)];
      const proposal = proposalInfo(neurons);
      expect(
        selectedNeuronsVotingPower({
          neurons,
          selectedIds: [1, 3].map(BigInt),
          proposal,
        })
      ).toBe(BigInt(4));
    });

    it("should return 0 if no selection", () => {
      const neurons = [neuron(1, 1), neuron(2, 3), neuron(3, 5)];
      const proposal = proposalInfo(neurons);
      expect(
        selectedNeuronsVotingPower({
          neurons,
          selectedIds: [],
          proposal,
        })
      ).toBe(BigInt(0));
    });
  });

  describe("preserveNeuronSelectionAfterUpdate", () => {
    const neuron = (id: number): NeuronInfo =>
      ({
        ...mockNeuron,
        neuronId: BigInt(id),
      } as NeuronInfo);

    it("should preserve old selection", () => {
      expect(
        preserveNeuronSelectionAfterUpdate({
          selectedIds: [0, 1, 2].map(BigInt),
          neurons: [neuron(0), neuron(1), neuron(2)],
          updatedNeurons: [neuron(0), neuron(1), neuron(2)],
        })
      ).toEqual([0, 1, 2].map(BigInt));
      expect(
        preserveNeuronSelectionAfterUpdate({
          selectedIds: [0, 2].map(BigInt),
          neurons: [neuron(0), neuron(1), neuron(2)],
          updatedNeurons: [neuron(0), neuron(1), neuron(2)],
        })
      ).toEqual([0, 2].map(BigInt));
      expect(
        preserveNeuronSelectionAfterUpdate({
          selectedIds: [].map(BigInt),
          neurons: [neuron(0), neuron(1), neuron(2)],
          updatedNeurons: [neuron(0), neuron(1), neuron(2)],
        })
      ).toEqual([].map(BigInt));
    });

    it("should select new neurons", () => {
      expect(
        preserveNeuronSelectionAfterUpdate({
          selectedIds: [].map(BigInt),
          neurons: [neuron(0), neuron(1), neuron(2)],
          updatedNeurons: [
            neuron(0),
            neuron(1),
            neuron(2),
            neuron(3),
            neuron(4),
          ],
        })
      ).toEqual([3, 4].map(BigInt));
      expect(
        preserveNeuronSelectionAfterUpdate({
          selectedIds: [0].map(BigInt),
          neurons: [neuron(0), neuron(1)],
          updatedNeurons: [neuron(0), neuron(1), neuron(2)],
        })
      ).toEqual([0, 2].map(BigInt));
    });

    it("should remove selction from not existed anymore neurons", () => {
      expect(
        preserveNeuronSelectionAfterUpdate({
          selectedIds: [0, 1, 2].map(BigInt),
          neurons: [neuron(0), neuron(1), neuron(2)],
          updatedNeurons: [neuron(0), neuron(1)],
        })
      ).toEqual([0, 1].map(BigInt));
      expect(
        preserveNeuronSelectionAfterUpdate({
          selectedIds: [0, 1, 2].map(BigInt),
          neurons: [neuron(0), neuron(1), neuron(2)],
          updatedNeurons: [neuron(0), neuron(1), neuron(3)],
        })
      ).toEqual([0, 1, 3].map(BigInt));
    });
  });

  describe("proposalIdSet", () => {
    it("should return a set with ids", () => {
      const proposals = generateMockProposals(10);
      const idSet = proposalIdSet([...proposals, ...proposals]);
      expect(idSet.size).toBe(proposals.length);
      expect(Array.from(idSet).sort()).toStrictEqual(
        proposals.map(({ id }) => id).sort()
      );
    });

    it("should ignore records withoug id", () => {
      const proposals = generateMockProposals(2);
      proposals[0].id = undefined;
      const idSet = proposalIdSet(proposals);
      expect(idSet.size).toBe(1);
      expect(Array.from(idSet)).toStrictEqual([BigInt(1)]);
    });
  });

  describe("excludeProposals", () => {
    it("should exclude proposals", () => {
      const proposals = generateMockProposals(10);
      expect(
        excludeProposals({
          proposals: proposals,
          exclusion: proposals,
        })
      ).toEqual([]);
      expect(
        excludeProposals({
          proposals: proposals,
          exclusion: proposals.slice(5),
        })
      ).toEqual(proposals.slice(0, 5));
      expect(
        excludeProposals({
          proposals: proposals,
          exclusion: [],
        })
      ).toEqual(proposals);
      expect(
        excludeProposals({
          proposals: [],
          exclusion: proposals,
        })
      ).toEqual([]);
    });
  });

  describe("mapProposalInfo", () => {
    const now = nowInSeconds();
    const deadlineTimestampSeconds = BigInt(now + 1000000);
    const [proposalInfo] = generateMockProposals(1, {
      topic: Topic.Governance,
      status: ProposalStatus.Open,
      rewardStatus: ProposalRewardStatus.AcceptVotes,
      deadlineTimestampSeconds,
      proposer: BigInt(1234),
    });

    const proposal = {
      title: "test",
      url: "https://test.com",
    } as Proposal;

    it("should map proposalInfo fields", () => {
      const {
        topic,
        topicDescription,
        color,
        deadline,
        proposer,
        title,
        url,
        status,
        statusString,
        statusDescription,
        rewardStatus,
        rewardStatusString,
        rewardStatusDescription,
      } = mapProposalInfo({
        ...proposalInfo,
        proposal,
      });

      expect(topic).toEqual(en.topics.Governance);
      expect(topicDescription).toEqual(en.topics_description.Governance);
      expect(color).toEqual(PROPOSAL_COLOR[ProposalStatus.Open]);
      expect(deadline).toEqual(
        deadlineTimestampSeconds - BigInt(nowInSeconds())
      );
      expect(proposer).toEqual(BigInt(1234));
      expect(title).toEqual(proposal.title);
      expect(url).toEqual(proposal.url);

      expect(status).toEqual(proposalInfo.status);
      expect(statusString).toEqual(
        en.status[ProposalStatus[proposalInfo.status]]
      );
      expect(statusDescription).toEqual(
        en.status_description[ProposalStatus[proposalInfo.status]]
      );

      expect(rewardStatus).toEqual(proposalInfo.rewardStatus);
      expect(rewardStatusString).toEqual(
        en.rewards[ProposalRewardStatus[proposalInfo.rewardStatus]]
      );
      expect(rewardStatusDescription).toEqual(
        en.rewards_description[ProposalRewardStatus[proposalInfo.rewardStatus]]
      );
    });

    it("should map action to undefined", () => {
      const { type, typeDescription } = mapProposalInfo({
        ...proposalInfo,
        proposal,
      });

      expect(type).toBeUndefined();
      expect(typeDescription).toBeUndefined();
    });

    it("should map action to type", () => {
      const { type, typeDescription } = mapProposalInfo({
        ...proposalInfo,
        proposal: {
          ...proposal,
          action: { RegisterKnownNeuron: {} as KnownNeuron },
        },
      });

      expect(en.actions.RegisterKnownNeuron).toEqual(type);
      expect(en.actions_description.RegisterKnownNeuron).toEqual(
        typeDescription
      );
    });

    it("should map nns function to type", () => {
      const { type, typeDescription } = mapProposalInfo({
        ...proposalInfo,
        proposal: {
          ...proposal,
          action: {
            ExecuteNnsFunction: { nnsFunctionId: 3 } as ExecuteNnsFunction,
          },
        },
      });

      expect(en.nns_functions.NnsCanisterInstall).toEqual(type);
      expect(en.nns_functions_description.NnsCanisterInstall).toEqual(
        typeDescription
      );
    });
  });

  describe("concatenateUniqueProposals", () => {
    it("should concatenate proposals", () => {
      const proposals = generateMockProposals(10);
      const result = concatenateUniqueProposals({
        oldProposals: proposals.slice(0, 5),
        newProposals: proposals.slice(5),
      });
      expect(result).toEqual(proposals);
    });

    it("should concatenate only unique proposals", () => {
      const proposals = generateMockProposals(10);
      const result = concatenateUniqueProposals({
        oldProposals: proposals.slice(0, 5),
        newProposals: proposals,
      });
      expect(result).toEqual(proposals);
    });
  });

  describe("replaceAndConcatenateProposals", () => {
    const proposalsA = generateMockProposals(10, {
      proposalTimestampSeconds: BigInt(0),
    });
    const proposalsB = generateMockProposals(10, {
      proposalTimestampSeconds: BigInt(0),
    });

    it("should replace proposals by id", () => {
      const result = replaceAndConcatenateProposals({
        oldProposals: proposalsA,
        newProposals: proposalsB,
      });
      expect(result).toStrictEqual(proposalsB);
    });

    it("should concatinate proposals", () => {
      const result = replaceAndConcatenateProposals({
        oldProposals: [],
        newProposals: proposalsB,
      });
      expect(result).toStrictEqual(proposalsB);
    });

    it("should replace and concatinate", () => {
      const oldProposals = proposalsA.slice(5);
      const newProposals = proposalsB.slice(0, 5);
      const result = replaceAndConcatenateProposals({
        oldProposals,
        newProposals,
      });
      expect(result).toStrictEqual([...oldProposals, ...newProposals]);
    });
  });

  describe("proposalsHaveSameIds", () => {
    const proposals = generateMockProposals(10);

    it("should comprare", () => {
      expect(
        proposalsHaveSameIds({ proposalsA: [], proposalsB: [] })
      ).toBeTruthy();
      expect(
        proposalsHaveSameIds({
          proposalsA: proposals,
          proposalsB: proposals.slice(0),
        })
      ).toBeTruthy();
      expect(
        proposalsHaveSameIds({
          proposalsA: proposals,
          proposalsB: proposals.slice(1),
        })
      ).toBeFalsy();
      expect(
        proposalsHaveSameIds({
          proposalsA: generateMockProposals(20).slice(10),
          proposalsB: proposals,
        })
      ).toBeFalsy();
    });
  });

  describe("replaceProposals", () => {
    const oldProposals = generateMockProposals(10, {
      proposalTimestampSeconds: BigInt(1),
    });
    const newProposals = generateMockProposals(10, {
      proposalTimestampSeconds: BigInt(2),
    });

    it("should replace proposals", () => {
      expect(
        replaceProposals({
          oldProposals,
          newProposals,
        })
      ).toEqual(newProposals);
    });

    it("should not remove existent proposals", () => {
      expect(
        replaceProposals({
          oldProposals,
          newProposals: newProposals.slice(5),
        })
      ).toEqual([...oldProposals.slice(0, 5), ...newProposals.slice(5)]);
    });

    it("should not add new proposals", () => {
      expect(
        replaceProposals({
          oldProposals: [],
          newProposals,
        })
      ).toEqual([]);
    });
  });

  describe("getVotingBallot", () => {
    it("should return ballot of neuron if present", () => {
      const neuronId = BigInt(100);
      const ballot: Ballot = {
        neuronId,
        votingPower: BigInt(30),
        vote: Vote.Yes,
      };
      const proposal = {
        ...mockProposalInfo,
        ballots: [ballot],
      };
      expect(
        getVotingBallot({
          neuronId,
          proposalInfo: proposal,
        })
      ).toEqual(ballot);
    });

    it("should return undefined if ballot not present", () => {
      const neuronId = BigInt(100);
      const ballot: Ballot = {
        neuronId: BigInt(400),
        votingPower: BigInt(30),
        vote: Vote.Yes,
      };
      const proposal = {
        ...mockProposalInfo,
        ballots: [ballot],
      };
      expect(
        getVotingBallot({
          neuronId,
          proposalInfo: proposal,
        })
      ).toBeUndefined();
    });
  });

  describe("getVotingPower", () => {
    it("should return ballot voting power if present", () => {
      const neuronId = BigInt(100);
      const neuron = {
        ...mockNeuron,
        neuronId,
      };
      const ballot: Ballot = {
        neuronId,
        votingPower: BigInt(30),
        vote: Vote.Yes,
      };
      const proposal = {
        ...mockProposalInfo,
        ballots: [ballot],
      };
      expect(
        getVotingPower({
          neuron,
          proposal,
        })
      ).toEqual(ballot.votingPower);
    });

    it("should return neuron voting power if no ballot", () => {
      const proposal = {
        ...mockProposalInfo,
        ballots: [],
      };
      expect(
        getVotingPower({
          neuron: mockNeuron,
          proposal,
        })
      ).toBe(mockNeuron.votingPower);
    });
  });

  describe("getNnsFunctionIndex", () => {
    it("should return nnsFunctionKey from proposal", () => {
      expect(
        getNnsFunctionKey({
          ...mockProposalInfo.proposal,
          action: {
            ExecuteNnsFunction: {
              nnsFunctionId: 4,
            },
          },
        } as Proposal)
      ).toBe(NnsFunction[NnsFunction.NnsCanisterUpgrade]);
    });

    it("should return undefined if not ExecuteNnsFunction type", () => {
      expect(
        getNnsFunctionKey({
          ...mockProposalInfo.proposal,
          action: {},
        } as Proposal)
      ).toBeUndefined();
    });

    it("should return undefined if undefined", () => {
      expect(getNnsFunctionKey(undefined)).toBeUndefined();
    });
  });

  describe("Open for votes", () => {
    it("should be open for votes", () => {
      const nowSeconds = new Date().getTime() / 1000;
      expect(
        isProposalDeadlineInTheFuture({
          ...mockProposalInfo,
          deadlineTimestampSeconds: BigInt(Math.round(nowSeconds + 10000)),
        })
      ).toBeTruthy();
    });

    it("should not be open for votes", () => {
      const nowSeconds = new Date().getTime() / 1000;
      expect(
        isProposalDeadlineInTheFuture({
          ...mockProposalInfo,
          deadlineTimestampSeconds: BigInt(Math.round(nowSeconds - 10000)),
        })
      ).toBeFalsy();
    });

    it("should be open for votes short period", () => {
      const nowSeconds = new Date().getTime() / 1000;
      expect(
        isProposalDeadlineInTheFuture({
          ...mockProposalInfo,
          deadlineTimestampSeconds: undefined,
          topic: Topic.ManageNeuron,
          proposalTimestampSeconds: BigInt(Math.round(nowSeconds - 3600)),
        })
      ).toBeTruthy();
    });

    it("should not be open for votes short period", () => {
      const nowSeconds = new Date().getTime() / 1000;
      expect(
        isProposalDeadlineInTheFuture({
          ...mockProposalInfo,
          deadlineTimestampSeconds: undefined,
          topic: Topic.ManageNeuron,
          proposalTimestampSeconds: BigInt(Math.round(nowSeconds - 3600 * 13)),
        })
      ).toBeFalsy();
    });

    it("should be open for votes quiet threshold", () => {
      const nowSeconds = new Date().getTime() / 1000;
      expect(
        isProposalDeadlineInTheFuture({
          ...mockProposalInfo,
          deadlineTimestampSeconds: undefined,
          topic: Topic.Governance,
          proposalTimestampSeconds: BigInt(Math.round(nowSeconds - 3600)),
        })
      ).toBeTruthy();

      expect(
        isProposalDeadlineInTheFuture({
          ...mockProposalInfo,
          deadlineTimestampSeconds: undefined,
          topic: Topic.Governance,
          proposalTimestampSeconds: BigInt(Math.round(nowSeconds - 3600 * 13)),
        })
      ).toBeTruthy();

      expect(
        isProposalDeadlineInTheFuture({
          ...mockProposalInfo,
          deadlineTimestampSeconds: undefined,
          topic: Topic.Governance,
          proposalTimestampSeconds: BigInt(
            Math.round(nowSeconds - 3600 * 24 * 3)
          ),
        })
      ).toBeTruthy();
    });

    it("should not be open for votes quiet threshold", () => {
      const nowSeconds = new Date().getTime() / 1000;
      expect(
        isProposalDeadlineInTheFuture({
          ...mockProposalInfo,
          deadlineTimestampSeconds: undefined,
          topic: Topic.Governance,
          proposalTimestampSeconds: BigInt(
            Math.round(nowSeconds - 3600 * 24 * 5)
          ),
        })
      ).toBeFalsy();
    });
  });
});
