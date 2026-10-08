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
const RECENT_BUILDS_KEY = "aipo-gpt-recent-builds-v1";
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
const budgetAdjustButtons = [...document.querySelectorAll("[data-budget-adjust]")];
const budgetPresetButtons = [...document.querySelectorAll("[data-budget-preset]")];
const copyButton = document.querySelector("#copy-build");
const copyValidationButton = document.querySelector("#copy-validation");
const copyLinkButton = document.querySelector("#copy-link");
const shareBuildButton = document.querySelector("#share-build");
const downloadButton = document.querySelector("#download-build");
const importInput = document.querySelector("#import-build");
const importButton = document.querySelector("#import-trigger");
const downloadMarkdownButton = document.querySelector("#download-markdown");
const downloadCsvButton = document.querySelector("#download-csv");
const printButton = document.querySelector("#print-build");
const resetButton = document.querySelector("#reset-build");
const revertInputsButton = document.querySelector("#revert-inputs");
const saveLocalButton = document.querySelector("#save-local");
const loadLocalButton = document.querySelector("#load-local");
const clearLocalButton = document.querySelector("#clear-local");
const exportStatus = document.querySelector("#export-status");
const comparisonBody = document.querySelector("#profile-comparison-body");
const profileImpact = document.querySelector("#profile-impact");
const formError = document.querySelector("#form-error");
const resultStatus = document.querySelector("#result-status");
const advancedCount = document.querySelector("#advanced-count");
const goalGuidance = document.querySelector("#goal-guidance");
const goalCount = document.querySelector("#goal-count");
const changedFields = document.querySelector("#changed-fields");
const changedFieldsList = document.querySelector("#changed-fields-list");
const root = document.documentElement;
const workspace = document.querySelector(".workspace");
const workspaceViewButtons = [...document.querySelectorAll("[data-workspace-view]")];
const mobilePrimaryAction = document.querySelector("#mobile-primary-action");
const resultsPanel = document.querySelector(".results-panel");
const optimizeButton = document.querySelector(".optimize-button");
const optimizeLabel = document.querySelector("#optimize-label");
const resultsFreshness = document.querySelector("#results-freshness");
const partsList = document.querySelector("#parts-list");
const allocationList = document.querySelector("#allocation-list");
const allocationViewButtons = [...document.querySelectorAll("[data-allocation-view]")];
const alternativesList = document.querySelector("#alternatives-list");
const toggleAllPartsButton = document.querySelector("#toggle-all-parts");
const partFilter = document.querySelector("#part-filter");
const partSort = document.querySelector("#part-sort");
const partFilterStatus = document.querySelector("#part-filter-status");
const partFilterEmpty = document.querySelector("#part-filter-empty");
const clearPartFilterButton = document.querySelector("#clear-part-filter");
const constraintChips = document.querySelector("#constraint-chips");
const actionToast = document.querySelector("#action-toast");
const actionToastMessage = document.querySelector("#action-toast-message");
const closeToastButton = document.querySelector("#close-toast");
const motionToggle = document.querySelector("#motion-toggle");
const focusToggle = document.querySelector("#focus-toggle");
const contrastToggle = document.querySelector("#contrast-toggle");
const densityButtons = [...document.querySelectorAll("[data-density]")];
const commandDialog = document.querySelector("#command-dialog");
const commandTrigger = document.querySelector("#command-trigger");
const commandClose = document.querySelector("#command-close");
const commandSearch = document.querySelector("#command-search");
const commandButtons = [...document.querySelectorAll("[data-command]")];
const commandEmpty = document.querySelector("#command-empty");
const resultJumpButtons = [...document.querySelectorAll("[data-result-target]")];
const metricCards = [...document.querySelectorAll(".metric")];
const toggleResultPanelsButton = document.querySelector("#toggle-result-panels");
const resultDetailPanels = [...resultsPanel.querySelectorAll("details")];
const pinBaselineButton = document.querySelector("#pin-baseline");
const clearBaselineButton = document.querySelector("#clear-baseline");
const baselineStatus = document.querySelector("#baseline-status");
const componentChanges = document.querySelector("#component-changes");
const metricGuideDialog = document.querySelector("#metric-guide-dialog");
const metricGuideTrigger = document.querySelector("#metric-guide-trigger");
const metricGuideClose = document.querySelector("#metric-guide-close");
const shortcutDialog = document.querySelector("#shortcut-dialog");
const shortcutTrigger = document.querySelector("#shortcut-trigger");
const shortcutClose = document.querySelector("#shortcut-close");
const validationFilterButtons = [...document.querySelectorAll("[data-validation-filter]")];
const validationScopeButtons = [...document.querySelectorAll("[data-validation-scope]")];
const validationFilterStatus = document.querySelector("#validation-filter-status");
const validationEmpty = document.querySelector("#validation-empty");
const clearValidationFiltersButton = document.querySelector("#clear-validation-filters");
const compatibilityScoreButton = document.querySelector("#compatibility-score");
const recentBuildList = document.querySelector("#recent-build-list");
const recentBuildCount = document.querySelector("#recent-build-count");
const clearRecentBuildsButton = document.querySelector("#clear-recent-builds");
const resetAdvancedButton = document.querySelector("#reset-advanced");
const advancedResetStatus = document.querySelector("#advanced-reset-status");
const readinessItems = document.querySelector("#readiness-items");
const readinessGoal = document.querySelector("#readiness-goal");
const readinessBudget = document.querySelector("#readiness-budget");
const readinessAdvanced = document.querySelector("#readiness-advanced");
let updateTimer = 0;
let completionTimer = 0;
let resultIsStale = false;
let toastTimer = 0;
let activeProfile = "balanced";
let latestRecommendation;
let latestConstraints;
let baselineRecommendation;
let latestFormState;
let activeValidationFilter = "all";
let activeValidationScope = "all";
let activeAllocationView = "percent";
let recentBuilds = [];
try {
  const storedRecentBuilds = JSON.parse(sessionStorage.getItem(RECENT_BUILDS_KEY) ?? "[]");
  if (Array.isArray(storedRecentBuilds)) recentBuilds = storedRecentBuilds.slice(0, 5);
} catch { /* recent builds remain session-only in memory */ }
const metricFrames = new WeakMap();

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

