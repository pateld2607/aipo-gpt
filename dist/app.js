import { parseGoal, recommendBuild } from "./engine.js";

const form = document.querySelector("#optimizer-form");
const fields = {
  goal: document.querySelector("#goal"),
  budget: document.querySelector("#budget"),
  useCase: document.querySelector("#use-case"),
  resolution: document.querySelector("#resolution"),
  priority: document.querySelector("#priority"),
};
const profileButtons = [...document.querySelectorAll("[data-profile]")];
const presetButtons = [...document.querySelectorAll("[data-preset]")];
const copyButton = document.querySelector("#copy-build");
const copyLinkButton = document.querySelector("#copy-link");
const downloadButton = document.querySelector("#download-build");
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
  };
}

function syncGoalToFields() {
  const parsed = parseGoal(fields.goal.value, currentConstraints());
  fields.budget.value = parsed.budget;
  fields.useCase.value = parsed.useCase;
  fields.resolution.value = parsed.resolution;
  fields.priority.value = parsed.priority;
  return parsed;
}

function updateShareUrl(constraints) {
  const params = new URLSearchParams({
    budget: String(constraints.budget),
    useCase: constraints.useCase,
    resolution: constraints.resolution,
    priority: constraints.priority,
    profile: activeProfile,
    goal: fields.goal.value.trim(),
  });
  history.replaceState(null, "", `${location.pathname}?${params}`);
}

function restoreFromUrl(fallback) {
  const params = new URLSearchParams(location.search);
  const allowed = {
    useCase: new Set(["gaming", "streaming", "workstation", "development", "efficiency"]),
    resolution: new Set(["1080p", "1440p", "4k", "productivity"]),
    priority: new Set(["balanced", "performance", "quiet", "efficiency"]),
    profile: new Set(["balanced", "performance", "value"]),
  };
  const budget = Number(params.get("budget"));
  const restored = {
    budget: Number.isFinite(budget) && budget >= 800 && budget <= 5000 ? budget : fallback.budget,
    useCase: allowed.useCase.has(params.get("useCase")) ? params.get("useCase") : fallback.useCase,
    resolution: allowed.resolution.has(params.get("resolution")) ? params.get("resolution") : fallback.resolution,
    priority: allowed.priority.has(params.get("priority")) ? params.get("priority") : fallback.priority,
  };
  if (allowed.profile.has(params.get("profile"))) activeProfile = params.get("profile");
  if (params.get("goal")) fields.goal.value = params.get("goal");
  fields.budget.value = restored.budget;
  fields.useCase.value = restored.useCase;
  fields.resolution.value = restored.resolution;
  fields.priority.value = restored.priority;
  return restored;
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
  document.querySelector("#build-id").textContent = recommendation.buildId;
  document.querySelector("#search-stats").textContent = `${recommendation.searchStats.evaluated.toLocaleString()} combinations checked · ${recommendation.searchStats.compatible.toLocaleString()} compatible · ${recommendation.searchStats.affordable.toLocaleString()} within budget`;

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

  document.querySelector("#explanation-list").innerHTML = recommendation.checks.map((check) => `
    <li class="${check.pass ? "is-pass" : "is-warning"}">${check.pass ? "✓" : "!"} ${check.label}</li>
  `).join("");

  const warningPanel = document.querySelector("#shortfall-panel");
  warningPanel.hidden = recommendation.shortfalls.length === 0;
  document.querySelector("#shortfall-list").innerHTML = recommendation.shortfalls.map((advice) => `<li>${advice}</li>`).join("");

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

render(restoreFromUrl(syncGoalToFields()));
