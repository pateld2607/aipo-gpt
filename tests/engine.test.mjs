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

assert.equal(parseGoal("A 1440p gaming PC around $1.8k", fallback).budget, 1800);
assert.equal(parseGoal("Workstation budget is 2.6 grand", fallback).budget, 2600);
assert.equal(parseGoal("Maximum performance under $7k", fallback).budget, 5000);

for (const budget of [1200, 1800, 3000]) {
  for (const useCase of ["gaming", "streaming", "workstation", "efficiency"]) {
    for (const resolution of ["1080p", "1440p", "4k", "productivity"]) {
      for (const priority of ["balanced", "performance", "quiet", "efficiency"]) {
        const constraints = { budget, useCase, resolution, priority };

        for (const profile of ["balanced", "performance", "value"]) {
          const result = recommendBuild(constraints, profile);
          assert.equal(Object.keys(result.parts).length, 8);
          assert.equal(Object.keys(result.rationales).length, 8);
          assert.ok(Object.values(result.rationales).every((reason) => reason.length > 25));
          assert.ok(["Limited", "Moderate", "Strong"].includes(result.upgradeReadiness.label));
          assert.equal(result.upgradeReadiness.score % 25, 0);
          assert.ok(["Quiet", "Balanced", "Performance"].includes(result.acoustics.label));
          assert.equal(result.acoustics.decibels, result.parts.cooler.noise);
          assert.equal(Object.keys(result.budgetAllocation).length, 8);
          assert.ok(Math.abs(Object.values(result.budgetAllocation).reduce((sum, item) => sum + item.percentage, 0) - 1) < 0.000001);
          assert.equal(result.compatibilityChecks.length, 8);
          assert.equal(result.requirementChecks.length, 6);
          assert.ok(result.compatibilityChecks.every((check) => check.pass));
          assert.ok(result.parts.gpu.vram >= 12);
          assert.ok(result.parts.psu.capacity >= result.platformWatts * 1.35);
          assert.ok(result.parts.case.gpuSlots >= result.parts.gpu.slots);
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

const unconstrainedWorkstation = recommendBuild({
  budget: 3000,
  useCase: "workstation",
  resolution: "4k",
  priority: "performance",
});
assert.ok(unconstrainedWorkstation.requirementChecks.every((check) => check.pass));
assert.equal(unconstrainedWorkstation.parts.gpu.vram, 16);

const constrainedWorkstation = recommendBuild({
  budget: 1200,
  useCase: "workstation",
  resolution: "4k",
  priority: "performance",
});
assert.ok(constrainedWorkstation.requirementChecks.some((check) => !check.pass));
assert.equal(constrainedWorkstation.goalFit < 1, true);

console.log("engine tests passed");
