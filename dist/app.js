import { parseGoal, recommendBuild } from "./engine.js";

const form = document.querySelector("#optimizer-form");
const fields = {
  goal: document.querySelector("#goal"),
  budget: document.querySelector("#budget"),
  useCase: document.querySelector("#use-case"),
  resolution: document.querySelector("#resolution"),
  priority: document.querySelector("#priority"),
};

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

function render(constraints) {
  const recommendation = recommendBuild(constraints);
  const parts = Object.entries(recommendation.parts);
  const passed = recommendation.checks.filter((check) => check.pass).length;

  document.querySelector("#recommendation-summary").textContent = recommendation.summary;
  document.querySelector("#total-price").textContent = formatMoney(recommendation.total);
  document.querySelector("#budget-headroom").textContent = recommendation.budgetHeadroom >= 0
    ? formatMoney(recommendation.budgetHeadroom)
    : `${formatMoney(Math.abs(recommendation.budgetHeadroom))} over`;
  document.querySelector("#peak-power").textContent = `${recommendation.platformWatts}W`;

  const score = document.querySelector("#compatibility-score");
  score.textContent = `${passed}/${recommendation.checks.length} compatible`;
  score.style.color = passed === recommendation.checks.length ? "var(--acid)" : "var(--danger)";

  document.querySelector("#parts-list").innerHTML = parts.map(([type, part]) => `
    <div class="part-row">
      <span class="part-type">${type === "motherboard" ? "board" : type}</span>
      <span class="part-name">${part.name}</span>
      <span class="part-price">${formatMoney(part.price)}</span>
    </div>
  `).join("");

  document.querySelector("#explanation-list").innerHTML = recommendation.checks.map((check) => `
    <li>${check.pass ? "✓" : "!"} ${check.label}</li>
  `).join("");

  document.querySelector("#parsed-goal").textContent = `constraints = ${JSON.stringify(constraints)}`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  render(syncGoalToFields());
});

render(syncGoalToFields());
