import { parseGoal, recommendBuild } from "./engine.js";

const DEFAULT_STATE = Object.freeze({
  goal: "A quiet 1440p gaming PC around $1,800 with room for streaming.",
  budget: 1800,
  useCase: "gaming",
  resolution: "1440p",
  priority: "quiet",
  memoryTarget: "auto",
  storageTarget: "auto",
  noiseTarget: "auto",
  vramTarget: "auto",
  coreTarget: "auto",
  powerTarget: "auto",
  caseTarget: "auto",
  profile: "balanced",
});
const SAVED_BUILD_KEY = "aipo-gpt-saved-build-v1";
const ALLOWED_OPTIONS = {
  useCase: new Set(["gaming", "streaming", "workstation", "development", "ai", "efficiency"]),
  resolution: new Set(["1080p", "1440p", "4k", "productivity"]),
  priority: new Set(["balanced", "performance", "quiet", "efficiency", "upgradeability"]),
  profile: new Set(["balanced", "performance", "value"]),
  memoryTarget: new Set(["auto", "32", "64"]),
  storageTarget: new Set(["auto", "1", "2"]),
  noiseTarget: new Set(["auto", "24", "28", "32"]),
  vramTarget: new Set(["auto", "12", "16"]),
  coreTarget: new Set(["auto", "6", "8", "12"]),
  powerTarget: new Set(["auto", "450", "550", "650"]),
  caseTarget: new Set(["auto", "compact", "standard"]),
};

const form = document.querySelector("#optimizer-form");
const fields = {
  goal: document.querySelector("#goal"),
  budget: document.querySelector("#budget"),
  budgetRange: document.querySelector("#budget-range"),
  useCase: document.querySelector("#use-case"),
  resolution: document.querySelector("#resolution"),
  priority: document.querySelector("#priority"),
  memoryTarget: document.querySelector("#memory-target"),
  storageTarget: document.querySelector("#storage-target"),
  noiseTarget: document.querySelector("#noise-target"),
  vramTarget: document.querySelector("#vram-target"),
  coreTarget: document.querySelector("#core-target"),
  powerTarget: document.querySelector("#power-target"),
  caseTarget: document.querySelector("#case-target"),
};
const profileButtons = [...document.querySelectorAll("[data-profile]")];
const presetButtons = [...document.querySelectorAll("[data-preset]")];
const copyButton = document.querySelector("#copy-build");
const copyValidationButton = document.querySelector("#copy-validation");
const copyLinkButton = document.querySelector("#copy-link");
const downloadButton = document.querySelector("#download-build");
const importInput = document.querySelector("#import-build");
const importButton = document.querySelector("#import-trigger");
const downloadMarkdownButton = document.querySelector("#download-markdown");
const downloadCsvButton = document.querySelector("#download-csv");
const printButton = document.querySelector("#print-build");
const resetButton = document.querySelector("#reset-build");
const saveLocalButton = document.querySelector("#save-local");
const loadLocalButton = document.querySelector("#load-local");
const clearLocalButton = document.querySelector("#clear-local");
const exportStatus = document.querySelector("#export-status");
const comparisonBody = document.querySelector("#profile-comparison-body");
const formError = document.querySelector("#form-error");
const resultStatus = document.querySelector("#result-status");
const advancedCount = document.querySelector("#advanced-count");
const root = document.documentElement;
const workspace = document.querySelector(".workspace");
const workspaceViewButtons = [...document.querySelectorAll("[data-workspace-view]")];
const resultsPanel = document.querySelector(".results-panel");
const optimizeButton = document.querySelector(".optimize-button");
const optimizeLabel = document.querySelector("#optimize-label");
const resultsFreshness = document.querySelector("#results-freshness");
const partsList = document.querySelector("#parts-list");
const toggleAllPartsButton = document.querySelector("#toggle-all-parts");
const constraintChips = document.querySelector("#constraint-chips");
const actionToast = document.querySelector("#action-toast");
const actionToastMessage = document.querySelector("#action-toast-message");
const closeToastButton = document.querySelector("#close-toast");
const motionToggle = document.querySelector("#motion-toggle");
const densityButtons = [...document.querySelectorAll("[data-density]")];
let updateTimer = 0;
let completionTimer = 0;
let resultIsStale = false;
let toastTimer = 0;
let activeProfile = "balanced";
let latestRecommendation;
let latestConstraints;

