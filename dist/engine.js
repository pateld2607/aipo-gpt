import { catalog } from "./data.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function parseGoal(goal, fallback) {
  const text = goal.toLowerCase();
  const amount = text.match(/\$\s*([\d,.]+)/)
    ?? text.match(/(?:budget|around|under|up to)\s*(?:of|is|about)?\s*\$?\s*([\d,.]+)/);
  const parsedBudget = amount ? Number(amount[1].replace(/[,.]/g, "")) : fallback.budget;

  let useCase = fallback.useCase;
  if (/render|editing|creative|workstation|cad|modeling/.test(text)) useCase = "workstation";
  else if (/stream/.test(text)) useCase = "streaming";
  else if (/efficient|everyday|office|school/.test(text)) useCase = "efficiency";
  else if (/game|gaming|fps/.test(text)) useCase = "gaming";

  let resolution = fallback.resolution;
  if (/4k|2160p/.test(text)) resolution = "4k";
  else if (/1440p|2k/.test(text)) resolution = "1440p";
  else if (/1080p|full hd/.test(text)) resolution = "1080p";
  else if (/productivity|office|school/.test(text)) resolution = "productivity";

  let priority = fallback.priority;
  if (/quiet|silent|low noise/.test(text)) priority = "quiet";
  else if (/efficient|low power|power saving/.test(text)) priority = "efficiency";
  else if (/fastest|max|peak performance/.test(text)) priority = "performance";

  return {
    budget: clamp(parsedBudget, 800, 5000),
    useCase,
    resolution,
    priority,
  };
}

function chooseTier(constraints) {
  const budgetTier = constraints.budget >= 2500 ? 5 : constraints.budget >= 1750 ? 4 : constraints.budget >= 1200 ? 3 : 2;
  const resolutionLift = constraints.resolution === "4k" ? 1 : constraints.resolution === "1080p" ? -1 : 0;
  const workloadLift = constraints.useCase === "workstation" ? 1 : 0;
  return clamp(budgetTier + resolutionLift + workloadLift, 2, 6);
}

const PROFILES = new Set(["balanced", "performance", "value"]);

function targetsFor(constraints, profile) {
  const tier = chooseTier(constraints);
  const performance = constraints.priority === "performance";
  const workstation = constraints.useCase === "workstation";
  const profileLift = profile === "performance" ? 1 : profile === "value" ? -1 : 0;

  return {
    cpu: clamp(tier + (workstation ? 1 : 0) - (constraints.useCase === "gaming" ? 1 : 0) + profileLift, 2, 5),
    gpu: clamp(tier + (performance ? 1 : 0) + profileLift, 2, 6),
    motherboard: clamp(tier + profileLift, 2, 4),
    memory: workstation || constraints.budget >= 2300 ? 4 : 2,
    storage: constraints.budget >= 1450 && profile !== "value" ? 4 : 2,
  };
}

function technicalChecks(parts, platformWatts) {
  return [
    { label: "CPU socket matches the motherboard", pass: parts.cpu.socket === parts.motherboard.socket },
    { label: "CPU and motherboard share a memory standard", pass: parts.cpu.memory === parts.motherboard.memory },
    { label: "RAM matches the motherboard", pass: parts.memory.memory === parts.motherboard.memory },
    { label: "Cooler capacity covers CPU package power", pass: parts.cooler.capacity >= parts.cpu.watts * 1.25 },
    { label: "Motherboard form factor fits the case", pass: parts.case.forms.includes(parts.motherboard.form) },
    { label: "GPU length fits with safety clearance", pass: parts.case.gpuClearance >= parts.gpu.length + 15 },
    { label: "PSU provides at least 35% power headroom", pass: parts.psu.capacity >= platformWatts * 1.35 },
  ];
}

