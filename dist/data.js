export const catalog = {
  cpu: [
    { id: "r5-7600", name: "AMD Ryzen 5 7600", price: 189, socket: "AM5", memory: "DDR5", watts: 88, tier: 2, strengths: ["gaming", "efficiency"] },
    { id: "r7-9700x", name: "AMD Ryzen 7 9700X", price: 329, socket: "AM5", memory: "DDR5", watts: 105, tier: 4, strengths: ["gaming", "streaming", "efficiency"] },
    { id: "r9-9900x", name: "AMD Ryzen 9 9900X", price: 449, socket: "AM5", memory: "DDR5", watts: 162, tier: 5, strengths: ["workstation", "streaming"] },
  ],
  gpu: [
    { id: "rx-7700xt", name: "Radeon RX 7700 XT 12GB", price: 399, watts: 245, length: 267, tier: 2, strengths: ["1080p", "1440p", "value"] },
    { id: "rtx-5070", name: "GeForce RTX 5070 12GB", price: 549, watts: 250, length: 304, tier: 4, strengths: ["1440p", "streaming", "workstation"] },
    { id: "rx-9070xt", name: "Radeon RX 9070 XT 16GB", price: 699, watts: 304, length: 320, tier: 5, strengths: ["1440p", "4k", "value"] },
    { id: "rtx-5080", name: "GeForce RTX 5080 16GB", price: 999, watts: 360, length: 329, tier: 6, strengths: ["4k", "streaming", "workstation"] },
  ],
  motherboard: [
    { id: "b650m", name: "B650M WiFi — mATX", price: 159, socket: "AM5", memory: "DDR5", form: "mATX", tier: 2 },
    { id: "b850", name: "B850 WiFi — ATX", price: 219, socket: "AM5", memory: "DDR5", form: "ATX", tier: 4 },
  ],
  memory: [
    { id: "32-ddr5", name: "32GB DDR5-6000 CL30", price: 104, memory: "DDR5", capacity: 32, tier: 2 },
    { id: "64-ddr5", name: "64GB DDR5-6000 CL32", price: 189, memory: "DDR5", capacity: 64, tier: 4 },
  ],
  storage: [
    { id: "1tb-nvme", name: "1TB PCIe 4.0 NVMe SSD", price: 79, capacity: 1, tier: 2 },
    { id: "2tb-nvme", name: "2TB PCIe 4.0 NVMe SSD", price: 139, capacity: 2, tier: 4 },
  ],
  cooler: [
    { id: "tower-120", name: "120mm dual-fan air cooler", price: 49, capacity: 150, noise: 27, tier: 2 },
    { id: "tower-140", name: "140mm premium air cooler", price: 89, capacity: 220, noise: 23, tier: 4 },
    { id: "aio-360", name: "360mm liquid cooler", price: 139, capacity: 300, noise: 30, tier: 5 },
  ],
  case: [
    { id: "air-mini", name: "Compact Airflow mATX Case", price: 79, forms: ["mATX"], gpuClearance: 330, tier: 2 },
    { id: "air-mid", name: "High-Airflow ATX Mid Tower", price: 119, forms: ["ATX", "mATX"], gpuClearance: 390, tier: 4 },
  ],
  psu: [
    { id: "650-gold", name: "650W 80+ Gold Modular PSU", price: 89, capacity: 650, tier: 2 },
    { id: "850-gold", name: "850W ATX 3.1 Gold Modular PSU", price: 139, capacity: 850, tier: 4 },
    { id: "1000-gold", name: "1000W ATX 3.1 Gold Modular PSU", price: 189, capacity: 1000, tier: 5 },
  ],
};