function setAllocationView(view) {
  activeAllocationView = view === "dollars" ? "dollars" : "percent";
  for (const button of allocationViewButtons) {
    const active = button.dataset.allocationView === activeAllocationView;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  for (const row of allocationList.querySelectorAll("[data-allocation-price]")) {
    row.querySelector("strong").textContent = activeAllocationView === "dollars"
      ? formatMoney(Number(row.dataset.allocationPrice))
      : `${row.dataset.allocationPercent}%`;
  }
}

for (const button of allocationViewButtons) {
  button.addEventListener("click", () => setAllocationView(button.dataset.allocationView));
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

function syncResultPanelsButton() {
  const availablePanels = resultDetailPanels.filter((panel) => !panel.hidden);
  const allOpen = availablePanels.length > 0 && availablePanels.every((panel) => panel.open);
  toggleResultPanelsButton.textContent = allOpen ? "Close all panels" : "Open all panels";
  toggleResultPanelsButton.setAttribute("aria-expanded", String(allOpen));
}

toggleResultPanelsButton.addEventListener("click", () => {
  const availablePanels = resultDetailPanels.filter((panel) => !panel.hidden);
  const shouldOpen = availablePanels.some((panel) => !panel.open);
  for (const panel of availablePanels) panel.open = shouldOpen;
  syncResultPanelsButton();
  showToast(shouldOpen ? "All result panels opened." : "Result panels collapsed.");
});
for (const panel of resultDetailPanels) panel.addEventListener("toggle", syncResultPanelsButton);
syncResultPanelsButton();

function openCommandDialog() {
  commandSearch.value = "";
  for (const button of commandButtons) button.hidden = false;
  commandEmpty.hidden = true;
  commandDialog.showModal();
  commandSearch.focus();
}

function runCommand(command) {
  commandDialog.close();
  if (command === "edit-goal") {
    setWorkspaceView("configure");
    fields.goal.focus();
  } else if (command === "show-results") {
    setWorkspaceView("results");
    document.querySelector("#results-heading").focus();
  } else if (command === "profile-performance" || command === "profile-value") {
    activeProfile = command === "profile-performance" ? "performance" : "value";
    render(currentConstraints());
    setWorkspaceView("results");
  } else if (command === "copy-link") {
    copyLinkButton.click();
  } else if (command === "compact-view") {
    setResultDensity("compact");
    showToast("Compact result view selected.");
  } else if (command === "focus-mode") {
    setFocusMode(root.dataset.focus !== "on");
  } else if (command === "contrast-mode") {
    setContrastMode(root.dataset.contrast !== "high");
  } else if (command === "metric-guide") {
    metricGuideDialog.showModal();
  } else if (command === "shortcut-guide") {
    shortcutDialog.showModal();
  } else if (command === "filter-components") {
    focusPartFilter();
  }
}

function setFocusMode(enabled) {
  root.dataset.focus = enabled ? "on" : "off";
  focusToggle.setAttribute("aria-pressed", String(enabled));
  focusToggle.textContent = enabled ? "Exit focus" : "Focus mode";
  showToast(enabled ? "Focus mode enabled. Press Escape to exit." : "Focus mode closed.");
}

focusToggle.addEventListener("click", () => setFocusMode(root.dataset.focus !== "on"));

function setContrastMode(enabled, { persist = true } = {}) {
  root.dataset.contrast = enabled ? "high" : "standard";
  contrastToggle.setAttribute("aria-pressed", String(enabled));
  contrastToggle.textContent = enabled ? "Standard contrast" : "High contrast";
  if (persist) {
    try { localStorage.setItem("aipo-gpt-contrast", enabled ? "high" : "standard"); } catch { /* preference remains session-only */ }
  }
}

let savedContrast = "standard";
try { savedContrast = localStorage.getItem("aipo-gpt-contrast") ?? "standard"; } catch { /* use default */ }
setContrastMode(savedContrast === "high", { persist: false });
contrastToggle.addEventListener("click", () => {
  const enabled = root.dataset.contrast !== "high";
  setContrastMode(enabled);
  showToast(enabled ? "High contrast enabled." : "Standard contrast enabled.");
});

commandTrigger.addEventListener("click", openCommandDialog);
commandClose.addEventListener("click", () => commandDialog.close());
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (commandDialog.open) commandDialog.close(); else openCommandDialog();
  } else if (event.key === "Escape" && root.dataset.focus === "on" && !commandDialog.open) {
    setFocusMode(false);
  } else if (event.key.toLowerCase() === "f" && !event.metaKey && !event.ctrlKey && !event.altKey
    && !event.target.closest("input, textarea, select, [contenteditable]")) {
    setFocusMode(root.dataset.focus !== "on");
  } else if (event.key === "?" && !event.target.closest("input, textarea, select, [contenteditable]")) {
    shortcutDialog.showModal();
  } else if (event.key === "/" && !event.target.closest("input, textarea, select, [contenteditable]")) {
    event.preventDefault();
    focusPartFilter();
  }
});
commandSearch.addEventListener("input", () => {
  const query = commandSearch.value.trim().toLowerCase();
  let visible = 0;
  for (const button of commandButtons) {
    button.hidden = !button.textContent.toLowerCase().includes(query);
    if (!button.hidden) visible += 1;
  }
  commandEmpty.hidden = visible > 0;
});
commandDialog.addEventListener("keydown", (event) => {
  const visibleCommands = commandButtons.filter((button) => !button.hidden);
  if (visibleCommands.length === 0) return;
  const currentIndex = visibleCommands.indexOf(document.activeElement);
  if (event.key === "ArrowDown") {
    event.preventDefault();
    visibleCommands[(currentIndex + 1) % visibleCommands.length].focus();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    const nextIndex = currentIndex <= 0 ? visibleCommands.length - 1 : currentIndex - 1;
    visibleCommands[nextIndex].focus();
  } else if (event.key === "Home" && currentIndex >= 0) {
    event.preventDefault();
    visibleCommands[0].focus();
  } else if (event.key === "End" && currentIndex >= 0) {
    event.preventDefault();
    visibleCommands.at(-1).focus();
  } else if (event.key === "Enter" && document.activeElement === commandSearch) {
    event.preventDefault();
    visibleCommands[0].click();
  }
});
for (const button of commandButtons) {
  button.addEventListener("click", () => runCommand(button.dataset.command));
}

