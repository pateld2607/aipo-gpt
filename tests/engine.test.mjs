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

for (const budget of [1200, 1800, 3000]) {
  for (const useCase of ["gaming", "streaming", "workstation", "efficiency"]) {
    for (const resolution of ["1080p", "1440p", "4k", "productivity"]) {
      for (const priority of ["balanced", "performance", "quiet", "efficiency"]) {
        const constraints = { budget, useCase, resolution, priority };

        for (const profile of ["balanced", "performance", "value"]) {
          const result = recommendBuild(constraints, profile);
          assert.equal(Object.keys(result.parts).length, 8);
          assert.equal(result.checks.length, 8);
          assert.ok(result.checks.every((check) => check.pass));
          assert.ok(result.parts.psu.capacity >= result.platformWatts * 1.35);
          assert.ok(result.total <= constraints.budget);
        }
      }
    }
  }
}

const comparisonConstraints = {
  budget: 1800,
  useCase: "streaming",
  resolution: "1440p",
  priority: "balanced",
};
const performanceBuild = recommendBuild(comparisonConstraints, "performance");
const valueBuild = recommendBuild(comparisonConstraints, "value");
assert.ok(performanceBuild.parts.gpu.tier >= valueBuild.parts.gpu.tier);
assert.throws(() => recommendBuild(comparisonConstraints, "unknown"), RangeError);

console.log("engine tests passed");