function setResultDensity(density, { persist = true } = {}) {
  const safeDensity = density === "compact" ? "compact" : "comfortable";
  resultsPanel.dataset.density = safeDensity;
  for (const button of densityButtons) {
    const active = button.dataset.density === safeDensity;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  if (persist) {
    try { localStorage.setItem("aipo-gpt-density", safeDensity); } catch { /* preference remains session-only */ }
  }
}

let savedDensity = "comfortable";
try { savedDensity = localStorage.getItem("aipo-gpt-density") ?? "comfortable"; } catch { /* use default */ }
setResultDensity(savedDensity, { persist: false });
for (const button of densityButtons) {
  button.addEventListener("click", () => {
    setResultDensity(button.dataset.density);
    showToast(`${button.textContent} result view selected.`);
  });
}

const formatMoney = (value) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(value);

function currentConstraints() {
  return {
    budget: Number(fields.budget.value),
    useCase: fields.useCase.value,
    resolution: fields.resolution.value,
    priority: fields.priority.value,
    memoryTarget: fields.memoryTarget.value,
    storageTarget: fields.storageTarget.value,
    noiseTarget: fields.noiseTarget.value,
    vramTarget: fields.vramTarget.value,
    coreTarget: fields.coreTarget.value,
    powerTarget: fields.powerTarget.value,
    caseTarget: fields.caseTarget.value,
  };
}

function updateAdvancedCount() {
  const values = [
    fields.memoryTarget.value,
    fields.storageTarget.value,
    fields.noiseTarget.value,
    fields.vramTarget.value,
    fields.coreTarget.value,
    fields.powerTarget.value,
    fields.caseTarget.value,
  ];
  const activeCount = values.filter((value) => value !== "auto").length;
  advancedCount.textContent = activeCount === 0 ? "Automatic" : `${activeCount} set`;
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionEnabled = !prefersReducedMotion;
try {
  if (localStorage.getItem("aipo-gpt-motion") === "off") motionEnabled = false;
} catch {
  // Motion still follows the operating-system preference when storage is unavailable.
}
root.dataset.motion = motionEnabled ? "on" : "off";
motionToggle.setAttribute("aria-pressed", String(motionEnabled));
motionToggle.textContent = prefersReducedMotion ? "Motion reduced" : (motionEnabled ? "Motion on" : "Motion off");
motionToggle.disabled = prefersReducedMotion;

const canTrackPointer = window.matchMedia("(pointer: fine)").matches;
let pointerFrame = 0;

if (canTrackPointer) {
  document.addEventListener("pointermove", (event) => {
    if (!motionEnabled) return;
    window.cancelAnimationFrame(pointerFrame);
    pointerFrame = window.requestAnimationFrame(() => {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      root.style.setProperty("--pointer-x", `${event.clientX}px`);
      root.style.setProperty("--pointer-y", `${event.clientY}px`);
      root.style.setProperty("--pointer-shift-x", `${(x - .5) * 24}px`);
      root.style.setProperty("--pointer-shift-y", `${(y - .5) * 18}px`);
      root.style.setProperty("--pointer-shift-inverse-x", `${(x - .5) * -18}px`);
      root.style.setProperty("--pointer-shift-inverse-y", `${(y - .5) * -14}px`);
    });
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    root.style.setProperty("--pointer-x", "50vw");
    root.style.setProperty("--pointer-y", "24vh");
    root.style.setProperty("--pointer-shift-x", "0px");
    root.style.setProperty("--pointer-shift-y", "0px");
    root.style.setProperty("--pointer-shift-inverse-x", "0px");
    root.style.setProperty("--pointer-shift-inverse-y", "0px");
  });
}

function resetPointerEffects() {
  root.style.setProperty("--pointer-x", "50vw");
  root.style.setProperty("--pointer-y", "24vh");
  root.style.setProperty("--pointer-shift-x", "0px");
  root.style.setProperty("--pointer-shift-y", "0px");
  root.style.setProperty("--pointer-shift-inverse-x", "0px");
  root.style.setProperty("--pointer-shift-inverse-y", "0px");
}

motionToggle.addEventListener("click", () => {
  if (prefersReducedMotion) return;
  motionEnabled = !motionEnabled;
  root.dataset.motion = motionEnabled ? "on" : "off";
  motionToggle.setAttribute("aria-pressed", String(motionEnabled));
  motionToggle.textContent = motionEnabled ? "Motion on" : "Motion off";
  if (!motionEnabled) resetPointerEffects();
  try { localStorage.setItem("aipo-gpt-motion", motionEnabled ? "on" : "off"); } catch { /* preference remains session-only */ }
  showToast(motionEnabled ? "Interface motion enabled." : "Interface motion paused.");
});

function setWorkspaceView(view, { focus = false } = {}) {
  workspace.dataset.mobileView = view;
  for (const button of workspaceViewButtons) {
    const isActive = button.dataset.workspaceView === view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
  if (focus && window.matchMedia("(max-width: 900px)").matches) {
    const target = view === "results" ? document.querySelector("#results-heading") : fields.goal;
    target.focus({ preventScroll: true });
  }
}

for (const button of workspaceViewButtons) {
  button.addEventListener("click", () => setWorkspaceView(button.dataset.workspaceView, { focus: true }));
}

function signalResultUpdate({ complete = false } = {}) {
  resultsPanel.classList.remove("is-updating");
  void resultsPanel.offsetWidth;
  resultsPanel.classList.add("is-updating");
  resultsPanel.setAttribute("aria-busy", "true");
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(() => {
    resultsPanel.classList.remove("is-updating");
    resultsPanel.setAttribute("aria-busy", "false");
  }, prefersReducedMotion ? 0 : 560);

  if (complete) {
    optimizeButton.classList.add("is-complete");
    optimizeLabel.textContent = "Build ready";
    window.clearTimeout(completionTimer);
    completionTimer = window.setTimeout(() => {
      optimizeButton.classList.remove("is-complete");
      optimizeLabel.textContent = resultIsStale ? "Refresh build" : "Generate build";
    }, prefersReducedMotion ? 0 : 1200);
  }
}

function setResultStale(stale) {
  resultIsStale = stale;
  resultsPanel.classList.toggle("is-stale", stale);
  resultsFreshness.classList.toggle("is-stale", stale);
  resultsFreshness.textContent = stale ? "Inputs changed · refresh needed" : "Up to date";
  if (!optimizeButton.classList.contains("is-complete")) {
    optimizeLabel.textContent = stale ? "Refresh build" : "Generate build";
  }
}

function showToast(message) {
  if (!message) return;
  const isError = /blocked|unavailable|not a valid|no valid/i.test(message);
  actionToastMessage.textContent = message;
  actionToast.classList.toggle("is-error", isError);
  actionToast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { actionToast.hidden = true; }, prefersReducedMotion ? 2200 : 3200);
}

new MutationObserver(() => showToast(exportStatus.textContent.trim())).observe(exportStatus, {
  childList: true,
  characterData: true,
  subtree: true,
});

closeToastButton.addEventListener("click", () => {
  window.clearTimeout(toastTimer);
  actionToast.hidden = true;
});

function syncPartsToggleLabel() {
  const toggles = [...partsList.querySelectorAll(".part-row")];
  const allExpanded = toggles.length > 0 && toggles.every((button) => button.getAttribute("aria-expanded") === "true");
  toggleAllPartsButton.textContent = allExpanded ? "Collapse all" : "Inspect all";
}

function renderConstraintChips(constraints) {
  const chips = [
    ["budget", formatMoney(constraints.budget)],
    ["use-case", fields.useCase.selectedOptions[0].textContent],
    ["resolution", fields.resolution.selectedOptions[0].textContent],
    ["priority", fields.priority.selectedOptions[0].textContent],
  ];
  for (const [key, field] of [
    ["memoryTarget", fields.memoryTarget],
    ["storageTarget", fields.storageTarget],
    ["noiseTarget", fields.noiseTarget],
    ["vramTarget", fields.vramTarget],
    ["coreTarget", fields.coreTarget],
    ["powerTarget", fields.powerTarget],
    ["caseTarget", fields.caseTarget],
  ]) {
    if (constraints[key] !== "auto") chips.push([field.id, field.selectedOptions[0].textContent]);
  }
  constraintChips.innerHTML = chips.map(([fieldId, label]) =>
    `<button type="button" data-edit-field="${fieldId}">${label}</button>`,
  ).join("");
}

constraintChips.addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit-field]");
  if (!button) return;
  const target = document.querySelector(`#${button.dataset.editField}`);
  if (target.closest("#advanced-controls")) document.querySelector("#advanced-controls").open = true;
  setWorkspaceView("configure");
  target.focus();
});

