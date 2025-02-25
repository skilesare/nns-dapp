use crate::accounts_store::{CreateCanisterArgs, RefundTransactionArgs, TopUpCanisterArgs};
use crate::canisters::ledger;
use crate::canisters::{cmc, governance, swap};
use crate::constants::{MEMO_CREATE_CANISTER, MEMO_TOP_UP_CANISTER};
use crate::multi_part_transactions_processor::MultiPartTransactionToBeProcessed;
use crate::state::STATE;
use crate::{ledger_sync, Cycles};
use cycles_minting_canister::{NotifyCreateCanister, NotifyError, NotifyTopUp};
use dfn_core::api::{CanisterId, PrincipalId};
use ic_nns_common::types::NeuronId;
use ic_nns_constants::CYCLES_MINTING_CANISTER_ID;
use ic_nns_governance::pb::v1::{claim_or_refresh_neuron_from_account_response, ClaimOrRefreshNeuronFromAccount};
use ic_sns_swap::pb::v1::RefreshBuyerTokensRequest;
use ledger_canister::{
    AccountBalanceArgs, AccountIdentifier, BlockIndex, Memo, SendArgs, Subaccount, Tokens, DEFAULT_TRANSFER_FEE,
};

const PRUNE_TRANSACTIONS_COUNT: u32 = 1000;

pub async fn run_periodic_tasks() {
    ledger_sync::sync_transactions().await;

    let maybe_transaction_to_process =
        STATE.with(|s| s.accounts_store.borrow_mut().try_take_next_transaction_to_process());
    if let Some((block_height, transaction_to_process)) = maybe_transaction_to_process {
        match transaction_to_process {
            MultiPartTransactionToBeProcessed::ParticipateSwap(principal, from, to, swap_canister_id) => {
                handle_participate_swap(block_height, principal, from, to, swap_canister_id).await;
            }
            MultiPartTransactionToBeProcessed::StakeNeuron(principal, memo) => {
                handle_stake_neuron(block_height, principal, memo).await;
            }
            MultiPartTransactionToBeProcessed::TopUpNeuron(principal, memo) => {
                handle_top_up_neuron(block_height, principal, memo).await;
            }
            MultiPartTransactionToBeProcessed::CreateCanister(args) => {
                handle_create_canister(block_height, args).await;
            }
            MultiPartTransactionToBeProcessed::TopUpCanister(args) => {
                handle_top_up_canister(block_height, args).await;
            }
            MultiPartTransactionToBeProcessed::RefundTransaction(args) => {
                handle_refund(args).await;
            }
            MultiPartTransactionToBeProcessed::CreateCanisterV2(controller) => {
                handle_create_canister_v2(block_height, controller).await;
            }
            MultiPartTransactionToBeProcessed::TopUpCanisterV2(principal, canister_id) => {
                handle_top_up_canister_v2(block_height, principal, canister_id).await;
            }
        }
    }

    if should_prune_transactions() {
        STATE.with(|s| {
            s.accounts_store
                .borrow_mut()
                .prune_transactions(PRUNE_TRANSACTIONS_COUNT)
        });
    }
}

async fn handle_participate_swap(
    block_height: BlockIndex,
    principal: PrincipalId,
    from: AccountIdentifier,
    to: AccountIdentifier,
    swap_canister_id: CanisterId,
) {
    let request = RefreshBuyerTokensRequest {
        buyer: principal.to_string(),
    };
    if swap::notify_swap_participation(swap_canister_id, request).await.is_ok() {
        STATE.with(|s| {
            s.accounts_store
                .borrow_mut()
                .complete_pending_transaction(from, to, block_height)
        });
    }
}

async fn handle_stake_neuron(block_height: BlockIndex, principal: PrincipalId, memo: Memo) {
    match claim_or_refresh_neuron(principal, memo).await {
        Ok(neuron_id) => STATE.with(|s| {
            s.accounts_store
                .borrow_mut()
                .mark_neuron_created(&principal, block_height, memo, neuron_id)
        }),
        Err(e) => STATE.with(|s| {
            s.accounts_store
                .borrow_mut()
                .process_multi_part_transaction_error(block_height, e, false)
        }),
    }
}

