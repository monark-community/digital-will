mod abi;
#[allow(unused)]
mod pb;
use hex_literal::hex;
use pb::contract::v1 as contract;
use substreams::prelude::*;
use substreams::store;
use substreams::Hex;
use substreams_ethereum::pb::eth::v2 as eth;
use substreams_ethereum::Event;

#[allow(unused_imports)] // Might not be needed depending on actual ABI, hence the allow
use {num_traits::cast::ToPrimitive, std::str::FromStr, substreams::scalar::BigDecimal};

substreams_ethereum::init!();

const WILLFACTORY_TRACKED_CONTRACT: [u8; 20] = hex!("6cbd60e8222f5f07d32c773ef15fd01a43ec8328");

fn map_willfactory_events(blk: &eth::Block, events: &mut contract::Events) {
    for rcpt in blk.receipts() {
        for log in rcpt.receipt.logs.iter().filter(|log| log.address == WILLFACTORY_TRACKED_CONTRACT) {
            if let Some(event) = abi::willfactory_contract::events::EvtWillChainWillCreated::match_and_decode(log) {
                events.willfactory_evt_will_chain_will_createds.push(contract::WillfactoryEvtWillChainWillCreated {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    mp_address: event.mp_address,
                    will_address: event.will_address,
                });
                continue;
            }
        }
    }
}
fn map_willfactory_calls(blk: &eth::Block, calls: &mut contract::Calls) {
    for tx in blk.transactions() {
        for call in tx.calls.iter().filter(|call| !call.state_reverted && call.address == WILLFACTORY_TRACKED_CONTRACT) {
            if abi::willfactory_contract::functions::CreateWill::match_call(call) {
                if let Ok(decoded_call) = abi::willfactory_contract::functions::CreateWill::decode(call) {
                    let output_param0 = match abi::willfactory_contract::functions::CreateWill::output(&call.return_data) {
                        Ok(output_param0) => {output_param0}
                        Err(_) => Default::default(),
                    };
                    
                    calls.willfactory_call_create_wills.push(contract::WillfactoryCreateWillCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        output_param0: output_param0,
                        owner: decoded_call.owner,
                    });
                }
                continue;
            }
        }
    }
}

