import { afterEach, expect, test } from "bun:test";
import ext, { statusText } from "../index.ts";

// The getter needs a live session, so what these tests pin is what the handlers
// feed ctx.ui.setStatus("effort", …) as the session's level moves.

type Handler = (event: unknown, ctx: Harness["ctx"]) => void | Promise<void>;

interface Harness {
  ctx: {
    hasUI: boolean;
    model: { reasoning: boolean };
    ui: { setStatus: (key: string, text: string | undefined) => void };
  };
  start: () => void;
  tick: () => void;
  turnEnd: () => void;
  setStates: Array<string | undefined>;
  restore: () => void;
}

function harness(getLevel: () => unknown, reasoning = true): Harness {
  const handlers = new Map<string, Handler[]>();
  const setStates: Array<string | undefined> = [];
  const ticks: Array<() => void> = [];
  const realSet = globalThis.setInterval;
  const realClear = globalThis.clearInterval;
  globalThis.setInterval = ((fn: () => void) => {
    ticks.push(fn);
    return ticks.length as unknown as NodeJS.Timeout;
  }) as typeof setInterval;
  globalThis.clearInterval = (() => undefined) as typeof clearInterval;

  const pi = {
    on: (event: string, handler: Handler) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    },
    getThinkingLevel: getLevel,
  };
  ext(pi as unknown as Parameters<typeof ext>[0]);

  const ctx = {
    hasUI: true,
    model: { reasoning },
    ui: { setStatus: (_key: string, text: string | undefined) => setStates.push(text) },
  };

  const fire = (event: string) => handlers.get(event)?.forEach((h) => void h({}, ctx));
  return {
    ctx,
    start: () => fire("session_start"),
    tick: () => ticks.forEach((tick) => tick()),
    turnEnd: () => fire("turn_end"),
    setStates,
    restore: () => {
      globalThis.setInterval = realSet;
      globalThis.clearInterval = realClear;
    },
  };
}

let active: Harness | undefined;
afterEach(() => active?.restore());

test("a level change mid-session reaches the footer", () => {
  let level: unknown = "low";
  active = harness(() => level);
  active.start();
  expect(active.setStates.at(-1)).toBe("effort low");

  // Shift+Tab / pi.setThinkingLevel fire no event; only the timer can notice.
  level = "high";
  active.tick();
  expect(active.setStates.at(-1)).toBe("effort high");
});

test("an unchanged level does not redraw the status", () => {
  let level: unknown = "medium";
  active = harness(() => level);
  active.start();
  const before = active.setStates.length;
  active.tick();
  active.turnEnd();
  expect(active.setStates.length).toBe(before);
});

test("a model that cannot reason shows no level, even when one is set", () => {
  active = harness(() => "high", false);
  active.start();
  expect(active.setStates.at(-1)).toBeUndefined();
  expect(statusText("high", false)).toBeUndefined();
});

test("inherit and blank levels are hidden; casing and spacing normalise", () => {
  expect(statusText("inherit")).toBeUndefined();
  expect(statusText("")).toBeUndefined();
  expect(statusText("  HIGH ")).toBe("effort high");
  expect(statusText(undefined)).toBeUndefined();
});
