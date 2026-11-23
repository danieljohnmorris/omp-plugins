# omp-plugins

Plugins for [omp](https://github.com/can1357/oh-my-pi), in one marketplace repo.

```sh
omp plugin marketplace add danieljohnmorris/omp-plugins
omp plugin install <plugin>@omp-plugins
```

Restart omp after installing: extension modules load at startup.

| Plugin | What it does |
| --- | --- |
| [`effort`](plugins/effort) | Shows the thinking effort (reasoning level) in the status area, including for local engines whose built-in readout stays blank. |
| [`omarchy-theme`](plugins/omarchy-theme) | Themes omp's TUI from the current Omarchy theme and follows theme changes live. |
| [`thermal-gate`](plugins/thermal-gate) | Holds requests to a hot DGX Spark cluster until it cools, and refuses new Sparks subagents while Machinist is busy. |
| [`jev-router`](plugins/jev-router) | Routes each turn to a model, and each delegated task to an agent, from a Jev classification plus live provider quota. |
| [`roles`](plugins/roles) | `pr-reviewer` and `unblocker` subagents on the `review` and `unblock` model roles. |

These plugins were previously separate repositories (`omp-effort`, `omp-omarchy-theme`, `omp-thermal-gate`, `omp-jev-router`). Their history is preserved here under `plugins/<name>`.

## Develop

Each plugin is self-contained. Run its tests from its directory:

```sh
cd plugins/effort && bun test
```

MIT licensed.
