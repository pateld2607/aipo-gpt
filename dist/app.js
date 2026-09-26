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
};
const profileButtons = [...document.querySelectorAll("[data-profile]")];
const presetButtons = [...document.querySelectorAll("[data-preset]")];
const copyButton = document.querySelector("#copy-build");
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
let activeProfile = "balanced";
let latestRecommendation;
let latestConstraints;

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
  };
}

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
    if (!ALLOWED_OPTIONS.useCase.has(saved.useCase)
      || !ALLOWED_OPTIONS.resolution.has(saved.resolution)
      || !ALLOWED_OPTIONS.priority.has(saved.priority)
      || !ALLOWED_OPTIONS.profile.has(saved.profile)
      || !ALLOWED_OPTIONS.memoryTarget.has(memoryTarget)
      || !ALLOWED_OPTIONS.storageTarget.has(storageTarget)
      || !ALLOWED_OPTIONS.noiseTarget.has(noiseTarget)
      || !ALLOWED_OPTIONS.vramTarget.has(vramTarget)
      || !ALLOWED_OPTIONS.coreTarget.has(coreTarget)
      || !ALLOWED_OPTIONS.powerTarget.has(powerTarget)) return null;
    return { ...saved, budget, memoryTarget, storageTarget, noiseTarget, vramTarget, coreTarget, powerTarget };
  } catch {
    return null;
  }
}

function render(constraints, { announce = false } = {}) {
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
  document.querySelector("#build-id").textContent = recommendation.buildId;
  document.querySelector("#search-stats").textContent = `${recommendation.searchStats.evaluated.toLocaleString()} combinations checked · ${recommendation.searchStats.compatible.toLocaleString()} compatible · ${recommendation.searchStats.affordable.toLocaleString()} within budget`;
  document.querySelector("#balance-score").textContent = `${recommendation.componentBalance.label} · ${recommendation.componentBalance.score}% balance`;
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

  document.querySelector("#parts-list").innerHTML = parts.map(([type, part]) => `
    <div class="part-row">
      <span class="part-type">${type === "motherboard" ? "board" : type}</span>
      <span class="part-detail">
        <span class="part-name">${part.name}</span>
        <span class="part-reason">${recommendation.rationales[type]}</span>
      </span>
      <span class="part-price">${formatMoney(part.price)}</span>
    </div>
  `).join("");

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
      && ALLOWED_OPTIONS.powerTarget.has(powerTarget);
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
    activeProfile = payload.profile;
    render({ ...constraints, budget, memoryTarget, storageTarget, noiseTarget, vramTarget, coreTarget, powerTarget }, { announce: true });
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
  });
  resultStatus.textContent = "Optimizer defaults restored.";
  fields.goal.focus();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";
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
});

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