function candidateScore(candidate, constraints, profile, targets) {
  const { parts, total, platformWatts } = candidate;
  const cpuWeight = constraints.useCase === "workstation" ? 1.8 : constraints.useCase === "streaming" ? 1.35 : 1;
  const gpuWeight = constraints.resolution === "4k" ? 2 : constraints.resolution === "1440p" ? 1.65 : 1.25;
  const performance = parts.cpu.tier * cpuWeight + parts.gpu.tier * gpuWeight + parts.memory.tier * .28 + parts.storage.tier * .18;
  const workloadFit = (parts.cpu.strengths.includes(constraints.useCase) ? 2.2 : 0)
    + (parts.gpu.strengths.includes(constraints.resolution) ? 2.4 : 0)
    + (parts.gpu.strengths.includes(constraints.useCase) ? 1.6 : 0);
  const targetFit = -Math.abs(parts.cpu.tier - targets.cpu) * 1.8
    - Math.abs(parts.gpu.tier - targets.gpu) * 2.4
    - Math.abs(parts.motherboard.tier - targets.motherboard) * .35
    - Math.abs(parts.memory.tier - targets.memory) * .5
    - Math.abs(parts.storage.tier - targets.storage) * .35;
  const budgetUse = total / constraints.budget;
  const quietBonus = constraints.priority === "quiet" ? (35 - parts.cooler.noise) * .28 : 0;
  const efficiencyBonus = constraints.priority === "efficiency" ? (750 - platformWatts) / 80 : 0;

  if (profile === "performance") {
    return performance * 4.2 + workloadFit * 1.5 + targetFit - Math.abs(1 - budgetUse) * 2 + quietBonus + efficiencyBonus;
  }

  if (profile === "value") {
    return performance * 6 / (total / 1000) + workloadFit + targetFit * .45 + Math.max(0, 1 - budgetUse) * 2 + quietBonus + efficiencyBonus;
  }

  return performance * 2.1 + workloadFit * 1.7 + targetFit - Math.abs(.9 - budgetUse) * 3 + quietBonus + efficiencyBonus;
}

function enumerateCandidates(constraints, profile) {
  const targets = targetsFor(constraints, profile);
  const candidates = [];

  for (const cpu of catalog.cpu) {
    for (const gpu of catalog.gpu) {
      for (const motherboard of catalog.motherboard) {
        for (const memory of catalog.memory) {
          for (const storage of catalog.storage) {
            for (const cooler of catalog.cooler) {
              for (const casePart of catalog.case) {
                for (const psu of catalog.psu) {
                  const parts = { cpu, gpu, motherboard, memory, storage, cooler, case: casePart, psu };
                  const platformWatts = cpu.watts + gpu.watts + 95;
                  const checks = technicalChecks(parts, platformWatts);
                  if (!checks.every((check) => check.pass)) continue;

                  const total = Object.values(parts).reduce((sum, part) => sum + part.price, 0);
                  const candidate = { parts, total, platformWatts, checks };
                  candidate.score = candidateScore(candidate, constraints, profile, targets);
                  candidates.push(candidate);
                }
              }
            }
          }
        }
      }
    }
  }

  return candidates;
}

export function recommendBuild(constraints, profile = "balanced") {
  if (!PROFILES.has(profile)) throw new RangeError(`Unknown recommendation profile: ${profile}`);

  const candidates = enumerateCandidates(constraints, profile);
  const affordable = candidates.filter((candidate) => candidate.total <= constraints.budget);
  const pool = affordable.length ? affordable : candidates;
  const selected = [...pool].sort((a, b) => b.score - a.score || a.total - b.total)[0];

  if (!selected) throw new Error("No technically compatible build is available");

  const checks = [
    ...selected.checks,
    { label: "Estimated price stays within the stated budget", pass: selected.total <= constraints.budget },
  ];

  return {
    parts: selected.parts,
    total: selected.total,
    platformWatts: selected.platformWatts,
    budgetHeadroom: constraints.budget - selected.total,
    checks,
    profile,
    summary: buildSummary(constraints, profile),
  };
}

function buildSummary({ useCase, resolution, priority }, profile) {
  const workload = {
    gaming: `${resolution} gaming`,
    streaming: `${resolution} gaming and streaming`,
    workstation: "creative and technical workloads",
    efficiency: "everyday productivity",
  }[useCase];

  const emphasis = {
    balanced: "balanced value",
    performance: "maximum performance",
    quiet: "low acoustic output",
    efficiency: "lower power draw",
  }[priority];

  const profileLabel = {
    balanced: "balanced component allocation",
    performance: "the strongest performance available within budget",
    value: "performance per dollar and upgrade headroom",
  }[profile];

  return `Optimized for ${workload}, ${emphasis}, and ${profileLabel}.`;
}
