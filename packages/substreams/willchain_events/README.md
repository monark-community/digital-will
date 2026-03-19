# willchain_events Substreams modules

This package was initialized via `substreams init`, using the `evm-events-calls` template.

## Usage

```bash
substreams build
substreams auth
substreams gui       			  # Get streaming!
```

Optionally, you can publish your Substreams to the [Substreams Registry](https://substreams.dev).

```bash
substreams registry login         # Login to substreams.dev
substreams registry publish       # Publish your Substreams to substreams.dev
```

## Modules

All of these modules produce data filtered by these contracts:
- _willfactory_ at **0x6cbd60e8222f5f07d32c773ef15fd01a43ec8328**
- will contracts created from _willfactory_
### `map_events_calls`

This module gets you events _and_ calls


### `map_events`

This module gets you only events that matched.



### `map_calls`

This module gets you only calls that matched.