async fn handle_top_up_neuron(block_height: BlockIndex, principal: PrincipalId, memo: Memo) {
    match claim_or_refresh_neuron(principal, memo).await {
        Ok(_) => STATE.with(|s| s.accounts_store.borrow_mut().mark_neuron_topped_up(block_height)),
        Err(e) => STATE.with(|s| {
            s.accounts_store
                .borrow_mut()
                .process_multi_part_transaction_error(block_height, e, false)
        }),
    }
}

async fn handle_create_canister_v2(block_height: BlockIndex, controller: PrincipalId) {
    match create_canister_v2(block_height, controller).await {
        Ok(Ok(canister_id)) => STATE.with(|s| {
            s.accounts_store
                .borrow_mut()
                .attach_newly_created_canister(controller, block_height, canister_id)
        }),
        Ok(Err(NotifyError::Processing)) => {
            STATE.with(|s| {
                s.accounts_store.borrow_mut().enqueue_multi_part_transaction(
                    controller,
                    block_height,
                    MultiPartTransactionToBeProcessed::CreateCanisterV2(controller),
                )
            });
        }
        Ok(Err(error)) => {
            STATE.with(|s| {
                s.accounts_store.borrow_mut().process_multi_part_transaction_error(
                    block_height,
                    error.to_string(),
                    false,
                )
            });
        }
        Err(error) => {
            STATE.with(|s| {
                s.accounts_store
                    .borrow_mut()
                    .process_multi_part_transaction_error(block_height, error.clone(), true)
            });
        }
    }
}

async fn handle_create_canister(block_height: BlockIndex, args: CreateCanisterArgs) {
    match create_canister(args.controller, args.amount).await {
        Ok(Ok(canister_id)) => STATE.with(|s| {
            s.accounts_store
                .borrow_mut()
                .attach_newly_created_canister(args.controller, block_height, canister_id)
        }),
        Ok(Err(error)) => {
            let was_refunded = matches!(error, NotifyError::Refunded { .. });
            STATE.with(|s| {
                s.accounts_store.borrow_mut().process_multi_part_transaction_error(
                    block_height,
                    error.to_string(),
                    was_refunded,
                )
            });
            if was_refunded {
                let subaccount = (&args.controller).into();
                enqueue_create_or_top_up_canister_refund(
                    args.controller,
                    subaccount,
                    block_height,
                    args.refund_address,
                    error.to_string(),
                )
                .await;
            }
        }
        Err(error) => {
            STATE.with(|s| {
                s.accounts_store
                    .borrow_mut()
                    .process_multi_part_transaction_error(block_height, error.clone(), true)
            });
            let subaccount = (&args.controller).into();
            enqueue_create_or_top_up_canister_refund(
                args.controller,
                subaccount,
                block_height,
                args.refund_address,
                error,
            )
            .await;
        }
    }
}

async fn handle_top_up_canister_v2(block_height: BlockIndex, principal: PrincipalId, canister_id: CanisterId) {
    match top_up_canister_v2(block_height, canister_id).await {
        Ok(Ok(_)) => STATE.with(|s| s.accounts_store.borrow_mut().mark_canister_topped_up(block_height)),
        Ok(Err(NotifyError::Processing)) => {
            STATE.with(|s| {
                s.accounts_store.borrow_mut().enqueue_multi_part_transaction(
                    principal,
                    block_height,
                    MultiPartTransactionToBeProcessed::CreateCanisterV2(principal),
                )
            });
        }
        Ok(Err(error)) => {
            STATE.with(|s| {
                s.accounts_store.borrow_mut().process_multi_part_transaction_error(
                    block_height,
                    format!("{:?}", error),
                    false,
                )
            });
        }
        Err(error) => {
            STATE.with(|s| {
                s.accounts_store
                    .borrow_mut()
                    .process_multi_part_transaction_error(block_height, error, false)
            });
        }
    }
}

