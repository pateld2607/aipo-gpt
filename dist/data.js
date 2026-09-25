import { validateCatalog } from "./catalog-validator.js";

export const catalog = {
  cpu: [
    { id: "r5-7600", name: "AMD Ryzen 5 7600", price: 189, socket: "AM5", memory: "DDR5", watts: 88, cores: 6, threads: 12, tier: 2, strengths: ["gaming", "efficiency"] },
    { id: "r7-9700x", name: "AMD Ryzen 7 9700X", price: 329, socket: "AM5", memory: "DDR5", watts: 105, cores: 8, threads: 16, tier: 4, strengths: ["gaming", "streaming", "development", "efficiency"] },
    { id: "r9-9900x", name: "AMD Ryzen 9 9900X", price: 449, socket: "AM5", memory: "DDR5", watts: 162, cores: 12, threads: 24, tier: 5, strengths: ["workstation", "streaming", "development"] },
  ],
  gpu: [
    { id: "rx-7700xt", name: "Radeon RX 7700 XT 12GB", price: 399, watts: 245, length: 267, slots: 2.5, vram: 12, powerConnector: "2x8-pin", tier: 2, strengths: ["1080p", "1440p", "value"] },
    { id: "rtx-5070", name: "GeForce RTX 5070 12GB", price: 549, watts: 250, length: 304, slots: 2.5, vram: 12, powerConnector: "12V-2x6", tier: 4, strengths: ["1440p", "streaming", "workstation"] },
    { id: "rx-9070xt", name: "Radeon RX 9070 XT 16GB", price: 699, watts: 304, length: 320, slots: 3, vram: 16, powerConnector: "3x8-pin", tier: 5, strengths: ["1440p", "4k", "value"] },
    { id: "rtx-5080", name: "GeForce RTX 5080 16GB", price: 999, watts: 360, length: 329, slots: 3.5, vram: 16, powerConnector: "12V-2x6", tier: 6, strengths: ["4k", "streaming", "workstation"] },
  ],
  motherboard: [
    { id: "b650m", name: "B650M WiFi — mATX", price: 159, socket: "AM5", memory: "DDR5", memorySlots: 4, maxMemory: 128, storageInterfaces: ["PCIe 4.0 NVMe"], form: "mATX", tier: 2 },
    { id: "b850", name: "B850 WiFi — ATX", price: 219, socket: "AM5", memory: "DDR5", memorySlots: 4, maxMemory: 192, storageInterfaces: ["PCIe 4.0 NVMe", "PCIe 5.0 NVMe"], form: "ATX", tier: 4 },
  ],
  memory: [
    { id: "32-ddr5", name: "32GB DDR5-6000 CL30", price: 104, memory: "DDR5", capacity: 32, modules: 2, tier: 2 },
    { id: "64-ddr5", name: "64GB DDR5-6000 CL32", price: 189, memory: "DDR5", capacity: 64, modules: 2, tier: 4 },
  ],
  storage: [
    { id: "1tb-nvme", name: "1TB PCIe 4.0 NVMe SSD", price: 79, capacity: 1, interface: "PCIe 4.0 NVMe", tier: 2 },
    { id: "2tb-nvme", name: "2TB PCIe 4.0 NVMe SSD", price: 139, capacity: 2, interface: "PCIe 4.0 NVMe", tier: 4 },
  ],
  cooler: [
    { id: "tower-120", name: "120mm dual-fan air cooler", price: 49, capacity: 150, noise: 27, sockets: ["AM5"], kind: "air", height: 155, tier: 2 },
    { id: "tower-140", name: "140mm premium air cooler", price: 89, capacity: 220, noise: 23, sockets: ["AM5"], kind: "air", height: 160, tier: 4 },
    { id: "aio-360", name: "360mm liquid cooler", price: 139, capacity: 300, noise: 30, sockets: ["AM5"], kind: "liquid", radiatorSize: 360, tier: 5 },
  ],
  case: [
    { id: "air-mini", name: "Compact Airflow mATX Case", price: 79, forms: ["mATX"], psuForms: ["ATX", "SFX"], gpuClearance: 330, gpuSlots: 3, maxAirCoolerHeight: 160, maxRadiatorSize: 240, tier: 2 },
    { id: "air-mid", name: "High-Airflow ATX Mid Tower", price: 119, forms: ["ATX", "mATX"], psuForms: ["ATX", "SFX"], gpuClearance: 390, gpuSlots: 4, maxAirCoolerHeight: 175, maxRadiatorSize: 360, tier: 4 },
  ],
  psu: [
    { id: "650-gold", name: "650W 80+ Gold Modular PSU", price: 89, capacity: 650, form: "ATX", connectors: ["2x8-pin"], tier: 2 },
    { id: "850-gold", name: "850W ATX 3.1 Gold Modular PSU", price: 139, capacity: 850, form: "ATX", connectors: ["2x8-pin", "3x8-pin", "12V-2x6"], tier: 4 },
    { id: "1000-gold", name: "1000W ATX 3.1 Gold Modular PSU", price: 189, capacity: 1000, form: "ATX", connectors: ["2x8-pin", "3x8-pin", "12V-2x6"], tier: 5 },
  ],
};

validateCatalog(catalog);