metricGuideTrigger.addEventListener("click", () => metricGuideDialog.showModal());
metricGuideClose.addEventListener("click", () => metricGuideDialog.close());
metricGuideDialog.addEventListener("click", (event) => {
  if (event.target === metricGuideDialog) metricGuideDialog.close();
});
shortcutTrigger.addEventListener("click", () => shortcutDialog.showModal());
shortcutClose.addEventListener("click", () => shortcutDialog.close());
shortcutDialog.addEventListener("click", (event) => {
  if (event.target === shortcutDialog) shortcutDialog.close();
});

function applyValidationFilter(filter = activeValidationFilter, scope = activeValidationScope) {
  activeValidationFilter = filter;
  activeValidationScope = scope;
  const rows = [...document.querySelectorAll("#explanation-list li")];
  let visible = 0;
  for (const row of rows) {
    const matchesStatus = filter === "all"
      || (filter === "issues" && row.classList.contains("is-warning"))
      || (filter === "passed" && row.classList.contains("is-pass"));
    const matchesScope = scope === "all" || row.dataset.validationScope === scope;
    const show = matchesStatus && matchesScope;
    row.hidden = !show;
    if (show) visible += 1;
  }
  for (const button of validationFilterButtons) {
    const active = button.dataset.validationFilter === filter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  for (const button of validationScopeButtons) {
    const active = button.dataset.validationScope === scope;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  validationFilterStatus.textContent = `${visible} of ${rows.length} checks shown`;
  validationEmpty.hidden = visible > 0 || rows.length === 0;
}

for (const button of validationFilterButtons) {
  button.addEventListener("click", () => applyValidationFilter(button.dataset.validationFilter));
}
for (const button of validationScopeButtons) {
  button.addEventListener("click", () => applyValidationFilter(activeValidationFilter, button.dataset.validationScope));
}
clearValidationFiltersButton.addEventListener("click", () => {
  applyValidationFilter("all", "all");
  validationFilterButtons[0].focus();
  showToast("Every validation check is visible.");
});

for (const button of resultJumpButtons) {
  button.addEventListener("click", () => {
    const target = document.querySelector(`#${button.dataset.resultTarget}`);
    if (target instanceof HTMLDetailsElement) target.open = true;
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
  });
}

compatibilityScoreButton.addEventListener("click", () => {
  const validation = document.querySelector("#validation-details");
  validation.open = true;
  validation.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  validation.focus({ preventScroll: true });
});

function setActiveResultSection(sectionId) {
  for (const button of resultJumpButtons) {
    const active = button.dataset.resultTarget === sectionId;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "location");
    else button.removeAttribute("aria-current");
  }
}

const resultSectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) setActiveResultSection(visible.target.id);
}, { rootMargin: "-18% 0px -62%", threshold: [0, .25, .6] });
for (const button of resultJumpButtons) {
  resultSectionObserver.observe(document.querySelector(`#${button.dataset.resultTarget}`));
}
setActiveResultSection("build-metrics");

const formatMoney = (value) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(value);

function animateMetric(element, nextValue, formatter) {
  const previousValue = Number(element.dataset.metricValue ?? nextValue);
  element.dataset.metricValue = String(nextValue);
  const existingFrame = metricFrames.get(element);
  if (existingFrame) window.cancelAnimationFrame(existingFrame);
  if (prefersReducedMotion || !motionEnabled || previousValue === nextValue) {
    element.textContent = formatter(nextValue);
    return;
  }
  const startedAt = performance.now();
  const duration = 420;
  const tick = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - ((1 - progress) ** 3);
    element.textContent = formatter(previousValue + ((nextValue - previousValue) * eased));
    if (progress < 1) metricFrames.set(element, window.requestAnimationFrame(tick));
  };
  metricFrames.set(element, window.requestAnimationFrame(tick));
}

function renderRecommendationDeltas(previous, current) {
  const panel = document.querySelector("#result-deltas");
  if (!previous || previous.buildId === current.buildId) {
    panel.hidden = true;
    panel.innerHTML = "";
    componentChanges.hidden = true;
    componentChanges.innerHTML = "";
    return;
  }
  const previousGoals = previous.requirementChecks.filter((check) => check.pass).length;
  const currentGoals = current.requirementChecks.filter((check) => check.pass).length;
  const deltas = [
    { label: "Cost", value: current.total - previous.total, format: (value) => `${value > 0 ? "+" : "−"}${formatMoney(Math.abs(value))}`, better: (value) => value < 0 },
    { label: "Power", value: current.platformWatts - previous.platformWatts, format: (value) => `${value > 0 ? "+" : "−"}${Math.abs(value)}W`, better: (value) => value < 0 },
    { label: "Upgrade", value: current.upgradeReadiness.score - previous.upgradeReadiness.score, format: (value) => `${value > 0 ? "+" : ""}${value}pts`, better: (value) => value > 0 },
    { label: "Goals", value: currentGoals - previousGoals, format: (value) => `${value > 0 ? "+" : ""}${value}`, better: (value) => value > 0 },
  ].filter((delta) => delta.value !== 0);
  panel.hidden = deltas.length === 0;
  panel.innerHTML = deltas.map((delta) =>
    `<span class="${delta.better(delta.value) ? "is-better" : "is-tradeoff"}">${delta.label} ${delta.format(delta.value)}</span>`,
  ).join("");
  const changedParts = Object.keys(current.parts).filter((type) => current.parts[type].id !== previous.parts[type].id);
  componentChanges.hidden = changedParts.length === 0;
  componentChanges.innerHTML = changedParts.length === 0 ? "" : `
    <span>${changedParts.length} component${changedParts.length === 1 ? "" : "s"} changed</span>
    ${changedParts.map((type) => `<button type="button" data-changed-part="${type}">${type === "motherboard" ? "Board" : type} · inspect</button>`).join("")}
  `;
}

