import { catalog } from "./data.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function parseGoal(goal, fallback) {
  const text = goal.toLowerCase();
  const amount = text.match(/\$\s*([\d,.]+)\s*(k|grand)?\b/)
    ?? text.match(/\busd\s*([\d,.]+)\s*(k|grand)?\b/)
    ?? text.match(/\b([\d,.]+)\s*(k|grand|dollars?)\b/)
    ?? text.match(/(?:budget|around|under|up to)\s*(?:of|is|about)?\s*\$?\s*([\d,.]+)\s*(k|grand)?\b/);
  const budgetNumber = amount ? Number(amount[1].replace(/,/g, "")) : fallback.budget;
  const parsedBudget = budgetNumber * (["k", "grand"].includes(amount?.[2]) ? 1000 : 1);

  let useCase = fallback.useCase;
  if (/machine learning|deep learning|local ai|\bllm\b|ai model|stable diffusion/.test(text)) useCase = "ai";
  else if (/render|editing|creative|workstation|cad|modeling/.test(text)) useCase = "workstation";
  else if (/stream/.test(text)) useCase = "streaming";
  else if (/\bcode|coding|developer|development|programming|virtual machine|\bvm\b/.test(text)) useCase = "development";
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
  else if (/upgrade|future[ -]?proof|long[ -]?term platform/.test(text)) priority = "upgradeability";
  else if (/fastest|max|peak performance/.test(text)) priority = "performance";

  const requestedMemory = text.match(/\b(32|64)\s*gb\s*(?:ram|memory)\b/);
  const memoryTarget = requestedMemory ? requestedMemory[1] : (fallback.memoryTarget ?? "auto");
  const requestedStorage = text.match(/\b(1|2)\s*tb\s*(?:ssd|storage|drive)?\b/);
  const storageTarget = requestedStorage ? requestedStorage[1] : (fallback.storageTarget ?? "auto");
  const requestedNoise = text.match(/(?:under|below|max(?:imum)?)?\s*(24|28|32)\s*dba\b/);
  const noiseTarget = requestedNoise ? requestedNoise[1] : (fallback.noiseTarget ?? "auto");
  const requestedVram = text.match(/\b(12|16)\s*gb\s*(?:vram|graphics memory)\b/);
  const vramTarget = requestedVram ? requestedVram[1] : (fallback.vramTarget ?? "auto");

  return {
    budget: clamp(parsedBudget, 800, 5000),
    useCase,
    resolution,
    priority,
    memoryTarget,
    storageTarget,
    noiseTarget,
    vramTarget,
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
    gaming: { cpuTier: 2, cores: 6, gpuTier: resolutionGpuTier, vram: resolutionVram, memory: 32, storage: 1 },
    streaming: { cpuTier: 4, cores: 8, gpuTier: Math.max(4, resolutionGpuTier), vram: Math.max(12, resolutionVram), memory: 32, storage: 2 },
    workstation: { cpuTier: 5, cores: 12, gpuTier: Math.max(4, resolutionGpuTier), vram: Math.max(16, resolutionVram), memory: 64, storage: 2 },
    development: { cpuTier: 4, cores: 8, gpuTier: 2, vram: 8, memory: 32, storage: 2 },
    ai: { cpuTier: 5, cores: 12, gpuTier: 5, vram: 16, memory: 64, storage: 2 },
    efficiency: { cpuTier: 2, cores: 6, gpuTier: 2, vram: 8, memory: 32, storage: 1 },
  }[constraints.useCase];

  const memory = constraints.memoryTarget && constraints.memoryTarget !== "auto"
    ? Number(constraints.memoryTarget)
    : workload.memory;
  const storage = constraints.storageTarget && constraints.storageTarget !== "auto"
    ? Number(constraints.storageTarget)
    : workload.storage;
  const noise = constraints.noiseTarget && constraints.noiseTarget !== "auto"
    ? Number(constraints.noiseTarget)
    : constraints.priority === "quiet" ? 24 : 32;
  const vram = constraints.vramTarget && constraints.vramTarget !== "auto"
    ? Number(constraints.vramTarget)
    : workload.vram;
  return { ...workload, memory, storage, noise, vram };
}

function targetsFor(constraints, profile) {
  const tier = chooseTier(constraints);
  const performance = constraints.priority === "performance";
  const workstation = constraints.useCase === "workstation";
  const development = constraints.useCase === "development";
  const ai = constraints.useCase === "ai";
  const upgradeability = constraints.priority === "upgradeability";
  const profileLift = profile === "performance" ? 1 : profile === "value" ? -1 : 0;

  return {
    cpu: clamp(tier + (workstation || development || ai ? 1 : 0) - (constraints.useCase === "gaming" ? 1 : 0) + profileLift, 2, 5),
    gpu: clamp(tier + (performance || ai ? 1 : 0) + profileLift, 2, 6),
    motherboard: clamp(tier + profileLift + (upgradeability ? 1 : 0), 2, 4),
    memory: constraints.memoryTarget === "64" || workstation || ai || constraints.budget >= 2300 ? 4 : 2,
    storage: constraints.storageTarget === "2" || (constraints.budget >= 1450 && profile !== "value") ? 4 : 2,
  };
}

