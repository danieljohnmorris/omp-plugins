// omp extension: show the thinking effort (reasoning level) in the status line.
//
// omp has a built-in level readout on the model segment, and for local TensorFold
// and SGLang endpoints it stays blank: checked in the TUI, the row reads
// `π > ◕ Qwen3.8-Flash-Next (Sparks, 1 node — spark3)` with no level, and declaring
// a `thinking` block for such a model in models.yml changes nothing either — the
// level is still absent, though `omp models --json` shows the block parsed. So the
// number has to come from an extension.
//
// `pi.getThinkingLevel()` is the live session level after omp's clamp to the
// model's catalog ceiling: asking Qwen3.8 Flash Next for `xhigh` yields `high`,
// because the bundled catalog caps that family there. Shift+Tab cycles the level
// and `--thinking <level>` sets it at launch; there is no `/thinking` command. Call
// the getter only from a handler or timer — it needs a live session.
//
// Read the number as the setting you chose, not as what the engine did. Some
// OpenAI-compatible engines ignore the effort flags omp sends: on the single-Spark
// Qwen, a request with `enable_thinking: false` still spent 304 of 400 output
// tokens reasoning, and a `thinking_budget` in the body hung the request past two
// minutes. omp sends `enable_thinking`/`preserve_thinking` for a `reasoning: true`
// model and no `reasoning_effort`, so this footer reports intent, not decode.
//
// It renders on the hook-status line (the same line sparks-status puts `ttft …`
// on; entries sort by key), so the line under the status bar reads:
//
//   effort high · ttft 0.63s · prompt 20.9k (97% cached) · decode 23 tok/s
//
// Extension status text cannot join the segment row above it: that row is built
// from the compiled-in segment list, and the extension API offers no way to
// register a segment.
import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";

/** How often to re-read the level, in ms. The getter is a field read. */
const POLL_MS = 1000;

/** Exported for tests: the whole display decision in one pure function. */
export function statusText(level: unknown, reasoning = true): string | undefined {
  if (typeof level !== "string") return undefined;
  const value = level.trim().toLowerCase();
  // Empty, or `inherit` — "whatever the role or config says", which is not a
  // level the reader can act on, and printing it would read like one.
  if (!value || value === "inherit") return undefined;
  // A level means nothing for a model that cannot reason; printing one would
  // imply a control that does not exist.
  if (!reasoning) return undefined;
  return `effort ${value}`;
}

export default function (pi: ExtensionAPI) {
  let shown: string | undefined;
  let timer: NodeJS.Timeout | undefined;

  const draw = (ctx: ExtensionContext): void => {
    const text = statusText(pi.getThinkingLevel(), ctx.model?.reasoning ?? true);
    if (text === shown) return;
    shown = text;
    ctx.ui.setStatus("effort", text);
  };

  // Events cover load, a model switch and each turn. They are not enough on their
  // own: `thinking_level_select` does not fire when the level changes (not on
  // `pi.setThinkingLevel`, not on Shift+Tab), so without the timer the footer keeps
  // the level the session started at no matter what you cycle to.
  const start = (ctx: ExtensionContext): void => {
    draw(ctx);
    if (timer !== undefined) return;
    timer = setInterval(() => {
      if (ctx.hasUI) draw(ctx);
    }, POLL_MS);
    // Never keep a finished `--print` run alive for the sake of a footer.
    timer.unref?.();
  };

  pi.on("session_start", (_event, ctx) => start(ctx));
  pi.on("model_select", (_event, ctx) => start(ctx));
  pi.on("turn_end", (_event, ctx) => draw(ctx));
  pi.on("session_shutdown", () => {
    clearInterval(timer);
    timer = undefined;
  });
}