componentChanges.addEventListener("click", (event) => {
  const button = event.target.closest("[data-changed-part]");
  if (!button) return;
  const partButton = partsList.querySelector(`[aria-controls="part-inspection-${button.dataset.changedPart}"]`);
  const inspection = document.querySelector(`#part-inspection-${button.dataset.changedPart}`);
  partFilter.value = "";
  filterParts();
  partButton.setAttribute("aria-expanded", "true");
  inspection.hidden = false;
  partButton.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
  partButton.focus({ preventScroll: true });
});

pinBaselineButton.addEventListener("click", () => {
  if (!latestRecommendation) return;
  baselineRecommendation = latestRecommendation;
  pinBaselineButton.textContent = "Update baseline";
  clearBaselineButton.hidden = false;
  baselineStatus.textContent = `Pinned ${baselineRecommendation.buildId}. Future results compare with this build.`;
  renderRecommendationDeltas(baselineRecommendation, latestRecommendation);
  showToast("Comparison baseline pinned.");
});

clearBaselineButton.addEventListener("click", () => {
  baselineRecommendation = undefined;
  pinBaselineButton.textContent = "Pin current build";
  clearBaselineButton.hidden = true;
  baselineStatus.textContent = "Comparing each new result with the previous build.";
  document.querySelector("#result-deltas").hidden = true;
  componentChanges.hidden = true;
  showToast("Comparison baseline cleared.");
});

function renderRecentBuilds() {
  recentBuildCount.textContent = String(recentBuilds.length);
  clearRecentBuildsButton.disabled = recentBuilds.length === 0;
  recentBuildList.innerHTML = recentBuilds.length === 0
    ? "<p>No builds in this session yet.</p>"
    : recentBuilds.map((entry, index) => `
      <div class="recent-build-entry">
        <button class="recent-build-main" type="button" data-recent-build="${index}">
          <strong>${entry.profileLabel} · ${formatMoney(entry.total)}</strong>
          <span>${entry.resolution} / ${entry.useCase}</span>
          <code>${entry.buildId}</code>
        </button>
        <button class="recent-build-remove" type="button" data-remove-recent-build="${index}" aria-label="Remove ${entry.buildId} from recent builds">×</button>
      </div>
    `).join("");
}

function saveRecentBuilds() {
  try { sessionStorage.setItem(RECENT_BUILDS_KEY, JSON.stringify(recentBuilds)); } catch { /* keep in memory */ }
  renderRecentBuilds();
}

function recordRecentBuild(recommendation, constraints) {
  const signature = JSON.stringify({ constraints, profile: activeProfile, goal: fields.goal.value });
  const profileLabel = { balanced: "Balanced", performance: "Max performance", value: "Best value" }[activeProfile];
  recentBuilds = [{ signature, profile: activeProfile, profileLabel, goal: fields.goal.value, constraints, total: recommendation.total, buildId: recommendation.buildId, resolution: constraints.resolution, useCase: constraints.useCase },
    ...recentBuilds.filter((entry) => entry.signature !== signature)].slice(0, 5);
  saveRecentBuilds();
}

recentBuildList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-recent-build]");
  if (removeButton) {
    const [removed] = recentBuilds.splice(Number(removeButton.dataset.removeRecentBuild), 1);
    saveRecentBuilds();
    if (removed) showToast(`${removed.buildId} removed from recent builds.`);
    return;
  }
  const button = event.target.closest("[data-recent-build]");
  if (!button) return;
  const entry = recentBuilds[Number(button.dataset.recentBuild)];
  if (!entry) return;
  fields.goal.value = entry.goal;
  for (const [key, value] of Object.entries(entry.constraints)) fields[key].value = value;
  fields.budgetRange.value = entry.constraints.budget;
  activeProfile = entry.profile;
  updateGoalFeedback();
  render(entry.constraints, { announce: true });
  setWorkspaceView("results");
  showToast(`Restored ${entry.profileLabel.toLowerCase()} build.`);
});

clearRecentBuildsButton.addEventListener("click", () => {
  recentBuilds = [];
  saveRecentBuilds();
  showToast("Recent build history cleared.");
});

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

function updateGoalFeedback() {
  const length = fields.goal.value.trim().length;
  const remaining = Math.max(0, 12 - length);
  goalCount.textContent = `${length} character${length === 1 ? "" : "s"}`;
  goalGuidance.textContent = remaining > 0
    ? `Add ${remaining} more character${remaining === 1 ? "" : "s"} to generate.`
    : "Ready to parse workload and priorities.";
  goalGuidance.classList.toggle("is-incomplete", remaining > 0);
}

const fieldLabels = {
  goal: "Goal text", budget: "Budget", useCase: "Workload", resolution: "Target", priority: "Priority",
  memoryTarget: "Memory", storageTarget: "Storage", noiseTarget: "Noise", vramTarget: "VRAM",
  coreTarget: "CPU cores", powerTarget: "Power", caseTarget: "Case size",
};

