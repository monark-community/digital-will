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

const WILLFACTORY_TRACKED_CONTRACT: [u8; 20] = hex!("05a61f96958b8c2b8decbc33b5676b6b780dcc28");

fn map_willfactory_calls(blk: &eth::Block, calls: &mut contract::Calls) {
    for tx in blk.transactions() {
        for call in tx.calls.iter().filter(|call| !call.state_reverted && call.address == WILLFACTORY_TRACKED_CONTRACT) {
            if abi::willfactory_contract::functions::CreateWill::match_call(call) {
                if let Ok(decoded_call) = abi::willfactory_contract::functions::CreateWill::decode(call) {
                    let output_param0 = match abi::willfactory_contract::functions::CreateWill::output(&call.return_data) {
                        Ok(output_param0) => {output_param0}
                        Err(_) => Default::default(),
                    };
                    
                    let new_sm_list: Vec<contract::SmPartialInfo> = decoded_call.new_sm_list
                        .iter()
                        .map(|(sm_address, vote_power)| contract::SmPartialInfo {
                            sm_address: sm_address.clone(),
                            vote_power: vote_power.to_i32() as u32,
                        })
                        .collect();
                    let security_period_config = Some(contract::SecurityPeriodConfig {
                        min_security_period: decoded_call.security_period_config.0.to_string(),
                        max_security_period: decoded_call.security_period_config.1.to_string(),
                    });
                    let call_value = call.value.as_ref()
                        .map(|v| substreams::scalar::BigInt::from_unsigned_bytes_be(&v.bytes).to_string())
                        .unwrap_or_else(|| "0".to_string());
                    calls.willfactory_call_create_wills.push(contract::WillfactoryCreateWillCall {
                        call_tx_hash: Hex(&tx.hash).to_string(),
                        call_block_time: Some(blk.timestamp().to_owned()),
                        call_block_number: blk.number,
                        call_ordinal: call.begin_ordinal,
                        call_success: !call.state_reverted,
                        output_param0: output_param0,
                        owner: tx.from.clone(),
                        new_sm_list,
                        security_period_config,
                        call_value,
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
            if let Some(event) = abi::will_contract::events::EvtWillChainAssetsSwapped::match_and_decode(log) {
                events.will_evt_will_chain_assets_swappeds.push(contract::WillEvtWillChainAssetsSwapped {
                    evt_tx_hash: Hex(&rcpt.transaction.hash).to_string(),
                    evt_index: log.block_index,
                    evt_block_time: Some(blk.timestamp().to_owned()),
                    evt_block_number: blk.number,
                    evt_address: Hex(&log.address).to_string(),
                    sm_address: event.sm_address,
                    usdc_amount: event.usdc_amount.to_string(),
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
                    assets: event.assets.to_string(),
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
                    validated_pre_desist: event.validated_pre_desist.to_string(),
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
    map_will_events(&blk, &store_will, &mut events);
    Ok(events)
}
#[substreams::handlers::map]
fn map_calls(
    blk: eth::Block,
    
) -> Result<contract::Calls, substreams::errors::Error> {
let mut calls = contract::Calls::default();
    map_willfactory_calls(&blk, &mut calls);
    Ok(calls)
}