partsList.addEventListener("click", (event) => {
  const button = event.target.closest(".part-row");
  if (!button) return;
  const details = document.querySelector(`#${button.getAttribute("aria-controls")}`);
  const expanded = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(expanded));
  details.hidden = !expanded;
  syncPartsToggleLabel();
});

toggleAllPartsButton.addEventListener("click", () => {
  const toggles = [...partsList.querySelectorAll(".part-row")];
  const expand = toggles.some((button) => button.getAttribute("aria-expanded") !== "true");
  for (const button of toggles) {
    button.setAttribute("aria-expanded", String(expand));
    document.querySelector(`#${button.getAttribute("aria-controls")}`).hidden = !expand;
  }
  syncPartsToggleLabel();
});

function syncGoalToFields() {
  const parsed = parseGoal(fields.goal.value, currentConstraints());
  fields.budget.value = parsed.budget;
  fields.budgetRange.value = parsed.budget;
  fields.useCase.value = parsed.useCase;
  fields.resolution.value = parsed.resolution;
  fields.priority.value = parsed.priority;
  fields.memoryTarget.value = parsed.memoryTarget;
  fields.storageTarget.value = parsed.storageTarget;
  fields.noiseTarget.value = parsed.noiseTarget;
  fields.vramTarget.value = parsed.vramTarget;
  fields.coreTarget.value = parsed.coreTarget;
  fields.powerTarget.value = parsed.powerTarget;
  fields.caseTarget.value = parsed.caseTarget;
  return parsed;
}

function updateShareUrl(constraints) {
  const params = new URLSearchParams({
    budget: String(constraints.budget),
    useCase: constraints.useCase,
    resolution: constraints.resolution,
    priority: constraints.priority,
    memoryTarget: constraints.memoryTarget,
    storageTarget: constraints.storageTarget,
    noiseTarget: constraints.noiseTarget,
    vramTarget: constraints.vramTarget,
    coreTarget: constraints.coreTarget,
    powerTarget: constraints.powerTarget,
    caseTarget: constraints.caseTarget,
    profile: activeProfile,
    goal: fields.goal.value.trim(),
  });
  history.replaceState(null, "", `${location.pathname}?${params}`);
}