function renderChangedFields() {
  if (!latestFormState) {
    changedFields.hidden = true;
    return 0;
  }
  const current = { goal: fields.goal.value, ...currentConstraints() };
  const changed = Object.keys(fieldLabels).filter((key) => String(current[key]) !== String(latestFormState[key]));
  changedFields.hidden = changed.length === 0;
  changedFieldsList.innerHTML = changed.map((key) =>
    `<button type="button" data-restore-field="${key}">${fieldLabels[key]} · restore</button>`,
  ).join("");
  return changed.length;
}

changedFieldsList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-restore-field]");
  if (!button || !latestFormState) return;
  const key = button.dataset.restoreField;
  fields[key].value = latestFormState[key];
  if (key === "budget") fields.budgetRange.value = latestFormState.budget;
  if (key === "goal") updateGoalFeedback();
  updateAdvancedCount();
  setResultStale(renderChangedFields() > 0);
  showToast(`${fieldLabels[key]} restored.`);
});

fields.goal.addEventListener("input", updateGoalFeedback);
updateGoalFeedback();

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
  advancedResetStatus.textContent = activeCount === 0
    ? "Using automatic part targets."
    : `${activeCount} manual target${activeCount === 1 ? "" : "s"} active.`;
  resetAdvancedButton.disabled = activeCount === 0;
}

resetAdvancedButton.addEventListener("click", () => {
  for (const field of [fields.memoryTarget, fields.storageTarget, fields.noiseTarget, fields.vramTarget, fields.coreTarget, fields.powerTarget, fields.caseTarget]) {
    field.value = "auto";
  }
  updateAdvancedCount();
  updateConfigReadiness();
  setResultStale(renderChangedFields() > 0);
  showToast("Advanced constraints reset to automatic.");
});

function updateConfigReadiness() {
  const goalReady = fields.goal.value.trim().length >= 12;
  const budget = Number(fields.budget.value);
  const budgetReady = Number.isFinite(budget) && budget >= 800 && budget <= 5000;
  const manualTargets = [fields.memoryTarget, fields.storageTarget, fields.noiseTarget, fields.vramTarget, fields.coreTarget, fields.powerTarget, fields.caseTarget]
    .filter((field) => field.value !== "auto").length;
  readinessGoal.textContent = goalReady ? "Ready" : "Needs detail";
  readinessBudget.textContent = budgetReady ? formatMoney(budget) : "$800–$5,000";
  readinessAdvanced.textContent = manualTargets === 0 ? "Automatic" : `${manualTargets} manual`;
  readinessGoal.closest("button").classList.toggle("is-warning", !goalReady);
  readinessBudget.closest("button").classList.toggle("is-warning", !budgetReady);
}

readinessItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-readiness-target]");
  if (!button) return;
  if (button.dataset.readinessTarget === "goal") fields.goal.focus();
  if (button.dataset.readinessTarget === "budget") fields.budget.focus();
  if (button.dataset.readinessTarget === "advanced") {
    document.querySelector("#advanced-controls").open = true;
    fields.memoryTarget.focus();
  }
});
updateConfigReadiness();

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

if (canTrackPointer) {
  for (const card of metricCards) {
    card.addEventListener("pointermove", (event) => {
      if (!motionEnabled) return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--metric-tilt-x", `${(0.5 - y) * 3}deg`);
      card.style.setProperty("--metric-tilt-y", `${(x - 0.5) * 4}deg`);
    }, { passive: true });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--metric-tilt-x", "0deg");
      card.style.setProperty("--metric-tilt-y", "0deg");
    });
  }
}

function resetPointerEffects() {
  root.style.setProperty("--pointer-x", "50vw");
  root.style.setProperty("--pointer-y", "24vh");
  root.style.setProperty("--pointer-shift-x", "0px");
  root.style.setProperty("--pointer-shift-y", "0px");
  root.style.setProperty("--pointer-shift-inverse-x", "0px");
  root.style.setProperty("--pointer-shift-inverse-y", "0px");
  for (const card of metricCards) {
    card.style.setProperty("--metric-tilt-x", "0deg");
    card.style.setProperty("--metric-tilt-y", "0deg");
  }
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
  mobilePrimaryAction.dataset.action = view === "configure" ? "generate" : "edit";
  mobilePrimaryAction.textContent = view === "configure" ? "Generate recommendation" : "Edit build inputs";
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

mobilePrimaryAction.addEventListener("click", () => {
  if (mobilePrimaryAction.dataset.action === "generate") {
    if (form.reportValidity()) form.requestSubmit();
  } else {
    setWorkspaceView("configure");
    fields.goal.focus();
  }
});

let swipeStart;
workspace.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch" || !window.matchMedia("(max-width: 900px)").matches) return;
  swipeStart = { x: event.clientX, y: event.clientY };
}, { passive: true });
workspace.addEventListener("pointerup", (event) => {
  if (!swipeStart || event.pointerType !== "touch") return;
  const horizontal = event.clientX - swipeStart.x;
  const vertical = Math.abs(event.clientY - swipeStart.y);
  swipeStart = undefined;
  if (Math.abs(horizontal) < 80 || vertical > 55) return;
  const view = horizontal < 0 ? "results" : "configure";
  setWorkspaceView(view);
  resultStatus.textContent = view === "results" ? "Recommendation view selected." : "Configuration view selected.";
});
workspace.addEventListener("pointercancel", () => { swipeStart = undefined; });

for (const button of workspaceViewButtons) {
  button.addEventListener("click", () => setWorkspaceView(button.dataset.workspaceView, { focus: true }));
}

