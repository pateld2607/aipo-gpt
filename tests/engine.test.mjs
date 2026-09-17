import assert from "node:assert/strict";
import { parseGoal, recommendBuild } from "../dist/engine.js";

const fallback = { budget: 1400, useCase: "gaming", resolution: "1080p", priority: "balanced" };

const parsed = parseGoal("Quiet 4K workstation around $2,600", fallback);
assert.deepEqual(parsed, {
  budget: 2600,
  useCase: "workstation",
  resolution: "4k",
  priority: "quiet",
});

const resolutionNotBudget = parseGoal(
  "A quiet 1440p gaming PC around $1,800 with room for streaming.",
  fallback,
);
assert.equal(resolutionNotBudget.budget, 1800);
assert.equal(resolutionNotBudget.resolution, "1440p");

for (const constraints of [
  fallback,
  { budget: 1800, useCase: "streaming", resolution: "1440p", priority: "quiet" },
  { budget: 3000, useCase: "workstation", resolution: "4k", priority: "performance" },
]) {
  const result = recommendBuild(constraints);
  assert.equal(Object.keys(result.parts).length, 8);
  assert.ok(result.checks.slice(0, 7).every((check) => check.pass));
  assert.ok(result.parts.psu.capacity >= result.platformWatts * 1.35);
  assert.ok(result.total <= constraints.budget);
}

console.log("engine tests passed");
