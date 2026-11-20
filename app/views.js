// Palmetto Platinum — rendering. Every view is built from the trophy data and
// the tracker state; this module owns the roadmap order, the phase texts and
// the spoiler-shield masking rule.

import { counterStep } from "./tracker.js";

// The order a platinum run should earn the trophies in: story order inside
// Phase 1 (the missable sits in its Chapter 1 window), then strands,
// collectibles, activities and the closing grind.
export const ORDER = [
  2, 44, 3, 8, 9, 4, 10, 11, 5, 12, 13, 6, 47, 7,
  22, 23, 24, 26, 27, 25, 29,
  42, 28, 30, 31, 35,
  16, 21, 46, 15, 17, 18, 19, 20, 32, 33, 34, 36, 37, 38, 39, 40, 41, 43, 45, 49, 50, 51,
  48, 52, 53, 54, 55, 14, 1,
];

export const PHASES = [
  {
    n: 1, name: "Story — and the one missable", hours: "≈ 28 h",
    blurb: "Play the story start to finish. One stop matters above all others: the Ocean Beach balcony cocktail (In The Beginning…) inside Chapter 1, the game's only missable. Everything else in this phase is earned simply by finishing the chapters and their missions.",
  },
  {
    n: 2, name: "Strangers & strands", hours: "≈ 14 h",
    blurb: "Clear every stranger strand, finals included. Andy, Kenton, Billy, Randy and Tyrone carry trophies of their own, and any eight finished strands close the silver Strangers & Freaks. Strands never expire, so this phase is pure mop-up.",
  },
  {
    n: 3, name: "Collectibles & the map", hours: "≈ 34 h",
    blurb: "Sweep the sets that hide in the world: meditation spots, card sets, WAiNK photo points, vehicle discoveries and the 52 areas of Leonida. Route them together — the three sweeps share most of the same roads.",
  },
  {
    n: 4, name: "Activities, feats & clean crime", hours: "≈ 64 h",
    blurb: "The skill and sandbox phase: gold medals on the range, races and drone wins, challenges, then the crime feats — vaults, trucks, gang operations and the wanted-level set-pieces. Nothing here is missable; everything is repeatable.",
  },
  {
    n: 5, name: "The long grind to 100%", hours: "≈ 60 h",
    blurb: "Close the counters that only fill with time: 500 choices, the laundering and spending totals, the eight garages and the vehicle registrations. When the 100% screen agrees, A Long Road and the platinum land together.",
  },
];

export const KIND_LABELS = {
  story: "Story",
  activities: "Activities",
  collectibles: "Collectibles",
  crime: "Crime & feats",
  grind: "Grind",
  missable: "Missable",
  completion: "Completion",
  platinum: "Platinum",
};

export function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function fmt(n) {
  return n.toLocaleString("en-US");
}

export function byOrder(trophies) {
  const rank = new Map(ORDER.map((id, i) => [id, i]));
  return [...trophies].sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
}

export function isMasked(trophy, ui, tracker) {
  return ui.shield && trophy.hidden && trophy.kind === "story" && !tracker.isEarned(trophy.id);
}

function gradeBadge(grade) {
  return `<span class="grade-badge grade-${grade}">${grade}</span>`;
}

function tagsFor(trophy, tracker) {
  const tags = [`<span class="tag tag-kind">${esc(KIND_LABELS[trophy.kind] ?? trophy.kind)}</span>`];
  tags.push(`<span class="tag">Phase ${trophy.phase}</span>`);
  tags.push(`<span class="tag">${esc(trophy.time)}</span>`);
  if (trophy.hidden) tags.push(`<span class="tag tag-hidden">Hidden</span>`);
  if (trophy.count) {
    tags.push(`<span class="tag tag-count">${fmt(tracker.counterOf(trophy.id))} / ${fmt(trophy.count)} ${esc(trophy.countUnit)}</span>`);
  }
  return tags.join("");
}

function counterHtml(trophy, tracker) {
  if (!trophy.count) return "<span></span>";
  const step = counterStep(trophy);
  return `<span class="counter">
    <button type="button" data-action="minus" data-id="${trophy.id}" aria-label="Decrease counter">−</button>
    <b>${fmt(tracker.counterOf(trophy.id))} / ${fmt(trophy.count)}</b>
    <button type="button" data-action="plus" data-id="${trophy.id}" aria-label="Increase counter">+</button>
  </span>`;
}