async fn handle_top_up_canister(block_height: BlockIndex, args: TopUpCanisterArgs) {
    match top_up_canister(args.canister_id, args.amount).await {
        Ok(Ok(_)) => STATE.with(|s| s.accounts_store.borrow_mut().mark_canister_topped_up(block_height)),
        Ok(Err(error)) => {
            let was_refunded = matches!(error, NotifyError::Refunded { .. });
            STATE.with(|s| {
                s.accounts_store.borrow_mut().process_multi_part_transaction_error(
                    block_height,
                    error.to_string(),
                    was_refunded,
                )
            });
            if was_refunded {
                let subaccount = (&args.principal).into();
                enqueue_create_or_top_up_canister_refund(
                    args.principal,
                    subaccount,
                    block_height,
                    args.refund_address,
                    error.to_string(),
                )
                .await;
            }
        }
        Err(error) => {
            STATE.with(|s| {
                s.accounts_store
                    .borrow_mut()
                    .process_multi_part_transaction_error(block_height, error.clone(), true)
            });
            let subaccount = (&args.principal).into();
            enqueue_create_or_top_up_canister_refund(
                args.principal,
                subaccount,
                block_height,
                args.refund_address,
                error,
            )
            .await;
        }
    }
}

async fn handle_refund(args: RefundTransactionArgs) {
    let send_request = SendArgs {
        memo: Memo(0),
        amount: args.amount,
        fee: DEFAULT_TRANSFER_FEE,
        from_subaccount: Some(args.from_sub_account),
        to: args.refund_address,
        created_at_time: None,
    };

    match ledger::send(send_request.clone()).await {
        Ok(block_height) => {
            STATE.with(|s| {
                s.accounts_store.borrow_mut().process_transaction_refund_completed(
                    args.original_transaction_block_height,
                    block_height,
                    args.error_message,
                )
            });
        }
        Err(error) => {
            STATE.with(|s| {
                s.accounts_store.borrow_mut().process_multi_part_transaction_error(
                    args.original_transaction_block_height,
                    error,
                    false,
                )
            });
        }
    }
}

async fn claim_or_refresh_neuron(principal: PrincipalId, memo: Memo) -> Result<NeuronId, String> {
    let request = ClaimOrRefreshNeuronFromAccount {
        controller: Some(principal),
        memo: memo.0,
    };

    match governance::claim_or_refresh_neuron_from_account(request).await {
        Ok(response) => match response.result {
            Some(claim_or_refresh_neuron_from_account_response::Result::NeuronId(neuron_id)) => Ok(neuron_id.into()),
            Some(claim_or_refresh_neuron_from_account_response::Result::Error(e)) => Err(e.error_message),
            None => Err("'response.result' was empty".to_string()),
        },
        Err(e) => Err(e),
    }
}

async fn create_canister_v2(
    block_index: BlockIndex,
    controller: PrincipalId,
) -> Result<Result<CanisterId, NotifyError>, String> {
    let notify_request = NotifyCreateCanister {
        block_index,
        controller,
        subnet_type: None,
    };

    cmc::notify_create_canister(notify_request).await
}

async fn create_canister(principal: PrincipalId, amount: Tokens) -> Result<Result<CanisterId, NotifyError>, String> {
    // We need to hold back 1 transaction fee for the 'send' and also 1 for the 'notify'
    let send_amount = Tokens::from_e8s(amount.get_e8s() - (2 * DEFAULT_TRANSFER_FEE.get_e8s()));
    let subaccount: Subaccount = (&principal).into();

    let send_request = SendArgs {
        memo: MEMO_CREATE_CANISTER,
        amount: send_amount,
        fee: DEFAULT_TRANSFER_FEE,
        from_subaccount: Some(subaccount),
        to: AccountIdentifier::new(CYCLES_MINTING_CANISTER_ID.into(), Some(subaccount)),
        created_at_time: None,
    };

    let block_index = ledger::send(send_request.clone()).await?;

    let notify_request = NotifyCreateCanister {
        block_index,
        controller: principal,
        subnet_type: None,
    };

    cmc::notify_create_canister(notify_request).await
}