function signalResultUpdate({ complete = false } = {}) {
  resultsPanel.classList.remove("is-updating");
  void resultsPanel.offsetWidth;
  resultsPanel.classList.add("is-updating");
  resultsPanel.setAttribute("aria-busy", "true");
  resultsPanel.querySelector(".results-loading-indicator strong").textContent = complete
    ? "Generating recommendation"
    : "Recalculating build";
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
  revertInputsButton.disabled = !stale || !latestFormState;
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

function filterParts() {
  const query = partFilter.value.trim().toLowerCase();
  const cards = [...partsList.querySelectorAll(".part-card")];
  let visible = 0;
  for (const card of cards) {
    const match = !query || card.textContent.toLowerCase().includes(query);
    card.hidden = !match;
    if (match) visible += 1;
  }
  partFilterStatus.textContent = query
    ? `${visible} of ${cards.length} components match “${partFilter.value.trim()}”.`
    : `${cards.length} components selected.`;
  partFilterEmpty.hidden = !query || visible > 0;
}

function sortParts() {
  const cards = [...partsList.querySelectorAll(".part-card")];
  cards.sort((a, b) => {
    if (partSort.value === "price-high") return Number(b.dataset.price) - Number(a.dataset.price);
    if (partSort.value === "price-low") return Number(a.dataset.price) - Number(b.dataset.price);
    return Number(a.dataset.buildOrder) - Number(b.dataset.buildOrder);
  });
  for (const card of cards) partsList.append(card);
  filterParts();
}

function focusPartFilter() {
  setWorkspaceView("results");
  partFilter.focus();
  partFilter.select();
}

partFilter.addEventListener("input", filterParts);
partSort.addEventListener("change", () => {
  sortParts();
  const label = partSort.selectedOptions[0].textContent;
  partFilterStatus.textContent = `${partsList.querySelectorAll(".part-card:not([hidden])").length} components · ${label}.`;
  showToast(`Components sorted by ${label.toLowerCase()}.`);
});
clearPartFilterButton.addEventListener("click", () => {
  partFilter.value = "";
  filterParts();
  partFilter.focus();
  showToast("All components are visible.");
});
partFilter.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !partFilter.value) return;
  event.preventDefault();
  partFilter.value = "";
  filterParts();
  showToast("Component filter cleared.");
});

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

partsList.addEventListener("click", async (event) => {
  const copyPartButton = event.target.closest("[data-copy-part]");
  if (copyPartButton) {
    const type = copyPartButton.dataset.copyPart;
    const part = latestRecommendation?.parts[type];
    if (!part) return;
    const label = type === "motherboard" ? "Motherboard" : type.toUpperCase();
    const text = `${label}: ${part.name} — ${formatMoney(part.price)}\n${latestRecommendation.rationales[type]}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} details copied.`);
    } catch {
      showToast("Copy unavailable. Select the component text manually.");
    }
    return;
  }
  const button = event.target.closest(".part-row");
  if (!button) return;
  const details = document.querySelector(`#${button.getAttribute("aria-controls")}`);
  const expanded = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(expanded));
  details.hidden = !expanded;
  syncPartsToggleLabel();
});

partsList.addEventListener("keydown", (event) => {
  const button = event.target.closest(".part-row");
  if (!button || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const rows = [...partsList.querySelectorAll(".part-card:not([hidden]) .part-row")];
  const currentIndex = rows.indexOf(button);
  if (currentIndex < 0) return;
  let nextIndex = currentIndex;
  if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % rows.length;
  if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + rows.length) % rows.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = rows.length - 1;
  event.preventDefault();
  rows[nextIndex].focus();
  rows[nextIndex].scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
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

allocationList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-inspect-part]");
  if (!button) return;
  partFilter.value = "";
  filterParts();
  const type = button.dataset.inspectPart;
  const partButton = partsList.querySelector(`[aria-controls="part-inspection-${type}"]`);
  const inspection = document.querySelector(`#part-inspection-${type}`);
  partButton.setAttribute("aria-expanded", "true");
  inspection.hidden = false;
  partButton.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
  partButton.focus({ preventScroll: true });
  syncPartsToggleLabel();
});

