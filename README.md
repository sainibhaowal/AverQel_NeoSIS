# AverQel NeoSIS

<p align="center"><img src="apps/web/public/averqel-neosis-logo.svg" alt="AverQel NeoSIS logo" width="260"></p>

AverQel NeoSIS (`neosis`) is an open-source agent harness developed by Ravinder Singh.

It is built on an **everything-is-a-plugin** architecture and powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512).

Documentation lives in [`docs/`](docs/) in this repository; the VitePress site source is under [`website/`](website/) and is not currently published anywhere.

## Developer preview

AverQel NeoSIS is in _developer preview_ and iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

Review the [safety notice](SAFETY.md) before running the project.

## Run

### Run from source

Run from a repository checkout (no published npm package exists yet):

```sh
git clone https://github.com/sainibhaowal/AverQel_Neosis.git
cd AverQel_Neosis
pnpm install
pnpm run build
pnpm neosis web
```

`pnpm run build` prepares the repository artifacts. `pnpm neosis web` uses those built artifacts without rebuilding.

The command starts the Web UI at `http://127.0.0.1:3080` by default and opens it in the default browser for a local launch. An SSH launch only prints the host URL because the SSH client or editor owns the local forwarded address. Pass `--no-open` to run the server without opening a browser. See [Web UI guide](docs/user/guide/index.md).

## Community and support

- Submit feedback or bug reports through [GitHub Issues](https://github.com/sainibhaowal/AverQel_Neosis/issues).
- Add the [`neosis-plugin`](https://github.com/topics/neosis-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/Ycq5dCaS4">AverQel NeoSIS Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

`pnpm run dev:web` builds, serves, and rebuilds client bundles on source edits in one terminal, and `make help` lists the matching Make targets for Web and Desktop; the guide's application commands section owns the full table.

For agents, follow [AGENTS.md](AGENTS.md).

## Citation

```bibtex
@misc{averqel-neosis2026,
  title={AverQel NeoSIS: Everything is a Plugin},
  author={Ravinder Singh},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/sainibhaowal/AverQel_Neosis}},
}
```

## License

[Apache-2.0](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
