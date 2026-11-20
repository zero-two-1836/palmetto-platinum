// Palmetto Platinum — boot and wiring. Loads the trophy data, builds the
// tracker, renders every view and connects the controls. URL parameters
// (?demo=1&tab=roadmap&pick=17&kind=story&shield=1) preset the state, which is
// how the guide's own screenshots are framed; readers can ignore them.

import { createTracker, counterStep } from "./tracker.js";
import {
  KIND_LABELS,
  nextUp,
  renderDetail,
  renderHeader,
  renderList,
  renderMissables,
  renderNextUp,
  renderPhaseSummary,
  renderRoadmap,
} from "./views.js";

const params = new URLSearchParams(location.search);
const demo = params.get("demo") === "1";

const ui = {
  tab: params.get("tab") ?? "tracker",
  selectedId: Number(params.get("pick")) || null,
  kind: params.get("kind") ?? "all",
  grade: params.get("grade") ?? "all",
  query: params.get("q") ?? "",
  hideEarned: params.get("hide") === "1",
  shield: params.get("shield") === "1",
};

const CHIP_KINDS = ["all", "story", "activities", "collectibles", "crime", "grind", "missable"];

let data = null;
const tracker = createTracker(demo);

function trophyById(id) {
  return data.trophies.find((t) => t.id === id);
}

function render() {
  renderHeader(data, tracker);
  renderPhaseSummary(data, tracker);
  renderNextUp(data, tracker);
  renderList(data, tracker, ui);
  renderDetail(data, tracker, ui);
  renderRoadmap(data, tracker);
  renderMissables(data, tracker);
  for (const view of ["tracker", "roadmap", "missables"]) {
    document.getElementById(`view-${view}`).hidden = view !== ui.tab;
  }
  for (const tab of document.querySelectorAll(".tab")) {
    tab.classList.toggle("is-active", tab.dataset.tab === ui.tab);
  }
  document.getElementById("shieldNote").hidden = !ui.shield;
  document.getElementById("shieldToggle").checked = ui.shield;
  document.getElementById("hideEarned").checked = ui.hideEarned;
}

function buildChips() {
  const root = document.getElementById("kindChips");
  root.innerHTML = CHIP_KINDS.map((kind) => {
    const label = kind === "all" ? "All kinds" : (KIND_LABELS[kind] ?? kind);
    const cls = kind === "missable" ? "chip chip-missable" : "chip";
    return `<button type="button" class="${cls}${ui.kind === kind ? " is-on" : ""}" data-action="chip" data-kind="${kind}">${label}</button>`;
  }).join("");
}

function openGuide(id) {
  ui.tab = "tracker";
  ui.selectedId = id;
  render();
  document.getElementById("detailPanel").scrollIntoView({ block: "nearest" });
}

function wire() {
  for (const tab of document.querySelectorAll(".tab")) {
    tab.addEventListener("click", () => {
      ui.tab = tab.dataset.tab;
      render();
    });
  }
  document.getElementById("searchBox").addEventListener("input", (e) => {
    ui.query = e.target.value;
    renderList(data, tracker, ui);
    renderDetail(data, tracker, ui);
  });
  document.getElementById("gradeFilter").addEventListener("change", (e) => {
    ui.grade = e.target.value;
    render();
  });
  document.getElementById("hideEarned").addEventListener("change", (e) => {
    ui.hideEarned = e.target.checked;
    render();
  });
  document.getElementById("shieldToggle").addEventListener("change", (e) => {
    ui.shield = e.target.checked;
    render();
  });
  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([tracker.exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "palmetto-platinum-progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById("importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      tracker.importJson(await file.text());
      render();
    } catch {
      alert("That file is not a Palmetto Platinum progress export.");
    }
    e.target.value = "";
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Clear all tracked progress in this browser?")) {
      tracker.reset();
      render();
    }
  });

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const id = Number(el.dataset.id);
    if (action === "chip") {
      ui.kind = el.dataset.kind;
      buildChips();
      render();
    } else if (action === "select") {
      ui.selectedId = id;
      render();
    } else if (action === "earn") {
      const trophy = trophyById(id);
      tracker.setEarned(id, !tracker.isEarned(id), trophy);
    } else if (action === "plus" || action === "minus") {
      const trophy = trophyById(id);
      const step = counterStep(trophy) * (action === "plus" ? 1 : -1);
      tracker.bumpCounter(id, step, trophy);
    } else if (action === "open-guide") {
      openGuide(id);
    }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("row")) {
      e.preventDefault();
      ui.selectedId = Number(e.target.dataset.id);
      render();
    }
  });
  tracker.onChange(render);
}

async function boot() {
  try {
    const res = await fetch("data/trophies.json");
    data = await res.json();
  } catch {
    document.getElementById("trophyList").innerHTML =
      '<p class="empty">The trophy data could not be loaded. Serve the app/ folder over HTTP and reload.</p>';
    return;
  }
  if (!ui.selectedId) {
    const next = nextUp(data, tracker);
    ui.selectedId = next ? next.id : data.trophies[0].id;
  }
  document.getElementById("searchBox").value = ui.query;
  document.getElementById("gradeFilter").value = ui.grade;
  buildChips();
  wire();
  render();
}

boot();