function technicalChecks(parts, platformWatts) {
  const coolerFits = parts.cooler.kind === "air"
    ? parts.cooler.height <= parts.case.maxAirCoolerHeight
    : parts.cooler.radiatorSize <= parts.case.maxRadiatorSize;
  return [
    { category: "compatibility", label: "CPU socket matches the motherboard", pass: parts.cpu.socket === parts.motherboard.socket },
    { category: "compatibility", label: "CPU and motherboard share a memory standard", pass: parts.cpu.memory === parts.motherboard.memory },
    { category: "compatibility", label: "RAM matches the motherboard", pass: parts.memory.memory === parts.motherboard.memory },
    { category: "compatibility", label: "RAM capacity stays within the motherboard limit", pass: parts.memory.capacity <= parts.motherboard.maxMemory },
    { category: "compatibility", label: "RAM kit fits the available motherboard slots", pass: parts.memory.modules <= parts.motherboard.memorySlots },
    { category: "compatibility", label: "Storage interface is supported by the motherboard", pass: parts.motherboard.storageInterfaces.includes(parts.storage.interface) },
    { category: "compatibility", label: "Graphics card interface is supported by the motherboard", pass: parts.motherboard.expansionInterfaces.includes(parts.gpu.interface) },
    { category: "compatibility", label: "Cooler capacity covers CPU package power", pass: parts.cooler.capacity >= parts.cpu.watts * 1.25 },
    { category: "compatibility", label: "Cooler mounting hardware supports the CPU socket", pass: parts.cooler.sockets.includes(parts.cpu.socket) },
    { category: "compatibility", label: "Cooler dimensions fit the selected case", pass: coolerFits },
    { category: "compatibility", label: "Motherboard form factor fits the case", pass: parts.case.forms.includes(parts.motherboard.form) },
    { category: "compatibility", label: "Power supply form factor fits the case", pass: parts.case.psuForms.includes(parts.psu.form) },
    { category: "compatibility", label: "Power supply length fits the case clearance", pass: parts.psu.length <= parts.case.maxPsuLength },
    { category: "compatibility", label: "GPU length fits with safety clearance", pass: parts.case.gpuClearance >= parts.gpu.length + 15 },
    { category: "compatibility", label: "GPU thickness fits the case expansion slots", pass: parts.case.gpuSlots >= parts.gpu.slots },
    { category: "compatibility", label: "PSU includes the GPU power connector", pass: parts.psu.connectors.includes(parts.gpu.powerConnector) },
    { category: "compatibility", label: "PSU provides at least 35% power headroom", pass: parts.psu.capacity >= platformWatts * 1.35 },
  ];
}

function goalChecks(parts, constraints, total) {
  const requirements = requirementsFor(constraints);
  return [
    { key: "cpu", category: "goal", label: `CPU tier supports ${constraints.useCase} workloads`, pass: parts.cpu.tier >= requirements.cpuTier },
    { key: "cores", category: "goal", label: `${requirements.cores}-core CPU target is met`, pass: parts.cpu.cores >= requirements.cores },
    { key: "gpu", category: "goal", label: `GPU tier supports the ${constraints.resolution} target`, pass: parts.gpu.tier >= requirements.gpuTier },
    { key: "vram", category: "goal", label: `${requirements.vram}GB graphics memory target is met`, pass: parts.gpu.vram >= requirements.vram },
    { key: "memory", category: "goal", label: `${requirements.memory}GB memory target is met`, pass: parts.memory.capacity >= requirements.memory },
    { key: "storage", category: "goal", label: `${requirements.storage}TB storage target is met`, pass: parts.storage.capacity >= requirements.storage },
    { key: "noise", category: "goal", label: `${requirements.noise}dBA cooler-noise ceiling is met`, pass: parts.cooler.noise <= requirements.noise },
    { key: "budget", category: "goal", label: "Estimated price stays within the stated budget", pass: total <= constraints.budget },
  ];
}