function restoreFromUrl(fallback) {
  const params = new URLSearchParams(location.search);
  const budget = Number(params.get("budget"));
  const restored = {
    budget: Number.isFinite(budget) && budget >= 800 && budget <= 5000 ? budget : fallback.budget,
    useCase: ALLOWED_OPTIONS.useCase.has(params.get("useCase")) ? params.get("useCase") : fallback.useCase,
    resolution: ALLOWED_OPTIONS.resolution.has(params.get("resolution")) ? params.get("resolution") : fallback.resolution,
    priority: ALLOWED_OPTIONS.priority.has(params.get("priority")) ? params.get("priority") : fallback.priority,
    memoryTarget: ALLOWED_OPTIONS.memoryTarget.has(params.get("memoryTarget")) ? params.get("memoryTarget") : fallback.memoryTarget,
    storageTarget: ALLOWED_OPTIONS.storageTarget.has(params.get("storageTarget")) ? params.get("storageTarget") : fallback.storageTarget,
    noiseTarget: ALLOWED_OPTIONS.noiseTarget.has(params.get("noiseTarget")) ? params.get("noiseTarget") : fallback.noiseTarget,
    vramTarget: ALLOWED_OPTIONS.vramTarget.has(params.get("vramTarget")) ? params.get("vramTarget") : fallback.vramTarget,
    coreTarget: ALLOWED_OPTIONS.coreTarget.has(params.get("coreTarget")) ? params.get("coreTarget") : fallback.coreTarget,
    powerTarget: ALLOWED_OPTIONS.powerTarget.has(params.get("powerTarget")) ? params.get("powerTarget") : fallback.powerTarget,
    caseTarget: ALLOWED_OPTIONS.caseTarget.has(params.get("caseTarget")) ? params.get("caseTarget") : fallback.caseTarget,
  };
  if (ALLOWED_OPTIONS.profile.has(params.get("profile"))) activeProfile = params.get("profile");
  if (params.get("goal")) fields.goal.value = params.get("goal");
  fields.budget.value = restored.budget;
  fields.budgetRange.value = restored.budget;
  fields.useCase.value = restored.useCase;
  fields.resolution.value = restored.resolution;
  fields.priority.value = restored.priority;
  fields.memoryTarget.value = restored.memoryTarget;
  fields.storageTarget.value = restored.storageTarget;
  fields.noiseTarget.value = restored.noiseTarget;
  fields.vramTarget.value = restored.vramTarget;
  fields.coreTarget.value = restored.coreTarget;
  fields.powerTarget.value = restored.powerTarget;
  fields.caseTarget.value = restored.caseTarget;
  return restored;
}

function readSavedBuild() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_BUILD_KEY));
    const budget = Number(saved?.budget);
    if (!saved || typeof saved.goal !== "string" || saved.goal.length < 12) return null;
    if (!Number.isFinite(budget) || budget < 800 || budget > 5000) return null;
    const memoryTarget = saved.memoryTarget ?? "auto";
    const storageTarget = saved.storageTarget ?? "auto";
    const noiseTarget = saved.noiseTarget ?? "auto";
    const vramTarget = saved.vramTarget ?? "auto";
    const coreTarget = saved.coreTarget ?? "auto";
    const powerTarget = saved.powerTarget ?? "auto";
    const caseTarget = saved.caseTarget ?? "auto";
    if (!ALLOWED_OPTIONS.useCase.has(saved.useCase)
      || !ALLOWED_OPTIONS.resolution.has(saved.resolution)
      || !ALLOWED_OPTIONS.priority.has(saved.priority)
      || !ALLOWED_OPTIONS.profile.has(saved.profile)
      || !ALLOWED_OPTIONS.memoryTarget.has(memoryTarget)
      || !ALLOWED_OPTIONS.storageTarget.has(storageTarget)
      || !ALLOWED_OPTIONS.noiseTarget.has(noiseTarget)
      || !ALLOWED_OPTIONS.vramTarget.has(vramTarget)
      || !ALLOWED_OPTIONS.coreTarget.has(coreTarget)
      || !ALLOWED_OPTIONS.powerTarget.has(powerTarget)
      || !ALLOWED_OPTIONS.caseTarget.has(caseTarget)) return null;
    return { ...saved, budget, memoryTarget, storageTarget, noiseTarget, vramTarget, coreTarget, powerTarget, caseTarget };
  } catch {
    return null;
  }
}

