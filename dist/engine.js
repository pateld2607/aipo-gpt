import { catalog } from "./data.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function parseGoal(goal, fallback) {
  const text = goal.toLowerCase();
  const amount = text.match(/\$\s*([\d,.]+)\s*(k|grand)?\b/)
    ?? text.match(/(?:budget|around|under|up to)\s*(?:of|is|about)?\s*\$?\s*([\d,.]+)\s*(k|grand)?\b/);
  const budgetNumber = amount ? Number(amount[1].replace(/,/g, "")) : fallback.budget;
  const parsedBudget = budgetNumber * (amount?.[2] ? 1000 : 1);

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

function requirementsFor(constraints) {
  const resolutionGpuTier = {
    "1080p": 2,
    "1440p": 4,
    "4k": 5,
    productivity: 2,
  }[constraints.resolution];
  const resolutionVram = {
    "1080p": 8,
    "1440p": 12,
    "4k": 16,
    productivity: 8,
  }[constraints.resolution];
  const workload = {
    gaming: { cpuTier: 2, gpuTier: resolutionGpuTier, vram: resolutionVram, memory: 32, storage: 1 },
    streaming: { cpuTier: 4, gpuTier: Math.max(4, resolutionGpuTier), vram: Math.max(12, resolutionVram), memory: 32, storage: 2 },
    workstation: { cpuTier: 5, gpuTier: Math.max(4, resolutionGpuTier), vram: Math.max(16, resolutionVram), memory: 64, storage: 2 },
    efficiency: { cpuTier: 2, gpuTier: 2, vram: 8, memory: 32, storage: 1 },
  }[constraints.useCase];

  return workload;
}

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
    { category: "compatibility", label: "CPU socket matches the motherboard", pass: parts.cpu.socket === parts.motherboard.socket },
    { category: "compatibility", label: "CPU and motherboard share a memory standard", pass: parts.cpu.memory === parts.motherboard.memory },
    { category: "compatibility", label: "RAM matches the motherboard", pass: parts.memory.memory === parts.motherboard.memory },
    { category: "compatibility", label: "Cooler capacity covers CPU package power", pass: parts.cooler.capacity >= parts.cpu.watts * 1.25 },
    { category: "compatibility", label: "Motherboard form factor fits the case", pass: parts.case.forms.includes(parts.motherboard.form) },
    { category: "compatibility", label: "GPU length fits with safety clearance", pass: parts.case.gpuClearance >= parts.gpu.length + 15 },
    { category: "compatibility", label: "GPU thickness fits the case expansion slots", pass: parts.case.gpuSlots >= parts.gpu.slots },
    { category: "compatibility", label: "PSU provides at least 35% power headroom", pass: parts.psu.capacity >= platformWatts * 1.35 },
  ];
}

function goalChecks(parts, constraints, total) {
  const requirements = requirementsFor(constraints);
  return [
    { category: "goal", label: `CPU tier supports ${constraints.useCase} workloads`, pass: parts.cpu.tier >= requirements.cpuTier },
    { category: "goal", label: `GPU tier supports the ${constraints.resolution} target`, pass: parts.gpu.tier >= requirements.gpuTier },
    { category: "goal", label: `${requirements.vram}GB graphics memory target is met`, pass: parts.gpu.vram >= requirements.vram },
    { category: "goal", label: `${requirements.memory}GB memory target is met`, pass: parts.memory.capacity >= requirements.memory },
    { category: "goal", label: `${requirements.storage}TB storage target is met`, pass: parts.storage.capacity >= requirements.storage },
    { category: "goal", label: "Estimated price stays within the stated budget", pass: total <= constraints.budget },
  ];
}

function buildRationales(parts, constraints, platformWatts) {
  const coolerMargin = Math.round(parts.cooler.capacity - parts.cpu.watts * 1.25);
  const gpuClearance = parts.case.gpuClearance - parts.gpu.length;
  const powerHeadroom = parts.psu.capacity - platformWatts;

  return {
    cpu: `Tier ${parts.cpu.tier} compute is matched to ${constraints.useCase} work at ${parts.cpu.watts}W package power.`,
    gpu: `Tier ${parts.gpu.tier} graphics with ${parts.gpu.vram}GB VRAM is prioritized for the ${constraints.resolution} target.`,
    motherboard: `${parts.motherboard.socket} and ${parts.motherboard.memory} support match the selected processor and memory.`,
    memory: `${parts.memory.capacity}GB of ${parts.memory.memory} is allocated for the selected workload.`,
    storage: `${parts.storage.capacity}TB of NVMe storage balances working space with the total budget.`,
    cooler: `${coolerMargin}W of thermal margin remains above the CPU safety target.`,
    case: `${gpuClearance}mm of length clearance and ${(parts.case.gpuSlots - parts.gpu.slots).toFixed(1)} expansion slots remain.`,
    psu: `${powerHeadroom}W of power capacity remains above estimated peak draw.`,
  };
}

function assessUpgradeReadiness(parts, platformWatts) {
  const signals = {
    power: parts.psu.capacity - platformWatts >= 250,
    memory: parts.memory.capacity >= 64,
    motherboard: parts.motherboard.tier >= 4,
    clearance: parts.case.gpuClearance - parts.gpu.length >= 70,
  };
  const score = Object.values(signals).filter(Boolean).length * 25;
  const label = score >= 75 ? "Strong" : score >= 50 ? "Moderate" : "Limited";

  return { score, label, signals };
}

function describeAcoustics(parts) {
  const decibels = parts.cooler.noise;
  const label = decibels <= 24 ? "Quiet" : decibels <= 28 ? "Balanced" : "Performance";
  return { decibels, label };
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
  const goalFit = goalChecks(parts, constraints, total).filter((check) => check.pass).length;

  if (profile === "performance") {
    return performance * 4.2 + workloadFit * 1.5 + targetFit + goalFit * 3 - Math.abs(1 - budgetUse) * 2 + quietBonus + efficiencyBonus;
  }

  if (profile === "value") {
    return performance * 6 / (total / 1000) + workloadFit + targetFit * .45 + goalFit * 2 + Math.max(0, 1 - budgetUse) * 2 + quietBonus + efficiencyBonus;
  }

  return performance * 2.1 + workloadFit * 1.7 + targetFit + goalFit * 3.5 - Math.abs(.9 - budgetUse) * 3 + quietBonus + efficiencyBonus;
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
    ...goalChecks(selected.parts, constraints, selected.total),
  ];

  const compatibilityChecks = checks.filter((check) => check.category === "compatibility");
  const requirementChecks = checks.filter((check) => check.category === "goal");

  return {
    parts: selected.parts,
    rationales: buildRationales(selected.parts, constraints, selected.platformWatts),
    upgradeReadiness: assessUpgradeReadiness(selected.parts, selected.platformWatts),
    acoustics: describeAcoustics(selected.parts),
    total: selected.total,
    platformWatts: selected.platformWatts,
    budgetHeadroom: constraints.budget - selected.total,
    checks,
    compatibilityChecks,
    requirementChecks,
    goalFit: requirementChecks.filter((check) => check.pass).length / requirementChecks.length,
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
