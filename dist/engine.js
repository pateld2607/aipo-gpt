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

function closest(items, target, preference = () => 0) {
  return [...items].sort((a, b) => {
    const aDistance = Math.abs(a.tier - target) - preference(a);
    const bDistance = Math.abs(b.tier - target) - preference(b);
    return aDistance - bDistance || a.price - b.price;
  })[0];
}

export function recommendBuild(constraints) {
  const tier = chooseTier(constraints);
  const quiet = constraints.priority === "quiet";
  const performance = constraints.priority === "performance";
  const workstation = constraints.useCase === "workstation";

  const gpuTarget = clamp(tier + (performance ? 1 : 0), 2, 6);
  const cpuTarget = clamp(tier + (workstation ? 1 : 0) - (constraints.useCase === "gaming" ? 1 : 0), 2, 5);

  const gpu = closest(catalog.gpu, gpuTarget, (item) => item.strengths.includes(constraints.resolution) ? .45 : 0);
  const cpu = closest(catalog.cpu, cpuTarget, (item) => item.strengths.includes(constraints.useCase) ? .45 : 0);
  const motherboard = closest(catalog.motherboard, tier);
  const memory = closest(catalog.memory, workstation || constraints.budget >= 2300 ? 4 : 2);
  const storage = closest(catalog.storage, constraints.budget >= 1450 ? 4 : 2);
  const cooler = closest(
    catalog.cooler.filter((item) => item.capacity >= cpu.watts * 1.25),
    quiet ? 4 : cpu.tier,
    (item) => quiet ? (35 - item.noise) / 20 : 0,
  );
  const casePart = closest(
    catalog.case.filter((item) => item.forms.includes(motherboard.form) && item.gpuClearance >= gpu.length + 15),
    tier,
  );

  const platformWatts = cpu.watts + gpu.watts + 95;
  const requiredPsu = Math.ceil((platformWatts * 1.35) / 50) * 50;
  const psu = catalog.psu.find((item) => item.capacity >= requiredPsu) ?? catalog.psu.at(-1);

  const parts = { cpu, gpu, motherboard, memory, storage, cooler, case: casePart, psu };
  const total = Object.values(parts).reduce((sum, part) => sum + part.price, 0);

  const checks = [
    { label: "CPU socket matches the motherboard", pass: cpu.socket === motherboard.socket },
    { label: "CPU and motherboard share a memory standard", pass: cpu.memory === motherboard.memory },
    { label: "RAM matches the motherboard", pass: memory.memory === motherboard.memory },
    { label: "Cooler capacity covers CPU package power", pass: cooler.capacity >= cpu.watts * 1.25 },
    { label: "Motherboard form factor fits the case", pass: casePart.forms.includes(motherboard.form) },
    { label: "GPU length fits with safety clearance", pass: casePart.gpuClearance >= gpu.length + 15 },
    { label: "PSU provides at least 35% power headroom", pass: psu.capacity >= platformWatts * 1.35 },
    { label: "Estimated price stays within the stated budget", pass: total <= constraints.budget },
  ];

  return {
    parts,
    total,
    platformWatts,
    budgetHeadroom: constraints.budget - total,
    checks,
    summary: buildSummary(constraints),
  };
}

function buildSummary({ useCase, resolution, priority }) {
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

  return `Optimized for ${workload} with an emphasis on ${emphasis}.`;
}