async fn top_up_canister_v2(
    block_index: BlockIndex,
    canister_id: CanisterId,
) -> Result<Result<Cycles, NotifyError>, String> {
    let notify_request = NotifyTopUp {
        block_index,
        canister_id,
    };

    cmc::notify_top_up_canister(notify_request).await
}

async fn top_up_canister(canister_id: CanisterId, amount: Tokens) -> Result<Result<Cycles, NotifyError>, String> {
    // We need to hold back 1 transaction fee for the 'send' and also 1 for the 'notify'
    let send_amount = Tokens::from_e8s(amount.get_e8s() - (2 * DEFAULT_TRANSFER_FEE.get_e8s()));
    let subaccount: Subaccount = (&canister_id).into();

    let send_request = SendArgs {
        memo: MEMO_TOP_UP_CANISTER,
        amount: send_amount,
        fee: DEFAULT_TRANSFER_FEE,
        from_subaccount: Some(subaccount),
        to: AccountIdentifier::new(CYCLES_MINTING_CANISTER_ID.into(), Some(subaccount)),
        created_at_time: None,
    };

    let block_index = ledger::send(send_request.clone()).await?;

    let notify_request = NotifyTopUp {
        block_index,
        canister_id,
    };

    cmc::notify_top_up_canister(notify_request).await
}

async fn enqueue_create_or_top_up_canister_refund(
    principal: PrincipalId,
    subaccount: Subaccount,
    block_height: BlockIndex,
    refund_address: AccountIdentifier,
    error_message: String,
) {
    let from_account = AccountIdentifier::new(dfn_core::api::id().get(), Some(subaccount));
    let balance_request = AccountBalanceArgs { account: from_account };

    match ledger::account_balance(balance_request).await {
        Ok(balance) => {
            let refund_amount_e8s = balance.get_e8s().saturating_sub(DEFAULT_TRANSFER_FEE.get_e8s());
            if refund_amount_e8s > 0 {
                let refund_args = RefundTransactionArgs {
                    recipient_principal: principal,
                    from_sub_account: subaccount,
                    amount: Tokens::from_e8s(refund_amount_e8s),
                    original_transaction_block_height: block_height,
                    refund_address,
                    error_message,
                };
                STATE.with(|s| {
                    s.accounts_store
                        .borrow_mut()
                        .enqueue_transaction_to_be_refunded(refund_args)
                })
            } else {
                let error_message = format!("Unable to refund, account balance too low. Account: {}", from_account);
                STATE.with(|s| {
                    s.accounts_store.borrow_mut().process_multi_part_transaction_error(
                        block_height,
                        error_message,
                        false,
                    )
                });
            }
        }
        Err(error) => STATE.with(|s| {
            s.accounts_store
                .borrow_mut()
                .process_multi_part_transaction_error(block_height, error, false)
        }),
    };
}

fn should_prune_transactions() -> bool {
    #[cfg(target_arch = "wasm32")]
    {
        const MEMORY_LIMIT_BYTES: u32 = 1024 * 1024 * 1024; // 1GB
        let memory_usage_bytes = (core::arch::wasm32::memory_size(0) * 65536) as u32;
        memory_usage_bytes > MEMORY_LIMIT_BYTES
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        const TRANSACTIONS_COUNT_LIMIT: u32 = 1_000_000;
        let transactions_count = STATE.with(|s| s.accounts_store.borrow().get_transactions_count());
        transactions_count > TRANSACTIONS_COUNT_LIMIT
    }
}