export function renderHeader(data, tracker) {
  const total = data.trophies.length;
  const earned = data.trophies.filter((t) => tracker.isEarned(t.id)).length;
  const pct = Math.round((earned / total) * 100);
  document.getElementById("overallPct").textContent = `${pct}%`;
  document.getElementById("overallCount").textContent = `${earned} / ${total} earned`;
  document.getElementById("overallBar").style.width = `${pct}%`;
  const grades = ["platinum", "gold", "silver", "bronze"];
  document.getElementById("gradeTallies").innerHTML = grades
    .map((g) => {
      const all = data.trophies.filter((t) => t.grade === g);
      const got = all.filter((t) => tracker.isEarned(t.id)).length;
      return `<span class="tally"><b>${got}/${all.length}</b> ${g}</span>`;
    })
    .join("");
}

export function renderPhaseSummary(data, tracker) {
  document.getElementById("phaseSummary").innerHTML = PHASES.map((p) => {
    const inPhase = data.trophies.filter((t) => t.phase === p.n);
    const got = inPhase.filter((t) => tracker.isEarned(t.id)).length;
    const pct = inPhase.length ? Math.round((got / inPhase.length) * 100) : 0;
    return `<div class="phase-mini">
      <div class="phase-mini-head"><span>Phase ${p.n}</span><span>${got}/${inPhase.length}</span></div>
      <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join("");
}

export function nextUp(data, tracker) {
  const ordered = byOrder(data.trophies);
  return ordered.find((t) => t.grade !== "platinum" && !tracker.isEarned(t.id))
    ?? ordered.find((t) => !tracker.isEarned(t.id))
    ?? null;
}

export function renderNextUp(data, tracker) {
  const el = document.getElementById("nextUpText");
  const next = nextUp(data, tracker);
  if (!next) {
    el.textContent = "Everything is earned — the platinum is yours. Congratulations, Legend.";
    return;
  }
  el.innerHTML = `<strong>${esc(next.name)}</strong> (${esc(next.grade)}, Phase ${next.phase}) — ${esc(next.guide.split(". ")[0])}.`;
}

function rowHtml(trophy, ui, tracker) {
  const earned = tracker.isEarned(trophy.id);
  const masked = isMasked(trophy, ui, tracker);
  const name = masked ? "Hidden trophy" : esc(trophy.name);
  const desc = masked
    ? "A story trophy, covered by the spoiler shield until you earn it."
    : esc(trophy.description);
  return `<div class="row${earned ? " is-earned" : ""}${ui.selectedId === trophy.id ? " is-selected" : ""}"
      data-action="select" data-id="${trophy.id}" role="button" tabindex="0">
    ${gradeBadge(trophy.grade)}
    <span class="row-main">
      <span class="row-name">${name}${trophy.missable ? '<span class="tag tag-missable">Missable</span>' : ""}</span>
      <span class="row-desc">${desc}</span>
      <span class="row-meta">${tagsFor(trophy, tracker)}</span>
    </span>
    ${counterHtml(trophy, tracker)}
    <button type="button" class="earn-toggle" data-action="earn" data-id="${trophy.id}"
      aria-pressed="${earned}" aria-label="Toggle earned">${earned ? "✓" : ""}</button>
  </div>`;
}

export function matchesFilters(trophy, ui, tracker) {
  if (ui.kind === "missable") {
    if (!trophy.missable) return false;
  } else if (ui.kind !== "all" && trophy.kind !== ui.kind) {
    return false;
  }
  if (ui.grade !== "all" && trophy.grade !== ui.grade) return false;
  if (ui.hideEarned && tracker.isEarned(trophy.id)) return false;
  if (ui.query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
    if (!hay.includes(ui.query.toLowerCase())) return false;
  }
  return true;
}

export function renderList(data, tracker, ui) {
  const root = document.getElementById("trophyList");
  const ordered = byOrder(data.trophies).filter((t) => matchesFilters(t, ui, tracker));
  let html = "";
  for (const p of PHASES) {
    const inPhase = ordered.filter((t) => t.phase === p.n);
    if (!inPhase.length) continue;
    const got = data.trophies.filter((t) => t.phase === p.n && tracker.isEarned(t.id)).length;
    const all = data.trophies.filter((t) => t.phase === p.n).length;
    html += `<div class="phase-head"><h3>Phase ${p.n} — ${esc(p.name)}</h3><span>${got}/${all} earned · ${esc(p.hours)}</span></div>`;
    html += inPhase.map((t) => rowHtml(t, ui, tracker)).join("");
  }
  root.innerHTML = html;
  document.getElementById("emptyState").hidden = ordered.length > 0;
}

export function renderDetail(data, tracker, ui) {
  const panel = document.getElementById("detailPanel");
  const trophy = data.trophies.find((t) => t.id === ui.selectedId) ?? nextUp(data, tracker);
  if (!trophy) {
    panel.innerHTML = `<p class="detail-empty">Select a trophy to read its guide.</p>`;
    return;
  }
  const earned = tracker.isEarned(trophy.id);
  if (isMasked(trophy, ui, tracker)) {
    panel.innerHTML = `${gradeBadge(trophy.grade)}
      <h2 class="masked">Hidden trophy</h2>
      <p class="official">Covered by the spoiler shield.</p>
      <p>This is one of the 28 hidden trophies, and it belongs to the story. The shield keeps its name and description covered until you earn it — turn the shield off in the toolbar if you would rather see everything now.</p>
      <div class="detail-meta"><span>Grade <b>${esc(trophy.grade)}</b></span><span>Phase <b>${trophy.phase}</b></span></div>`;
    return;
  }
  const sources = trophy.sources
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`)
    .join("");
  const steps = trophy.steps.map((s) => `<li>${esc(s)}</li>`).join("");
  panel.innerHTML = `
    <div class="detail-badges">${gradeBadge(trophy.grade)}
      <span class="tag tag-kind">${esc(KIND_LABELS[trophy.kind] ?? trophy.kind)}</span>
      <span class="tag">Phase ${trophy.phase}</span>
      ${trophy.hidden ? '<span class="tag tag-hidden">Hidden</span>' : ""}
    </div>
    <h2>${esc(trophy.name)}</h2>
    <p class="official">“${esc(trophy.description)}” — official description, PlayStation</p>
    ${trophy.missable ? `<div class="missable-banner"><strong>MISSABLE — the only one in the game.</strong> This can only be earned inside Chapter 1. See the Missables tab for the protection plan.</div>` : ""}
    <h3>Guide</h3>
    <p>${esc(trophy.guide)}</p>
    <h3>Step by step</h3>
    <ol>${steps}</ol>
    <div class="tip-box"><strong>Watch out:</strong> ${esc(trophy.tip)}</div>
    <div class="detail-meta">
      <span>Time <b>${esc(trophy.time)}</b></span>
      ${trophy.count ? `<span>Progress <b>${fmt(tracker.counterOf(trophy.id))} / ${fmt(trophy.count)} ${esc(trophy.countUnit)}</b></span>` : ""}
    </div>
    ${counterHtml(trophy, tracker)}
    <h3>Sources</h3>
    <ul class="sources">${sources}</ul>
    <div class="detail-actions">
      <button type="button" class="btn btn-earn" data-action="earn" data-id="${trophy.id}" aria-pressed="${earned}">${earned ? "Earned ✓ — tap to undo" : "Mark as earned"}</button>
    </div>`;
}

export function renderRoadmap(data, tracker) {
  const root = document.getElementById("roadmapRoot");
  const stats = [
    ["55", "trophies: 1 platinum, 2 gold, 6 silver, 46 bronze"],
    ["4 / 10", "difficulty — no trophy is difficulty-gated"],
    ["≈ 200 h", "for the platinum, all in one playthrough"],
    ["1", "playthrough needed — nothing requires a replay"],
    ["0", "online trophies on the list"],
    ["1", "missable trophy, inside Chapter 1"],
    ["28", "hidden trophies, most of them story"],
  ];
  let html = `<div class="rm-stats">${stats.map(([b, s]) => `<div class="rm-stat"><b>${b}</b><span>${s}</span></div>`).join("")}</div>`;
  html += `<div class="rm-alert"><strong>Do not sleep on Chapter 1.</strong> The game's only missable, <strong>In The Beginning…</strong>, lives on the Ocean Beach balcony during Chapter 1 and is gone when the chapter ends. The protection plan is on the Missables tab.</div>`;
  for (const p of PHASES) {
    const inPhase = byOrder(data.trophies).filter((t) => t.phase === p.n);
    const got = inPhase.filter((t) => tracker.isEarned(t.id)).length;
    const pct = inPhase.length ? Math.round((got / inPhase.length) * 100) : 0;
    const chips = inPhase
      .map((t) => `<button type="button" class="rm-chip${tracker.isEarned(t.id) ? " is-earned" : ""}${t.missable ? " is-missable" : ""}" data-action="open-guide" data-id="${t.id}">${esc(t.name)}</button>`)
      .join("");
    html += `<div class="rm-phase">
      <div class="rm-phase-head"><h3>Phase ${p.n} — ${esc(p.name)}</h3><span>${esc(p.hours)} · ${got}/${inPhase.length} earned</span></div>
      <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
      <p>${esc(p.blurb)}</p>
      <div class="rm-chips">${chips}</div>
    </div>`;
  }
  root.innerHTML = html;
}

const NOT_MISSABLE = [
  ["Catch Me If You Can", "It smells like a one-time story location, but VCIA's airfield stays open in free roam after the story — depart unscheduled whenever you like."],
  ["Bad Luck, I Guess", "Fail-then-succeed sounds like a trap, yet every challenge in the game is repeatable, so the pair can be arranged at any time."],
  ["Capital Offense", "Showrooms restock their floors. Smash out, come back next week, smash out again."],
  ["Personal Best", "The scene that grants it is a mandatory story beat — finishing the story guarantees it."],
  ["The stranger strand finals", "Andy's, Kenton's, Billy's, Randy's and Tyrone's strands never expire and stay on the map after the credits."],
  ["Every collectible set", "Meditation spots, cards, WAiNK points and areas stay exactly where they are for the whole playthrough."],
];

export function renderMissables(data, tracker) {
  const root = document.getElementById("missablesRoot");
  const m = data.trophies.find((t) => t.missable);
  const steps = m.steps.map((s) => `<li>${esc(s)}</li>`).join("");
  const sources = m.sources
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`)
    .join("");
  const notMissable = NOT_MISSABLE.map(([name, why]) => `<li><strong>${esc(name)}.</strong> ${esc(why)}</li>`).join("");
  root.innerHTML = `
    <div class="miss-hero">
      <div class="detail-badges">${gradeBadge(m.grade)}<span class="tag tag-missable">Missable</span><span class="tag tag-hidden">Hidden</span><span class="tag">Chapter 1 only</span></div>
      <h2>${esc(m.name)}</h2>
      <p class="official">“${esc(m.description)}” — official description, PlayStation</p>
      <p>${esc(m.guide)}</p>
      <h3>Step by step</h3>
      <ol>${steps}</ol>
      <div class="tip-box"><strong>Watch out:</strong> ${esc(m.tip)}</div>
      <h3>Sources</h3>
      <ul class="sources">${sources}</ul>
      <div class="detail-actions">
        <button type="button" class="btn" data-action="open-guide" data-id="${m.id}">Open its guide in the tracker</button>
        <button type="button" class="btn btn-earn" data-action="earn" data-id="${m.id}" aria-pressed="${tracker.isEarned(m.id)}">${tracker.isEarned(m.id) ? "Earned ✓ — tap to undo" : "Mark as earned"}</button>
      </div>
    </div>
    <div class="miss-grid">
      <div class="card">
        <h2>The protection plan</h2>
        <ol>
          <li><strong>Save at the chapter start.</strong> Keep one manual save from the beginning of Chapter 1 untouched until this trophy is earned — it is your way back.</li>
          <li><strong>Make it your first stop.</strong> As soon as Chapter 1 gives you free control after Gone Fishing, go straight to the Ocean Beach boardwalk bar.</li>
          <li><strong>Up the stairs, cocktail at the rail.</strong> Order at the balcony bar and let the whole scene play — skipping it is the one way to fumble this at the finish line.</li>
          <li><strong>Check the tracker.</strong> The trophy should pop as the scene ends. If it has not, reload the chapter-start save before touching the chapter finale.</li>
          <li><strong>Never start the finale first.</strong> The Chapter 1 finale closes the balcony permanently; there is no chapter select to return with.</li>
        </ol>
      </div>
      <div class="card">
        <h2>Looks missable — is not</h2>
        <ul>${notMissable}</ul>
      </div>
    </div>
    <p class="safe-note">Everything else on the list of 55 is earned in free roam or through repeatable content. Finish the story at your own pace, then work the phases — the platinum cannot be locked out by anything except the balcony.</p>`;
}
