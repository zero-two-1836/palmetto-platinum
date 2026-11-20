// Palmetto Platinum — progress tracker.
//
// Earned trophies and per-trophy counters live in one localStorage record on
// the reader's machine; nothing leaves the browser. The record exports to a
// JSON file and imports back. In demo mode (used for the guide's own
// screenshots) a fixed mid-run state is shown and nothing is stored.

const STORAGE_KEY = "palmetto-platinum-progress-v1";

const DEMO_STATE = {
  earned: [2, 3, 4, 8, 9, 10, 16, 21, 22, 23, 44, 46],
  counters: {
    15: 132, 17: 31, 18: 5, 19: 6, 25: 3, 28: 11,
    31: 47, 32: 23, 35: 63, 42: 39, 48: 210,
  },
};

function emptyState() {
  return { earned: [], counters: {} };
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter(Number.isInteger) : [],
      counters: parsed.counters && typeof parsed.counters === "object" ? parsed.counters : {},
    };
  } catch {
    return emptyState();
  }
}

// Counter step for the +/- buttons: money totals move in thousands, the
// choice count in tens, everything else one at a time.
export function counterStep(trophy) {
  if (!trophy.count) return 1;
  if (trophy.count >= 10000) return 1000;
  if (trophy.count >= 500) return 10;
  return 1;
}

export function createTracker(demo) {
  let state = demo
    ? { earned: [...DEMO_STATE.earned], counters: { ...DEMO_STATE.counters } }
    : readStored();
  const listeners = [];

  function persist() {
    if (!demo) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Private mode and friends: progress lasts for the session only.
      }
    }
    for (const fn of listeners) fn(state);
  }

  return {
    onChange(fn) {
      listeners.push(fn);
    },
    isEarned(id) {
      return state.earned.includes(id);
    },
    earnedIds() {
      return [...state.earned];
    },
    counterOf(id) {
      return state.counters[id] ?? 0;
    },
    setEarned(id, earned, trophy) {
      const has = state.earned.includes(id);
      if (earned && !has) state.earned.push(id);
      if (!earned && has) {
        state.earned = state.earned.filter((x) => x !== id);
        // Pull a completed counter back under its target so the two agree.
        if (trophy && trophy.count && (state.counters[id] ?? 0) >= trophy.count) {
          state.counters[id] = trophy.count - 1;
        }
      }
      persist();
    },
    bumpCounter(id, delta, trophy) {
      if (!trophy || !trophy.count) return;
      const next = Math.min(trophy.count, Math.max(0, (state.counters[id] ?? 0) + delta));
      state.counters[id] = next;
      const has = state.earned.includes(id);
      if (next >= trophy.count && !has) state.earned.push(id);
      if (next < trophy.count && has) state.earned = state.earned.filter((x) => x !== id);
      persist();
    },
    exportJson() {
      return JSON.stringify(
        { app: "palmetto-platinum", version: 1, earned: state.earned, counters: state.counters },
        null,
        2,
      );
    },
    importJson(text) {
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.earned)) throw new Error("not a Palmetto Platinum export");
      state = {
        earned: parsed.earned.filter(Number.isInteger),
        counters: parsed.counters && typeof parsed.counters === "object" ? parsed.counters : {},
      };
      persist();
    },
    reset() {
      state = emptyState();
      persist();
    },
  };
}
