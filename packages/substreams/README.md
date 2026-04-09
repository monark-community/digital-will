# Substreams

Substreams is a powerful blockchain indexing technology, developed for The Graph Network.

Substreams enables developers to write Rust modules, composing data streams alongside the community, and provides extremely high performance indexing by virtue of parallelization, in a streaming-first fashion.

Substreams has all the benefits of StreamingFast Firehose, like low-cost caching and archiving of blockchain data, high throughput processing, and cursor-based reorgs handling.

## Documentation

Full documentation for installing, running and working with Substreams is available at: https://docs.substreams.dev.

## How this spkg was created
1. This package was initialized via `substreams init`, using the `evm-events-calls` template. You need the Substreams CLI to run
this command.
2. If you wish to recreate the spkg yourself, make sure the smart contract WillFactory is already deployed in your chosen network.
3. During the process, we chose to track both events and calls for the WillFactory contract, allowing the system to recognize it as a factory and automatically monitor each contract creation.

## How to repackage for a new factory address 
1. Make sure the address is in lowercase
2. Update WILLFACTORY_TRACKED_CONTRACT in lib.rs:16 (remove the 0x in the beginning)
3. Update the blockFilter address + initialBlock in substreams.yaml:34
4. Run Substreams build in packages/substreams/willchain_events directory to generate new spkg. If you are on Windows, you may need WSL to run this command since the Substreams CLI is only available on Linux or MacOS.

## How to update spkg if change is made in WillFactory.sol or will.sol
1. Recompile the Solidity contracts with forge build or similar
2. Extract the new ABIs from the compiled artifacts
3. Update both willfactory_contract.abi.json AND will_contract.abi.json in substreams directory
4. Update the lib.rs accordingly (the command cargo build can be handy because it will throw errors if necessary code is missing in lib.rs)
5. You will need to follow the steps described above in `How to repackage for a new factory address`
6. Run Substreams build in packages/substreams/willchain_events directory to generate new spkg.

## How the spkg is picked up by the code
1. The willchain-events-v0.1.0.spkg located in packages/substreams/willchain_events is
mounted in the docker-compose.local.yml located at project root.
2. The .env located in services/api/src/substreams/.env refers to it like so : 
`MANIFEST=/app/spkg/willchain-events-v0.1.0.spkg`
3. The code picks it up like so: 
`process.env.MANIFEST`

## Multi network support
1. Each sink is network specific. That is, the generic function `await stream` located in substreams_utils.ts in 
the directory services/api/src/substreams must be called once for each network. 
2. The current .spkg setup requires building a separate spkg for each network, following the steps outlined 
in `How this spkg was created`
3. It should be possible to create a network-agnostic .spkg; however, this requires manual configuration since 
the Substreams CLI does not currently support it. Note that doing so may sacrifice contract-specific filtering.
		
## License

[Apache 2.0](LICENSE)
