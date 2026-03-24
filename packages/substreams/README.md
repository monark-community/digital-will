<a href="https://www.streamingfast.io/">
	<img width="100%" src="https://github.com/streamingfast/substreams/blob/develop/docs/assets/substreams-banner.png" alt="StreamingFast Substreams Banner" />
</a>

# Substreams

Substreams is a powerful blockchain indexing technology, developed for The Graph Network.

Substreams enables developers to write Rust modules, composing data streams alongside the community, and provides extremely high performance indexing by virtue of parallelization, in a streaming-first fashion.

Substreams has all the benefits of StreamingFast Firehose, like low-cost caching and archiving of blockchain data, high throughput processing, and cursor-based reorgs handling.

## Documentation

Full documentation for installing, running and working with Substreams is available at: https://docs.substreams.dev.

## How to repackage for a new factory address
1. Update WILLFACTORY_TRACKED_CONTRACT in lib.rs:16
2. Update the blockFilter address + initialBlock in substreams.yaml:34
3. Run Substreams build to generate new spkg

## Contributing

**Please first refer to the general
[StreamingFast contribution guide](https://github.com/streamingfast/streamingfast/blob/master/CONTRIBUTING.md)**,
if you wish to contribute to this code base.

## License

[Apache 2.0](LICENSE)
