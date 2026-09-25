const CATEGORY_RULES = {
  cpu: ["socket", "memory", "watts", "cores", "threads"],
  gpu: ["watts", "length", "slots", "vram", "powerConnector"],
  motherboard: ["socket", "memory", "memorySlots", "maxMemory", "storageInterfaces", "form"],
  memory: ["memory", "capacity", "modules"],
  storage: ["capacity", "interface"],
  cooler: ["capacity", "noise", "sockets", "kind"],
  case: ["forms", "psuForms", "gpuClearance", "gpuSlots", "maxAirCoolerHeight", "maxRadiatorSize"],
  psu: ["capacity", "form", "connectors"],
};

export function validateCatalog(catalog) {
  const ids = new Set();

  for (const [category, requiredFields] of Object.entries(CATEGORY_RULES)) {
    const entries = catalog[category];
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new TypeError(`Catalog category ${category} must contain at least one part`);
    }

    for (const part of entries) {
      if (!part.id || !part.name) throw new TypeError(`${category} entries require an id and name`);
      if (ids.has(part.id)) throw new TypeError(`Duplicate catalog id: ${part.id}`);
      ids.add(part.id);
      if (!Number.isFinite(part.price) || part.price <= 0) throw new TypeError(`${part.id} requires a positive price`);
      if (!Number.isFinite(part.tier) || part.tier < 1) throw new TypeError(`${part.id} requires a positive tier`);

      for (const field of requiredFields) {
        const value = part[field];
        const valid = Array.isArray(value) ? value.length > 0 : typeof value === "string" ? value.length > 0 : Number.isFinite(value) && value > 0;
        if (!valid) throw new TypeError(`${part.id} has an invalid ${field}`);
      }

      if (category === "cooler") {
        if (!new Set(["air", "liquid"]).has(part.kind)) throw new TypeError(`${part.id} has an invalid cooler kind`);
        if (part.kind === "air" && (!Number.isFinite(part.height) || part.height <= 0)) throw new TypeError(`${part.id} has an invalid height`);
        if (part.kind === "liquid" && (!Number.isFinite(part.radiatorSize) || part.radiatorSize <= 0)) throw new TypeError(`${part.id} has an invalid radiatorSize`);
      }
    }
  }

  return true;
}
