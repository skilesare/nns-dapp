import { AnonymousIdentity, HttpAgent, SignIdentity } from "@dfinity/agent";
import ledgerBuilder from "./canisters/ledger/builder";
import LedgerService, {
    GetBalancesRequest,
    SendICPTsRequest
} from "./canisters/ledger/model";
import ledgerViewBuilder from "./canisters/nnsUI/builder";
import LedgerViewService, {
    AccountDetails,
    AttachCanisterRequest,
    AttachCanisterResult,
    CanisterDetails,
    CreateSubAccountResponse,
    GetTransactionsRequest,
    GetTransactionsResponse,
    RegisterHardwareWalletRequest,
    RegisterHardwareWalletResponse
} from "./canisters/nnsUI/model";
import { create_dummy_proposals, test_happy_path } from "./tests";
import createNeuronImpl, { CreateNeuronRequest } from "./canisters/ledger/createNeuron";
import { NeuronId } from "./canisters/governance/model";
import { createCanisterImpl, topupCanisterImpl, CreateCanisterRequest, TopupCanisterRequest, CreateCanisterResponse } from "./canisters/ledger/createCanister";
import { AccountIdentifier, BlockHeight, E8s } from "./canisters/common/types";
import { LedgerIdentity } from "@dfinity/identity-ledgerhq";
import { principalToAccountIdentifier } from "./canisters/converter";

export default class LedgerApi {
    private readonly ledgerService: LedgerService;
    private readonly ledgerViewService: LedgerViewService;
    private readonly host: string;
    private readonly identity: SignIdentity;

    constructor(host: string, identity: SignIdentity) {
        const agent = new HttpAgent({
            host,
            identity
        });
        this.ledgerService = ledgerBuilder(agent, identity);
        this.ledgerViewService = ledgerViewBuilder(agent);
        this.host = host;
        this.identity = identity;
    }

    // Temporary method for demo purposes only, to give the specified account some ICPTs
    // by sending from the anon account which has been gifted lots of ICPTs
    public acquireICPTs = async (accountIdentifier: AccountIdentifier, e8s: E8s): Promise<void> => {
        const anonIdentity = new AnonymousIdentity();
        const agent = new HttpAgent({
            host: this.host,
            identity: anonIdentity
        });
        const anonLedgerService = ledgerBuilder(agent, anonIdentity);
        const req = {
            to: accountIdentifier,
            amount: e8s
        }
        console.log("aquire req");
        console.log(req);
        await anonLedgerService.sendICPTs(req);
        await this.ledgerViewService.syncTransactions();
    }

    public createSubAccount = (name: string) : Promise<CreateSubAccountResponse> => {
        return this.ledgerViewService.createSubAccount(name);
    }

    public registerHardwareWallet = (name: string, identity: LedgerIdentity) : Promise<RegisterHardwareWalletResponse> => {
        const accountIdentifier = principalToAccountIdentifier(identity.getPrincipal());
        const request: RegisterHardwareWalletRequest = {
            name,
            accountIdentifier
        };
        return this.ledgerViewService.registerHardwareWallet(request);
    }

    public getAccount = async () : Promise<AccountDetails> => {
        const response = await this.ledgerViewService.getAccount();
        if ("Ok" in response) {
            return response.Ok;
        } else {
            const accountIdentifier = await this.ledgerViewService.addAccount();
            return {
                accountIdentifier,
                subAccounts: [],
                hardwareWalletAccounts: []
            };
        }
    }

    public getBalances = (request: GetBalancesRequest) : Promise<Record<AccountIdentifier, E8s>> => {
        return this.ledgerService.getBalances(request);
    }

    public getTransactions = (request: GetTransactionsRequest) : Promise<GetTransactionsResponse> => {
        return this.ledgerViewService.getTransactions(request);
    }

    public sendICPTs = async (request: SendICPTsRequest): Promise<BlockHeight> => {
        const response = await this.ledgerService.sendICPTs(request);
        this.ledgerViewService.syncTransactions();
        return response;
    }

    public createNeuron = async (request: CreateNeuronRequest) : Promise<NeuronId> => {
        return createNeuronImpl(
            this.identity, 
            this.ledgerService, 
            request);
    }

    public createCanister = async (request: CreateCanisterRequest) : Promise<CreateCanisterResponse> => {
        return createCanisterImpl(
            this.identity.getPrincipal(), 
            this.ledgerService, 
            this.ledgerViewService,
            request);
    }

    public topupCanister = async (request: TopupCanisterRequest) : Promise<void> => {
        return topupCanisterImpl(
            this.ledgerService, 
            request);
    }

    public attachCanister = async (request: AttachCanisterRequest) : Promise<AttachCanisterResult> => {
        return this.ledgerViewService.attachCanister(request);
    }

    public getCanisters = async (): Promise<Array<CanisterDetails>> => {
        return this.ledgerViewService.getCanisters();
    }

    public getIcpToCyclesConversionRate = async (): Promise<bigint> => {
        return await this.ledgerViewService.getIcpToCyclesConversionRate();
    } 

    public integrationTest = async (): Promise<void> => {
        return await test_happy_path(this.host, this.identity);
    }

    public createDummyProposals = async (neuronId: string): Promise<void> => {
        return await create_dummy_proposals(this.host, this.identity, BigInt(neuronId));
    }
}