function shortfallAdvice(requirementChecks) {
  const advice = {
    cpu: "CPU target missed: raise the budget or choose a lighter primary workload.",
    cores: "CPU core target missed: choose a higher-core processor for parallel workloads.",
    gpu: "GPU target missed: raise the budget or lower the target resolution.",
    vram: "Graphics-memory target missed: select a GPU with more VRAM for this workload.",
    memory: "System-memory target missed: increase RAM capacity for larger projects and multitasking.",
    storage: "Storage target missed: add capacity for applications, recordings, or project files.",
    noise: "Noise target missed: select a quieter cooler or relax the acoustic ceiling.",
    budget: "Budget target missed: use the best-value profile or increase the spending limit.",
  };

  return requirementChecks.filter((check) => !check.pass).map((check) => advice[check.key]);
}

function buildRationales(parts, constraints, platformWatts) {
  const coolerMargin = Math.round(parts.cooler.capacity - parts.cpu.watts * 1.25);
  const gpuClearance = parts.case.gpuClearance - parts.gpu.length;
  const powerHeadroom = parts.psu.capacity - platformWatts;
  const coolerFit = parts.cooler.kind === "air"
    ? `${parts.cooler.height}mm tall in a ${parts.case.maxAirCoolerHeight}mm limit`
    : `${parts.cooler.radiatorSize}mm radiator in a ${parts.case.maxRadiatorSize}mm mount`;

  return {
    cpu: `${parts.cpu.cores} cores and ${parts.cpu.threads} threads provide tier ${parts.cpu.tier} compute at ${parts.cpu.watts}W package power.`,
    gpu: `Tier ${parts.gpu.tier} graphics with ${parts.gpu.vram}GB VRAM uses the supported ${parts.gpu.interface} interface for the ${constraints.resolution} target.`,
    motherboard: `${parts.motherboard.socket} and ${parts.motherboard.memory} support match the selected processor and memory, with capacity support up to ${parts.motherboard.maxMemory}GB.`,
    memory: `${parts.memory.capacity}GB of ${parts.memory.memory} uses ${parts.memory.modules} of ${parts.motherboard.memorySlots} motherboard slots.`,
    storage: `${parts.storage.capacity}TB of ${parts.storage.interface} storage balances working space with the total budget.`,
    cooler: `${coolerMargin}W of thermal margin remains above the CPU safety target; ${parts.cpu.socket} mounting is included and the cooler is ${coolerFit}.`,
    case: `${gpuClearance}mm of GPU length clearance and ${(parts.case.gpuSlots - parts.gpu.slots).toFixed(1)} expansion slots remain.`,
    psu: `${powerHeadroom}W remains above estimated peak draw; the ${parts.psu.length}mm ${parts.psu.form} unit fits the ${parts.case.maxPsuLength}mm case limit and includes native ${parts.gpu.powerConnector} GPU power.`,
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

function describePowerReserve(parts, platformWatts) {
  const watts = parts.psu.capacity - platformWatts;
  const percentage = Math.round((watts / platformWatts) * 100);
  const label = percentage >= 70 ? "Expandable" : percentage >= 45 ? "Comfortable" : "Safe";
  return { watts, percentage, label };
}

function describeBudgetUsage(total, budget) {
  const percentage = Math.round((total / budget) * 100);
  const label = percentage <= 80 ? "Roomy" : percentage <= 95 ? "On target" : percentage <= 100 ? "Near limit" : "Over budget";
  return { percentage, label, remaining: budget - total };
}

function buildFingerprint(parts, constraints, profile) {
  const input = JSON.stringify({
    parts: Object.values(parts).map((part) => part.id),
    constraints,
    profile,
  });
  let hash = 2166136261;
  for (const character of input) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `AIPO-${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
}

function assessComponentBalance(parts, constraints) {
  const targetGpuLead = {
    gaming: 1,
    streaming: 0,
    workstation: 0,
    development: -2,
    ai: 1,
    efficiency: 0,
  }[constraints.useCase];
  const actualGpuLead = parts.gpu.tier - parts.cpu.tier;
  const score = clamp(100 - Math.abs(actualGpuLead - targetGpuLead) * 20, 40, 100);
  const label = score >= 80 ? "Workload-aligned" : score >= 60 ? "Specialized" : "Uneven";
  return { score, label, cpuTier: parts.cpu.tier, gpuTier: parts.gpu.tier };
}

function candidateScore(candidate, constraints, profile, targets) {
  const { parts, total, platformWatts } = candidate;
  const cpuWeight = constraints.useCase === "workstation" ? 1.8 : constraints.useCase === "ai" ? 1.6 : constraints.useCase === "development" ? 1.55 : constraints.useCase === "streaming" ? 1.35 : 1;
  const gpuWeight = constraints.useCase === "ai" ? 2.2 : constraints.resolution === "4k" ? 2 : constraints.resolution === "1440p" ? 1.65 : 1.25;
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
  const upgradeBonus = constraints.priority === "upgradeability" ? assessUpgradeReadiness(parts, platformWatts).score / 8 : 0;
  const goalFit = goalChecks(parts, constraints, total).filter((check) => check.pass).length;

  if (profile === "performance") {
    return performance * 4.2 + workloadFit * 1.5 + targetFit + goalFit * 3 - Math.abs(1 - budgetUse) * 2 + quietBonus + efficiencyBonus + upgradeBonus;
  }

  if (profile === "value") {
    return performance * 6 / (total / 1000) + workloadFit + targetFit * .45 + goalFit * 2 + Math.max(0, 1 - budgetUse) * 2 + quietBonus + efficiencyBonus + upgradeBonus;
  }

  return performance * 2.1 + workloadFit * 1.7 + targetFit + goalFit * 3.5 - Math.abs(.9 - budgetUse) * 3 + quietBonus + efficiencyBonus + upgradeBonus;
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
  const evaluatedCount = Object.values(catalog).reduce((count, entries) => count * entries.length, 1);
  const pool = affordable.length ? affordable : candidates;
  const ranked = [...pool].sort((a, b) => b.score - a.score || a.total - b.total);
  const selected = ranked[0];

  if (!selected) throw new Error("No technically compatible build is available");

  const checks = [
    ...selected.checks,
    ...goalChecks(selected.parts, constraints, selected.total),
  ];

  const compatibilityChecks = checks.filter((check) => check.category === "compatibility");
  const requirementChecks = checks.filter((check) => check.category === "goal");
  const budgetAllocation = Object.fromEntries(
    Object.entries(selected.parts).map(([type, part]) => [type, {
      amount: part.price,
      percentage: part.price / selected.total,
    }]),
  );
  const selectedCore = `${selected.parts.cpu.id}:${selected.parts.gpu.id}`;
  const seenAlternatives = new Set([selectedCore]);
  const alternatives = ranked.filter((candidate) => {
    const key = `${candidate.parts.cpu.id}:${candidate.parts.gpu.id}`;
    if (seenAlternatives.has(key)) return false;
    seenAlternatives.add(key);
    return true;
  }).slice(0, 3).map((candidate) => {
    const candidateGoals = goalChecks(candidate.parts, constraints, candidate.total);
    return {
      cpu: candidate.parts.cpu.name,
      gpu: candidate.parts.gpu.name,
      total: candidate.total,
      headroom: constraints.budget - candidate.total,
      platformWatts: candidate.platformWatts,
      goalsMet: candidateGoals.filter((check) => check.pass).length,
      goalCount: candidateGoals.length,
      buildId: buildFingerprint(candidate.parts, constraints, profile),
    };
  });
  const goalReadyCandidate = [...candidates]
    .filter((candidate) => goalChecks(candidate.parts, constraints, candidate.total)
      .filter((check) => check.key !== "budget")
      .every((check) => check.pass))
    .sort((a, b) => a.total - b.total)[0];
  const goalRecovery = goalReadyCandidate ? {
    total: goalReadyCandidate.total,
    additionalBudget: Math.max(0, goalReadyCandidate.total - constraints.budget),
    cpu: goalReadyCandidate.parts.cpu.name,
    gpu: goalReadyCandidate.parts.gpu.name,
    buildId: buildFingerprint(goalReadyCandidate.parts, constraints, profile),
  } : null;

  return {
    parts: selected.parts,
    rationales: buildRationales(selected.parts, constraints, selected.platformWatts),
    upgradeReadiness: assessUpgradeReadiness(selected.parts, selected.platformWatts),
    acoustics: describeAcoustics(selected.parts),
    powerReserve: describePowerReserve(selected.parts, selected.platformWatts),
    budgetUsage: describeBudgetUsage(selected.total, constraints.budget),
    budgetAllocation,
    buildId: buildFingerprint(selected.parts, constraints, profile),
    searchStats: {
      evaluated: evaluatedCount,
      compatible: candidates.length,
      affordable: affordable.length,
    },
    alternatives,
    goalRecovery,
    componentBalance: assessComponentBalance(selected.parts, constraints),
    total: selected.total,
    platformWatts: selected.platformWatts,
    budgetHeadroom: constraints.budget - selected.total,
    checks,
    compatibilityChecks,
    requirementChecks,
    shortfalls: shortfallAdvice(requirementChecks),
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
    development: "software development and local virtual machines",
    ai: "local AI and machine-learning workloads",
    efficiency: "everyday productivity",
  }[useCase];

  const emphasis = {
    balanced: "balanced value",
    performance: "maximum performance",
    quiet: "low acoustic output",
    efficiency: "lower power draw",
    upgradeability: "long-term expansion headroom",
  }[priority];

  const profileLabel = {
    balanced: "balanced component allocation",
    performance: "the strongest performance available within budget",
    value: "performance per dollar and upgrade headroom",
  }[profile];

  return `Optimized for ${workload}, ${emphasis}, and ${profileLabel}.`;
}