#[substreams::handlers::map]
fn map_events_calls(
    events: contract::Events,
    calls: contract::Calls,
) -> Result<contract::EventsCalls, substreams::errors::Error> {
    Ok(contract::EventsCalls {
        events: Some(events),
        calls: Some(calls),
    })
}
fn is_declared_dds_address(addr: &Vec<u8>, ordinal: u64, dds_store: &store::StoreGetInt64) -> bool {
    //    substreams::log::info!("Checking if address {} is declared dds address", Hex(addr).to_string());
    if dds_store.get_at(ordinal, Hex(addr).to_string()).is_some() {
        return true;
    }
    return false;
}
fn map_will_events(
    blk: &eth::Block,
    dds_store: &store::StoreGetInt64,
    events: &mut contract::Events,
) {
    for rcpt in blk.receipts() {
        for log in rcpt.receipt.logs.iter().filter(|log| is_declared_dds_address(&log.address, log.ordinal, dds_store)) {
            if let Some(event) = abi::will_contract::events::EvtWillChainAssetsDeposited::match_and_decode(log) {
                events.will_evt_will_chain_assets_depositeds.push(contract::WillEvtWillChainAssetsDeposited {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    amount: event.amount.to_string(),
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainAssetsSwapped::match_and_decode(log) {
                events.will_evt_will_chain_assets_swappeds.push(contract::WillEvtWillChainAssetsSwapped {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    sm_address: event.sm_address,
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainAssetsWithdrawn::match_and_decode(log) {
                events.will_evt_will_chain_assets_withdrawns.push(contract::WillEvtWillChainAssetsWithdrawn {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    amount: event.amount.to_string(),
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainAssetsWithdrawnAll::match_and_decode(log) {
                events.will_evt_will_chain_assets_withdrawn_alls.push(contract::WillEvtWillChainAssetsWithdrawnAll {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainDeathConfirmed::match_and_decode(log) {
                events.will_evt_will_chain_death_confirmeds.push(contract::WillEvtWillChainDeathConfirmed {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    sm_address: event.sm_address,
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainDeathDeclared::match_and_decode(log) {
                events.will_evt_will_chain_death_declareds.push(contract::WillEvtWillChainDeathDeclared {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    sm_address: event.sm_address,
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainSmAdded::match_and_decode(log) {
                events.will_evt_will_chain_sm_addeds.push(contract::WillEvtWillChainSmAdded {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    sm_address: event.sm_address,
                    vote_power: event.vote_power.to_u64(),
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainSmDesisted::match_and_decode(log) {
                events.will_evt_will_chain_sm_desisteds.push(contract::WillEvtWillChainSmDesisted {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    sm_address: event.sm_address,
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainSmRemoved::match_and_decode(log) {
                events.will_evt_will_chain_sm_removeds.push(contract::WillEvtWillChainSmRemoved {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    sm_address: event.sm_address,
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainSmUpdated::match_and_decode(log) {
                events.will_evt_will_chain_sm_updateds.push(contract::WillEvtWillChainSmUpdated {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    sm_address: event.sm_address,
                    vote_power: event.vote_power.to_u64(),
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainSmValidated::match_and_decode(log) {
                events.will_evt_will_chain_sm_validateds.push(contract::WillEvtWillChainSmValidated {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    sm_address: event.sm_address,
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainSecurityPeriodUpdated::match_and_decode(log) {
                events.will_evt_will_chain_security_period_updateds.push(contract::WillEvtWillChainSecurityPeriodUpdated {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    max_security_period: event.max_security_period.to_string(),
                    min_security_period: event.min_security_period.to_string(),
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainVetoExercised::match_and_decode(log) {
                events.will_evt_will_chain_veto_exerciseds.push(contract::WillEvtWillChainVetoExercised {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainWillActivated::match_and_decode(log) {
                events.will_evt_will_chain_will_activateds.push(contract::WillEvtWillChainWillActivated {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                });
                continue;
            }
            if let Some(event) = abi::will_contract::events::EvtWillChainWillCanceled::match_and_decode(log) {
                events.will_evt_will_chain_will_canceleds.push(contract::WillEvtWillChainWillCanceled {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                });
                continue;
            }
        }
    }
}
fn map_will_calls(
    blk: &eth::Block,
    dds_store: &store::StoreGetInt64,
    calls: &mut contract::Calls,
) {
    for tx in blk.transactions() {
        for call in tx.calls.iter().filter(|call| !call.state_reverted && is_declared_dds_address(&call.address, call.begin_ordinal, dds_store)) {
            if abi::will_contract::functions::CancelWill::match_call(call) {
                if abi::will_contract::functions::CancelWill::decode(call).is_ok() {
                    calls.will_call_cancel_wills.push(contract::WillCancelWillCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        call_address: Hex(&call.address).to_string(),
                    });
                }
                continue;
            }
            if abi::will_contract::functions::CreateNewWill::match_call(call) {
                if let Ok(decoded_call) = abi::will_contract::functions::CreateNewWill::decode(call) {
                    calls.will_call_create_new_wills.push(contract::WillCreateNewWillCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        call_address: Hex(&call.address).to_string(),
                    });
                }
                continue;
            }
            if abi::will_contract::functions::DeclareDeath::match_call(call) {
                if abi::will_contract::functions::DeclareDeath::decode(call).is_ok() {
                    calls.will_call_declare_deaths.push(contract::WillDeclareDeathCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        call_address: Hex(&call.address).to_string(),
                    });
                }
                continue;
            }
            if abi::will_contract::functions::Deposit::match_call(call) {
                if abi::will_contract::functions::Deposit::decode(call).is_ok() {
                    calls.will_call_deposits.push(contract::WillDepositCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        call_address: Hex(&call.address).to_string(),
                    });
                }
                continue;
            }
            if abi::will_contract::functions::DesistSm::match_call(call) {
                if abi::will_contract::functions::DesistSm::decode(call).is_ok() {
                    calls.will_call_desist_sms.push(contract::WillDesistSmCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        call_address: Hex(&call.address).to_string(),
                    });
                }
                continue;
            }
            if abi::will_contract::functions::SwapAssets::match_call(call) {
                if abi::will_contract::functions::SwapAssets::decode(call).is_ok() {
                    calls.will_call_swap_assets.push(contract::WillSwapAssetsCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        call_address: Hex(&call.address).to_string(),
                    });
                }
                continue;
            }
            if abi::will_contract::functions::UpdateWill::match_call(call) {
                if let Ok(decoded_call) = abi::will_contract::functions::UpdateWill::decode(call) {
                    calls.will_call_update_wills.push(contract::WillUpdateWillCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        call_address: Hex(&call.address).to_string(),
                        deleted_sm_list: decoded_call.deleted_sm_list.into_iter().map(|x| x).collect::<Vec<_>>(),
                    });
                }
                continue;
            }
            if abi::will_contract::functions::ValidateSm::match_call(call) {
                if abi::will_contract::functions::ValidateSm::decode(call).is_ok() {
                    calls.will_call_validate_sms.push(contract::WillValidateSmCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        call_address: Hex(&call.address).to_string(),
                    });
                }
                continue;
            }
            if abi::will_contract::functions::VetoDeath::match_call(call) {
                if abi::will_contract::functions::VetoDeath::decode(call).is_ok() {
                    calls.will_call_veto_deaths.push(contract::WillVetoDeathCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        call_address: Hex(&call.address).to_string(),
                    });
                }
                continue;
            }
            if abi::will_contract::functions::Withdraw::match_call(call) {
                if let Ok(decoded_call) = abi::will_contract::functions::Withdraw::decode(call) {
                    calls.will_call_withdraws.push(contract::WillWithdrawCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        call_address: Hex(&call.address).to_string(),
                        amount: decoded_call.amount.to_string(),
                    });
                }
                continue;
            }
        }
    }
}


#[substreams::handlers::store]
fn store_will_created(blk: eth::Block, store: StoreSetInt64) {
    for rcpt in blk.receipts() {
        for log in rcpt
            .receipt
            .logs
            .iter()
            .filter(|log| log.address == WILLFACTORY_TRACKED_CONTRACT)
        {
            if let Some(event) = abi::willfactory_contract::events::EvtWillChainWillCreated::match_and_decode(log) {
                store.set(log.ordinal, Hex(event.will_address).to_string(), &1);
            }
        }
    }
}
#[substreams::handlers::map]
fn map_events(
    blk: eth::Block,
    store_will: StoreGetInt64,
) -> Result<contract::Events, substreams::errors::Error> {
    let mut events = contract::Events::default();
    map_willfactory_events(&blk, &mut events);
    map_will_events(&blk, &store_will, &mut events);
    Ok(events)
}
#[substreams::handlers::map]
fn map_calls(
    blk: eth::Block,
    store_will: StoreGetInt64,
    
) -> Result<contract::Calls, substreams::errors::Error> {
let mut calls = contract::Calls::default();
    map_willfactory_calls(&blk, &mut calls);
    map_will_calls(&blk, &store_will, &mut calls);
    Ok(calls)
}

