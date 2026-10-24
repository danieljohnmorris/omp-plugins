# omp-effort

An [omp](https://github.com/can1357/oh-my-pi) extension that shows the thinking
effort (reasoning level) in the status area.

![omp's status line reading `effort high` beneath a session on Qwen3.8 Flash Next](assets/example.png)

*The real omp TUI with only this extension installed: the level sits on the
hook-status line under the status bar.*

## Why an extension

omp's built-in readout on the model segment stays blank for local
OpenAI-compatible engines. Measured in the TUI, a session on a TensorFold endpoint
renders as `π > ◕ Qwen3.8-Flash-Next (Sparks, 1 node — spark3)` with no level, and
declaring a `thinking` block for that model in `models.yml` changes nothing — the
level is still absent even though `omp models --json` shows the block parsed.

The extension reads `pi.getThinkingLevel()`, the session's live level after omp
clamps it to the model's catalog ceiling. Ask Qwen3.8 Flash Next for `xhigh` and it
reads `effort high`, because the bundled catalog caps that family there. Shift+Tab
cycles the level; `--thinking <level>` sets it at launch. There is no `/thinking`
command.

`thinking_level_select` never fires when the level changes — not on
`pi.setThinkingLevel`, not on Shift+Tab — so the extension polls the getter once a
second (skipping redraws when nothing moved) and stops on session shutdown. Print
mode is unaffected: the timer is unref'd and never keeps a run alive.

## Where it appears

Extension status text renders on the hook-status line under the status bar, one
entry per key, sorted — the same place other status extensions write. It cannot
join the row above: that row is built from omp's compiled-in segment list, and the
extension API has no way to register a segment.

Read the number as the setting you chose, not as what the engine did. Some
OpenAI-compatible engines ignore the effort flags omp sends: on a single-Spark
TensorFold Qwen, a request with `enable_thinking: false` still spent 304 of 400
output tokens reasoning, and a `thinking_budget` in the body hung the request past
two minutes. omp sends `enable_thinking`/`preserve_thinking` for a `reasoning: true`
model and no `reasoning_effort`, so the footer reports intent, not decode.

## Install

```sh
git clone https://github.com/danieljohnmorris/omp-effort
cd omp-effort
./install.sh        # copies index.ts to ~/.omp/agent/extensions/omp-effort/
```

omp auto-discovers extensions in `~/.omp/agent/extensions/`. Restart omp after
installing. `OMP_EXTENSIONS_DIR` overrides the target directory.

## Tests

```sh
bun test
```

The suite pins the display decision (normalising, hiding `inherit`, hiding a level
on a model that cannot reason), that a mid-session level change reaches the footer
through the timer, and that an unchanged level does not redraw.