function render(constraints, { announce = false } = {}) {
  setResultStale(false);
  updateAdvancedCount();
  renderConstraintChips(constraints);
  const recommendation = recommendBuild(constraints, activeProfile);
  latestRecommendation = recommendation;
  latestConstraints = constraints;
  updateShareUrl(constraints);
  const parts = Object.entries(recommendation.parts);
  const compatible = recommendation.compatibilityChecks.filter((check) => check.pass).length;
  const goalsMet = recommendation.requirementChecks.filter((check) => check.pass).length;

  for (const button of profileButtons) {
    const isActive = button.dataset.profile === activeProfile;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  const profileLabels = {
    balanced: "Balanced",
    performance: "Max performance",
    value: "Best value",
  };
  comparisonBody.innerHTML = Object.entries(profileLabels).map(([profile, label]) => {
    const option = profile === activeProfile ? recommendation : recommendBuild(constraints, profile);
    const goalsMet = option.requirementChecks.filter((check) => check.pass).length;
    return `
      <tr class="${profile === activeProfile ? "is-active" : ""}">
        <th scope="row"><button type="button" data-compare-profile="${profile}">${label}</button></th>
        <td>${formatMoney(option.total)}</td>
        <td>${option.parts.cpu.name}</td>
        <td>${option.parts.gpu.name}</td>
        <td>${option.platformWatts}W</td>
        <td>${option.upgradeReadiness.score}%</td>
        <td>${goalsMet}/${option.requirementChecks.length}</td>
      </tr>
    `;
  }).join("");

  document.querySelector("#recommendation-summary").textContent = recommendation.summary;
  document.querySelector("#total-price").textContent = formatMoney(recommendation.total);
  document.querySelector("#budget-headroom").textContent = recommendation.budgetHeadroom >= 0
    ? formatMoney(recommendation.budgetHeadroom)
    : `${formatMoney(Math.abs(recommendation.budgetHeadroom))} over`;
  document.querySelector("#peak-power").textContent = `${recommendation.platformWatts}W`;
  document.querySelector("#upgrade-readiness").textContent = `${recommendation.upgradeReadiness.label} · ${recommendation.upgradeReadiness.score}%`;
  document.querySelector("#cooler-noise").textContent = `${recommendation.acoustics.label} · ${recommendation.acoustics.decibels}dBA`;
  document.querySelector("#power-reserve").textContent = `${recommendation.powerReserve.watts}W · ${recommendation.powerReserve.percentage}%`;
  const upgradeLabels = {
    power: "At least 250W of PSU upgrade reserve",
    memory: "64GB memory capacity already installed",
    motherboard: "High-tier motherboard expansion platform",
    clearance: "At least 70mm of extra GPU length clearance",
  };
  document.querySelector("#upgrade-breakdown-list").innerHTML = Object.entries(recommendation.upgradeReadiness.signals).map(([signal, pass]) =>
    `<li class="${pass ? "is-pass" : "is-warning"}">${pass ? "✓" : "!"} ${upgradeLabels[signal]}</li>`,
  ).join("");
  document.querySelector("#build-id").textContent = recommendation.buildId;
  document.querySelector("#search-stats").textContent = `${recommendation.searchStats.evaluated.toLocaleString()} combinations checked · ${recommendation.searchStats.compatible.toLocaleString()} compatible · ${recommendation.searchStats.affordable.toLocaleString()} within budget`;
  document.querySelector("#balance-score").textContent = `${recommendation.componentBalance.label} · ${recommendation.componentBalance.score}% balance`;
  document.querySelector("#value-density").textContent = `${recommendation.valueDensity.label} · ${recommendation.valueDensity.pointsPerThousand} weighted tier points per $1k`;
  const budgetProgress = document.querySelector("#budget-progress");
  document.querySelector("#budget-usage").textContent = `${recommendation.budgetUsage.percentage}% · ${recommendation.budgetUsage.label}`;
  budgetProgress.setAttribute("aria-valuenow", String(Math.min(recommendation.budgetUsage.percentage, 100)));
  budgetProgress.querySelector("span").style.width = `${Math.min(recommendation.budgetUsage.percentage, 100)}%`;

  const score = document.querySelector("#compatibility-score");
  score.textContent = `${compatible}/${recommendation.compatibilityChecks.length} safe · ${goalsMet}/${recommendation.requirementChecks.length} goals`;
  score.style.color = compatible === recommendation.compatibilityChecks.length ? "var(--acid)" : "var(--danger)";
  if (announce) {
    resultStatus.textContent = `Build ready. ${compatible} compatibility checks passed, ${goalsMet} goals met, estimated total ${formatMoney(recommendation.total)}.`;
    document.querySelector("#results-heading").focus();
  }

  partsList.innerHTML = parts.map(([type, part]) => `
    <article class="part-card">
      <button class="part-row" type="button" aria-expanded="false" aria-controls="part-inspection-${type}">
        <span class="part-type">${type === "motherboard" ? "board" : type}</span>
        <span class="part-detail"><span class="part-name">${part.name}</span></span>
        <span class="part-price">${formatMoney(part.price)}</span>
        <span class="part-toggle" aria-hidden="true">+</span>
      </button>
      <div class="part-inspection" id="part-inspection-${type}" hidden>
        <p class="part-reason">${recommendation.rationales[type]}</p>
        <span>${Math.round(recommendation.budgetAllocation[type].percentage * 100)}% of budget</span>
      </div>
    </article>
  `).join("");
  syncPartsToggleLabel();

  document.querySelector("#allocation-list").innerHTML = Object.entries(recommendation.budgetAllocation).map(([type, allocation]) => `
    <div class="allocation-row">
      <span>${type === "motherboard" ? "board" : type}</span>
      <div class="allocation-track" aria-hidden="true"><span style="width: ${(allocation.percentage * 100).toFixed(1)}%"></span></div>
      <strong>${Math.round(allocation.percentage * 100)}%</strong>
    </div>
  `).join("");

  const alternativesPanel = document.querySelector("#alternatives-panel");
  alternativesPanel.hidden = recommendation.alternatives.length === 0;
  document.querySelector("#alternatives-list").innerHTML = recommendation.alternatives.map((alternative) => `
    <article class="alternative-row">
      <div><strong>${alternative.cpu}</strong><span>${alternative.gpu}</span></div>
      <div><strong>${formatMoney(alternative.total)}</strong><span>${formatMoney(alternative.headroom)} headroom</span><span>${alternative.platformWatts}W peak · ${alternative.goalsMet}/${alternative.goalCount} goals</span></div>
      <code>${alternative.buildId}</code>
    </article>
  `).join("");

  document.querySelector("#explanation-list").innerHTML = recommendation.checks.map((check) => `
    <li class="${check.pass ? "is-pass" : "is-warning"}">${check.pass ? "✓" : "!"} ${check.label}</li>
  `).join("");

  const warningPanel = document.querySelector("#shortfall-panel");
  warningPanel.hidden = recommendation.shortfalls.length === 0;
  document.querySelector("#shortfall-list").innerHTML = recommendation.shortfalls.map((advice) => `<li>${advice}</li>`).join("");
  const recoveryPath = document.querySelector("#recovery-path");
  const recovery = recommendation.goalRecovery;
  recoveryPath.hidden = !recovery || recommendation.shortfalls.length === 0;
  if (recovery) {
    const gap = recovery.additionalBudget > 0
      ? `${formatMoney(recovery.additionalBudget)} above this budget`
      : "within this budget";
    recoveryPath.textContent = `A configuration meeting every performance target starts at ${formatMoney(recovery.total)} (${gap}) with ${recovery.cpu} and ${recovery.gpu}.`;
  }

  document.querySelector("#parsed-goal").textContent = `constraints = ${JSON.stringify(constraints)}`;
  signalResultUpdate({ complete: announce });
}

function buildShareText() {
  const partLines = Object.entries(latestRecommendation.parts).map(([type, part]) =>
    `${type === "motherboard" ? "Motherboard" : `${type[0].toUpperCase()}${type.slice(1)}`}: ${part.name} (${formatMoney(part.price)})`,
  );

  return [
    `AIPO-GPT ${activeProfile} build`,
    latestRecommendation.summary,
    `Estimated total: ${formatMoney(latestRecommendation.total)}`,
    `Estimated peak draw: ${latestRecommendation.platformWatts}W`,
    `Build ID: ${latestRecommendation.buildId}`,
    "",
    ...partLines,
  ].join("\n");
}

function buildValidationText() {
  const compatibility = latestRecommendation.compatibilityChecks.map((check) =>
    `${check.pass ? "PASS" : "FAIL"} · ${check.label}`,
  );
  const goals = latestRecommendation.requirementChecks.map((check) =>
    `${check.pass ? "MET" : "MISS"} · ${check.label}`,
  );
  return [
    `AIPO-GPT validation report · ${latestRecommendation.buildId}`,
    "",
    "Compatibility",
    ...compatibility,
    "",
    "Build goals",
    ...goals,
  ].join("\n");
}

function buildMarkdown() {
  const partRows = Object.entries(latestRecommendation.parts).map(([type, part]) =>
    `| ${type === "motherboard" ? "Motherboard" : `${type[0].toUpperCase()}${type.slice(1)}`} | ${part.name} | ${formatMoney(part.price)} |`,
  );
  const checkRows = latestRecommendation.checks.map((check) =>
    `- ${check.pass ? "[x]" : "[ ]"} ${check.label}`,
  );

  return [
    `# AIPO-GPT ${activeProfile} build`,
    "",
    latestRecommendation.summary,
    "",
    `- **Estimated total:** ${formatMoney(latestRecommendation.total)}`,
    `- **Budget headroom:** ${formatMoney(latestRecommendation.budgetHeadroom)}`,
    `- **Estimated peak draw:** ${latestRecommendation.platformWatts}W`,
    `- **Build ID:** ${latestRecommendation.buildId}`,
    "",
    "## Components",
    "",
    "| Component | Selection | Price |",
    "| --- | --- | ---: |",
    ...partRows,
    "",
    "## Validation",
    "",
    ...checkRows,
    "",
  ].join("\n");
}

function buildCsv() {
  const cell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [
    ["AIPO-GPT build", latestRecommendation.buildId],
    ["Profile", activeProfile],
    ["Estimated total", latestRecommendation.total],
    ["Budget", latestConstraints.budget],
    ["Budget headroom", latestRecommendation.budgetHeadroom],
    ["Estimated peak draw (W)", latestRecommendation.platformWatts],
    [],
    ["Component", "Selection", "Price (USD)", "Rationale"],
    ...Object.entries(latestRecommendation.parts).map(([type, part]) => [
      type === "motherboard" ? "Motherboard" : `${type[0].toUpperCase()}${type.slice(1)}`,
      part.name,
      part.price,
      latestRecommendation.rationales[type],
    ]),
  ];
  return rows.map((row) => row.map(cell).join(",")).join("\n");
}

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildShareText());
    exportStatus.textContent = "Build summary copied.";
  } catch {
    exportStatus.textContent = "Copy was blocked by the browser. Download the JSON plan instead.";
  }
});

copyValidationButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildValidationText());
    exportStatus.textContent = "Validation report copied.";
  } catch {
    exportStatus.textContent = "Copy was blocked by the browser.";
  }
});

copyLinkButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    exportStatus.textContent = "Shareable build link copied.";
  } catch {
    exportStatus.textContent = "Copy was blocked by the browser.";
  }
});

downloadButton.addEventListener("click", () => {
  const payload = {
    generatedAt: new Date().toISOString(),
    goal: fields.goal.value.trim(),
    constraints: latestConstraints,
    profile: activeProfile,
    recommendation: latestRecommendation,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aipo-gpt-${activeProfile}-build.json`;
  link.click();
  URL.revokeObjectURL(url);
  exportStatus.textContent = "JSON build plan downloaded.";
});

importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  if (!file) return;
  try {
    if (file.size > 1_000_000) throw new RangeError("File is too large");
    const payload = JSON.parse(await file.text());
    const constraints = payload?.constraints;
    const budget = Number(constraints?.budget);
    const memoryTarget = constraints?.memoryTarget ?? "auto";
    const storageTarget = constraints?.storageTarget ?? "auto";
    const noiseTarget = constraints?.noiseTarget ?? "auto";
    const vramTarget = constraints?.vramTarget ?? "auto";
    const coreTarget = constraints?.coreTarget ?? "auto";
    const powerTarget = constraints?.powerTarget ?? "auto";
    const caseTarget = constraints?.caseTarget ?? "auto";
    const valid = Number.isFinite(budget) && budget >= 800 && budget <= 5000
      && ALLOWED_OPTIONS.useCase.has(constraints?.useCase)
      && ALLOWED_OPTIONS.resolution.has(constraints?.resolution)
      && ALLOWED_OPTIONS.priority.has(constraints?.priority)
      && ALLOWED_OPTIONS.profile.has(payload?.profile)
      && ALLOWED_OPTIONS.memoryTarget.has(memoryTarget)
      && ALLOWED_OPTIONS.storageTarget.has(storageTarget)
      && ALLOWED_OPTIONS.noiseTarget.has(noiseTarget)
      && ALLOWED_OPTIONS.vramTarget.has(vramTarget)
      && ALLOWED_OPTIONS.coreTarget.has(coreTarget)
      && ALLOWED_OPTIONS.powerTarget.has(powerTarget)
      && ALLOWED_OPTIONS.caseTarget.has(caseTarget);
    if (!valid) throw new TypeError("Invalid build plan");

    fields.goal.value = typeof payload.goal === "string" && payload.goal.length >= 12
      ? payload.goal
      : `Imported ${constraints.resolution} ${constraints.useCase} build under $${budget}`;
    fields.budget.value = budget;
    fields.budgetRange.value = budget;
    fields.useCase.value = constraints.useCase;
    fields.resolution.value = constraints.resolution;
    fields.priority.value = constraints.priority;
    fields.memoryTarget.value = memoryTarget;
    fields.storageTarget.value = storageTarget;
    fields.noiseTarget.value = noiseTarget;
    fields.vramTarget.value = vramTarget;
    fields.coreTarget.value = coreTarget;
    fields.powerTarget.value = powerTarget;
    fields.caseTarget.value = caseTarget;
    activeProfile = payload.profile;
    render({ ...constraints, budget, memoryTarget, storageTarget, noiseTarget, vramTarget, coreTarget, powerTarget, caseTarget }, { announce: true });
    exportStatus.textContent = "JSON build plan imported and recalculated.";
  } catch {
    exportStatus.textContent = "That file is not a valid AIPO-GPT build plan.";
  } finally {
    importInput.value = "";
  }
});

importButton.addEventListener("click", () => importInput.click());

downloadMarkdownButton.addEventListener("click", () => {
  const blob = new Blob([buildMarkdown()], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aipo-gpt-${activeProfile}-build.md`;
  link.click();
  URL.revokeObjectURL(url);
  exportStatus.textContent = "Markdown build sheet downloaded.";
});

downloadCsvButton.addEventListener("click", () => {
  const blob = new Blob([buildCsv()], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aipo-gpt-${activeProfile}-build.csv`;
  link.click();
  URL.revokeObjectURL(url);
  exportStatus.textContent = "CSV bill of materials downloaded.";
});

printButton.addEventListener("click", () => {
  exportStatus.textContent = "Opening a print-ready build sheet.";
  window.print();
});

saveLocalButton.addEventListener("click", () => {
  try {
    localStorage.setItem(SAVED_BUILD_KEY, JSON.stringify({
      goal: fields.goal.value.trim(),
      ...currentConstraints(),
      profile: activeProfile,
    }));
    loadLocalButton.disabled = false;
    clearLocalButton.disabled = false;
    exportStatus.textContent = "Build saved in this browser.";
  } catch {
    exportStatus.textContent = "Browser storage is unavailable.";
  }
});

loadLocalButton.addEventListener("click", () => {
  const saved = readSavedBuild();
  if (!saved) {
    loadLocalButton.disabled = true;
    exportStatus.textContent = "No valid saved build was found.";
    return;
  }
  fields.goal.value = saved.goal;
  fields.budget.value = saved.budget;
  fields.budgetRange.value = saved.budget;
  fields.useCase.value = saved.useCase;
  fields.resolution.value = saved.resolution;
  fields.priority.value = saved.priority;
  fields.memoryTarget.value = saved.memoryTarget;
  fields.storageTarget.value = saved.storageTarget;
  fields.noiseTarget.value = saved.noiseTarget;
  fields.vramTarget.value = saved.vramTarget;
  fields.coreTarget.value = saved.coreTarget;
  fields.powerTarget.value = saved.powerTarget;
  fields.caseTarget.value = saved.caseTarget;
  activeProfile = saved.profile;
  render({
    budget: saved.budget,
    useCase: saved.useCase,
    resolution: saved.resolution,
    priority: saved.priority,
    memoryTarget: saved.memoryTarget,
    storageTarget: saved.storageTarget,
    noiseTarget: saved.noiseTarget,
    vramTarget: saved.vramTarget,
    coreTarget: saved.coreTarget,
    powerTarget: saved.powerTarget,
    caseTarget: saved.caseTarget,
  }, { announce: true });
  exportStatus.textContent = "Saved build restored.";
});

clearLocalButton.addEventListener("click", () => {
  try {
    localStorage.removeItem(SAVED_BUILD_KEY);
    loadLocalButton.disabled = true;
    clearLocalButton.disabled = true;
    exportStatus.textContent = "Saved browser build cleared.";
  } catch {
    exportStatus.textContent = "Browser storage is unavailable.";
  }
});

resetButton.addEventListener("click", () => {
  fields.goal.value = DEFAULT_STATE.goal;
  fields.budget.value = DEFAULT_STATE.budget;
  fields.budgetRange.value = DEFAULT_STATE.budget;
  fields.useCase.value = DEFAULT_STATE.useCase;
  fields.resolution.value = DEFAULT_STATE.resolution;
  fields.priority.value = DEFAULT_STATE.priority;
  fields.memoryTarget.value = DEFAULT_STATE.memoryTarget;
  fields.storageTarget.value = DEFAULT_STATE.storageTarget;
  fields.noiseTarget.value = DEFAULT_STATE.noiseTarget;
  fields.vramTarget.value = DEFAULT_STATE.vramTarget;
  fields.coreTarget.value = DEFAULT_STATE.coreTarget;
  fields.powerTarget.value = DEFAULT_STATE.powerTarget;
  fields.caseTarget.value = DEFAULT_STATE.caseTarget;
  activeProfile = DEFAULT_STATE.profile;
  formError.textContent = "";
  exportStatus.textContent = "";
  render({
    budget: DEFAULT_STATE.budget,
    useCase: DEFAULT_STATE.useCase,
    resolution: DEFAULT_STATE.resolution,
    priority: DEFAULT_STATE.priority,
    memoryTarget: DEFAULT_STATE.memoryTarget,
    storageTarget: DEFAULT_STATE.storageTarget,
    noiseTarget: DEFAULT_STATE.noiseTarget,
    vramTarget: DEFAULT_STATE.vramTarget,
    coreTarget: DEFAULT_STATE.coreTarget,
    powerTarget: DEFAULT_STATE.powerTarget,
    caseTarget: DEFAULT_STATE.caseTarget,
  });
  resultStatus.textContent = "Optimizer defaults restored.";
  fields.goal.focus();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";
  setWorkspaceView("results");
  render(syncGoalToFields(), { announce: true });
});

form.addEventListener("invalid", (event) => {
  const messages = {
    goal: "Describe the PC you want in at least 12 characters.",
    budget: "Enter a budget from $800 to $5,000.",
  };
  formError.textContent = messages[event.target.id] ?? "Check the highlighted field and try again.";
}, true);

form.addEventListener("input", () => {
  formError.textContent = "";
  updateAdvancedCount();
  setResultStale(true);
});

form.addEventListener("change", updateAdvancedCount);

fields.budgetRange.addEventListener("input", () => {
  fields.budget.value = fields.budgetRange.value;
});

fields.budget.addEventListener("input", () => {
  const budget = Number(fields.budget.value);
  if (Number.isFinite(budget) && budget >= 800 && budget <= 5000) fields.budgetRange.value = budget;
});

for (const button of profileButtons) {
  button.addEventListener("click", () => {
    activeProfile = button.dataset.profile;
    render(currentConstraints());
  });
}

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    fields.goal.value = button.dataset.preset;
    render(syncGoalToFields());
  });
}

comparisonBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-compare-profile]");
  if (!button) return;
  activeProfile = button.dataset.compareProfile;
  render(currentConstraints());
});

const hasSavedBuild = Boolean(readSavedBuild());
loadLocalButton.disabled = !hasSavedBuild;
clearLocalButton.disabled = !hasSavedBuild;
render(restoreFromUrl(syncGoalToFields()));