alternativesList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-alternative]");
  if (!button || !latestRecommendation) return;
  const option = latestRecommendation.alternatives[Number(button.dataset.copyAlternative)];
  if (!option) return;
  const text = [
    `AIPO-GPT runner-up · ${option.buildId}`,
    `CPU: ${option.cpu}`,
    `GPU: ${option.gpu}`,
    `Total: ${formatMoney(option.total)}`,
    `Headroom: ${formatMoney(option.headroom)}`,
    `Peak draw: ${option.platformWatts}W`,
    `Goals: ${option.goalsMet}/${option.goalCount}`,
  ].join("\n");
  try {
    await navigator.clipboard.writeText(text);
    showToast("Runner-up configuration copied.");
  } catch {
    showToast("Copy unavailable. Select the runner-up details manually.");
  }
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
  syncBudgetControls();
  updateAdvancedCount();
  renderConstraintChips(constraints);
  const recommendation = recommendBuild(constraints, activeProfile);
  const previousRecommendation = latestRecommendation;
  latestRecommendation = recommendation;
  latestConstraints = constraints;
  latestFormState = { goal: fields.goal.value, profile: activeProfile, ...constraints };
  renderChangedFields();
  updateShareUrl(constraints);
  const parts = Object.entries(recommendation.parts);
  const compatible = recommendation.compatibilityChecks.filter((check) => check.pass).length;
  const goalsMet = recommendation.requirementChecks.filter((check) => check.pass).length;
  renderRecommendationDeltas(baselineRecommendation ?? previousRecommendation, recommendation);

  for (const button of profileButtons) {
    const isActive = button.dataset.profile === activeProfile;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  }

  const profileLabels = {
    balanced: "Balanced",
    performance: "Max performance",
    value: "Best value",
  };
  const profileOptions = Object.entries(profileLabels).map(([profile, label]) => ({
    profile,
    label,
    option: profile === activeProfile ? recommendation : recommendBuild(constraints, profile),
  }));
  const lowestTotal = Math.min(...profileOptions.map(({ option }) => option.total));
  const lowestPower = Math.min(...profileOptions.map(({ option }) => option.platformWatts));
  const highestUpgrade = Math.max(...profileOptions.map(({ option }) => option.upgradeReadiness.score));
  profileImpact.innerHTML = profileOptions.filter(({ profile }) => profile !== activeProfile).map(({ profile, label, option }) => {
    const changedParts = Object.keys(option.parts).filter((type) => option.parts[type].id !== recommendation.parts[type].id);
    const costDelta = option.total - recommendation.total;
    const powerDelta = option.platformWatts - recommendation.platformWatts;
    return `
      <button type="button" data-impact-profile="${profile}">
        <span>${label}</span>
        <strong>${costDelta === 0 ? "Same cost" : `${costDelta > 0 ? "+" : "−"}${formatMoney(Math.abs(costDelta))}`}</strong>
        <small>${changedParts.length} part${changedParts.length === 1 ? "" : "s"} change · ${powerDelta > 0 ? "+" : ""}${powerDelta}W</small>
      </button>
    `;
  }).join("");
  comparisonBody.innerHTML = profileOptions.map(({ profile, label, option }) => {
    const goalsMet = option.requirementChecks.filter((check) => check.pass).length;
    const insights = [
      option.total === lowestTotal ? "Lowest cost" : "",
      option.platformWatts === lowestPower ? "Lowest power" : "",
      option.upgradeReadiness.score === highestUpgrade ? "Most upgrade room" : "",
    ].filter(Boolean);
    return `
      <tr class="${profile === activeProfile ? "is-active" : ""}">
        <th scope="row">
          <button type="button" data-compare-profile="${profile}">${label}</button>
          <span class="profile-insights">${insights.map((insight) => `<small>${insight}</small>`).join("")}</span>
        </th>
        <td data-label="Total">${formatMoney(option.total)}</td>
        <td data-label="CPU">${option.parts.cpu.name}</td>
        <td data-label="GPU">${option.parts.gpu.name}</td>
        <td data-label="Peak draw">${option.platformWatts}W</td>
        <td data-label="Upgrade">${option.upgradeReadiness.score}%</td>
        <td data-label="Goals">${goalsMet}/${option.requirementChecks.length}</td>
      </tr>
    `;
  }).join("");

  document.querySelector("#recommendation-summary").textContent = recommendation.summary;
  animateMetric(document.querySelector("#total-price"), recommendation.total, (value) => formatMoney(Math.round(value)));
  animateMetric(document.querySelector("#budget-headroom"), recommendation.budgetHeadroom, (value) => value >= 0
    ? formatMoney(Math.round(value))
    : `${formatMoney(Math.round(Math.abs(value)))} over`);
  animateMetric(document.querySelector("#peak-power"), recommendation.platformWatts, (value) => `${Math.round(value)}W`);
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
  const totalChecks = recommendation.compatibilityChecks.length + recommendation.requirementChecks.length;
  const fitPercentage = Math.round(((compatible + goalsMet) / totalChecks) * 100);
  document.querySelector("#fit-score").textContent = String(fitPercentage);
  document.querySelector("#compatibility-score-copy").textContent = `${compatible}/${recommendation.compatibilityChecks.length} safe · ${goalsMet}/${recommendation.requirementChecks.length} goals`;
  score.style.setProperty("--fit-score", `${fitPercentage * 3.6}deg`);
  score.dataset.state = fitPercentage === 100 ? "complete" : "attention";
  if (announce) {
    resultStatus.textContent = `Build ready. ${compatible} compatibility checks passed, ${goalsMet} goals met, estimated total ${formatMoney(recommendation.total)}.`;
    document.querySelector("#results-heading").focus();
  }

  partsList.innerHTML = parts.map(([type, part], index) => `
    <article class="part-card" data-price="${part.price}" data-build-order="${index}">
      <button class="part-row" type="button" aria-expanded="false" aria-controls="part-inspection-${type}" aria-keyshortcuts="ArrowUp ArrowDown Home End">
        <span class="part-type">${type === "motherboard" ? "board" : type}</span>
        <span class="part-detail"><span class="part-name">${part.name}</span></span>
        <span class="part-price">${formatMoney(part.price)}</span>
        <span class="part-toggle" aria-hidden="true">+</span>
      </button>
      <div class="part-inspection" id="part-inspection-${type}" hidden>
        <p class="part-reason">${recommendation.rationales[type]}</p>
        <div class="part-inspection-actions">
          <span>${Math.round(recommendation.budgetAllocation[type].percentage * 100)}% of budget</span>
          <button type="button" data-copy-part="${type}">Copy component</button>
        </div>
      </div>
    </article>
  `).join("");
  sortParts();
  syncPartsToggleLabel();

  allocationList.innerHTML = Object.entries(recommendation.budgetAllocation).map(([type, allocation]) => `
    <button class="allocation-row" type="button" data-inspect-part="${type}" data-allocation-price="${recommendation.parts[type].price}" data-allocation-percent="${Math.round(allocation.percentage * 100)}" aria-label="Inspect ${type} allocation">
      <span>${type === "motherboard" ? "board" : type}</span>
      <span class="allocation-track" aria-hidden="true"><span style="width: ${(allocation.percentage * 100).toFixed(1)}%"></span></span>
      <strong>${Math.round(allocation.percentage * 100)}%</strong>
    </button>
  `).join("");
  setAllocationView(activeAllocationView);

  const alternativesPanel = document.querySelector("#alternatives-panel");
  alternativesPanel.hidden = recommendation.alternatives.length === 0;
  alternativesList.innerHTML = recommendation.alternatives.map((alternative, index) => `
    <article class="alternative-row">
      <div><strong>${alternative.cpu}</strong><span>${alternative.gpu}</span></div>
      <div><strong>${formatMoney(alternative.total)}</strong><span>${formatMoney(alternative.headroom)} headroom</span><span>${alternative.platformWatts}W peak · ${alternative.goalsMet}/${alternative.goalCount} goals</span></div>
      <footer><code>${alternative.buildId}</code><button type="button" data-copy-alternative="${index}">Copy option</button></footer>
    </article>
  `).join("");
  syncResultPanelsButton();

  document.querySelector("#explanation-list").innerHTML = recommendation.checks.map((check, index) => `
    <li class="${check.pass ? "is-pass" : "is-warning"}" data-validation-scope="${index < recommendation.compatibilityChecks.length ? "compatibility" : "goals"}">${check.pass ? "✓" : "!"} ${check.label}</li>
  `).join("");
  applyValidationFilter();

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
  recordRecentBuild(recommendation, constraints);
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

shareBuildButton.addEventListener("click", async () => {
  const shareData = {
    title: `AIPO-GPT ${activeProfile} build`,
    text: `${latestRecommendation.summary} Estimated total: ${formatMoney(latestRecommendation.total)}.`,
    url: window.location.href,
  };
  try {
    if (typeof navigator.share === "function") {
      await navigator.share(shareData);
      exportStatus.textContent = "Build shared.";
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      exportStatus.textContent = "Sharing is unavailable here, so the build link was copied.";
    }
  } catch (error) {
    if (error?.name !== "AbortError") exportStatus.textContent = "Sharing was blocked by the browser.";
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

revertInputsButton.addEventListener("click", () => {
  if (!latestFormState) return;
  fields.goal.value = latestFormState.goal;
  fields.budget.value = latestFormState.budget;
  fields.budgetRange.value = latestFormState.budget;
  fields.useCase.value = latestFormState.useCase;
  fields.resolution.value = latestFormState.resolution;
  fields.priority.value = latestFormState.priority;
  fields.memoryTarget.value = latestFormState.memoryTarget;
  fields.storageTarget.value = latestFormState.storageTarget;
  fields.noiseTarget.value = latestFormState.noiseTarget;
  fields.vramTarget.value = latestFormState.vramTarget;
  fields.coreTarget.value = latestFormState.coreTarget;
  fields.powerTarget.value = latestFormState.powerTarget;
  fields.caseTarget.value = latestFormState.caseTarget;
  activeProfile = latestFormState.profile;
  updateAdvancedCount();
  setResultStale(false);
  renderChangedFields();
  showToast("Inputs restored to the visible recommendation.");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";
  setWorkspaceView("results");
  render(syncGoalToFields(), { announce: true });
});

form.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    if (form.reportValidity()) form.requestSubmit();
  }
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
  updateConfigReadiness();
  setResultStale(renderChangedFields() > 0);
});

form.addEventListener("change", () => {
  updateAdvancedCount();
  updateConfigReadiness();
});

fields.budgetRange.addEventListener("input", () => {
  fields.budget.value = fields.budgetRange.value;
  syncBudgetControls();
});

fields.budget.addEventListener("input", () => {
  const budget = Number(fields.budget.value);
  if (Number.isFinite(budget) && budget >= 800 && budget <= 5000) fields.budgetRange.value = budget;
  syncBudgetControls();
});

function syncBudgetControls() {
  const budget = Math.min(5000, Math.max(800, Number(fields.budget.value) || 800));
  const percentage = ((budget - 800) / (5000 - 800)) * 100;
  fields.budgetRange.style.setProperty("--budget-fill", `${percentage}%`);
  for (const button of budgetPresetButtons) {
    const active = Number(button.dataset.budgetPreset) === budget;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

for (const button of budgetAdjustButtons) {
  button.addEventListener("click", () => {
    const current = Number(fields.budget.value) || DEFAULT_STATE.budget;
    const next = Math.min(5000, Math.max(800, current + Number(button.dataset.budgetAdjust)));
    fields.budget.value = next;
    fields.budgetRange.value = next;
    fields.budget.dispatchEvent(new Event("input", { bubbles: true }));
    fields.budget.focus();
  });
}

for (const button of budgetPresetButtons) {
  button.addEventListener("click", () => {
    fields.budget.value = button.dataset.budgetPreset;
    fields.budgetRange.value = button.dataset.budgetPreset;
    fields.budget.dispatchEvent(new Event("input", { bubbles: true }));
    showToast(`${button.textContent} budget selected.`);
  });
}

for (const button of profileButtons) {
  button.addEventListener("click", () => {
    activeProfile = button.dataset.profile;
    render(currentConstraints());
  });
  button.addEventListener("keydown", (event) => {
    const currentIndex = profileButtons.indexOf(button);
    let nextIndex = currentIndex;
    if (["ArrowRight", "ArrowDown"].includes(event.key)) nextIndex = (currentIndex + 1) % profileButtons.length;
    else if (["ArrowLeft", "ArrowUp"].includes(event.key)) nextIndex = (currentIndex - 1 + profileButtons.length) % profileButtons.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = profileButtons.length - 1;
    else return;
    event.preventDefault();
    profileButtons[nextIndex].focus();
    profileButtons[nextIndex].click();
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

profileImpact.addEventListener("click", (event) => {
  const button = event.target.closest("[data-impact-profile]");
  if (!button) return;
  activeProfile = button.dataset.impactProfile;
  render(currentConstraints());
  showToast(`${button.querySelector("span").textContent} profile applied.`);
});

const hasSavedBuild = Boolean(readSavedBuild());
loadLocalButton.disabled = !hasSavedBuild;
clearLocalButton.disabled = !hasSavedBuild;
render(restoreFromUrl(syncGoalToFields()));
