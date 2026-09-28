import assert from "node:assert/strict";
import { catalog } from "../dist/data.js";
import { validateCatalog } from "../dist/catalog-validator.js";

assert.equal(validateCatalog(catalog), true);

const duplicate = structuredClone(catalog);
duplicate.gpu[0].id = duplicate.cpu[0].id;
assert.throws(() => validateCatalog(duplicate), /Duplicate catalog id/);

const missingVram = structuredClone(catalog);
delete missingVram.gpu[0].vram;
assert.throws(() => validateCatalog(missingVram), /invalid vram/);

const invalidPrice = structuredClone(catalog);
invalidPrice.storage[0].price = 0;
assert.throws(() => validateCatalog(invalidPrice), /positive price/);

const missingMemoryLimit = structuredClone(catalog);
delete missingMemoryLimit.motherboard[0].maxMemory;
assert.throws(() => validateCatalog(missingMemoryLimit), /invalid maxMemory/);

const missingCoolerHeight = structuredClone(catalog);
delete missingCoolerHeight.cooler[0].height;
assert.throws(() => validateCatalog(missingCoolerHeight), /invalid height/);

const missingStorageInterface = structuredClone(catalog);
delete missingStorageInterface.storage[0].interface;
assert.throws(() => validateCatalog(missingStorageInterface), /invalid interface/);

const missingPsuForm = structuredClone(catalog);
delete missingPsuForm.psu[0].form;
assert.throws(() => validateCatalog(missingPsuForm), /invalid form/);

const missingMemoryModules = structuredClone(catalog);
delete missingMemoryModules.memory[0].modules;
assert.throws(() => validateCatalog(missingMemoryModules), /invalid modules/);

const missingCoolerSockets = structuredClone(catalog);
missingCoolerSockets.cooler[0].sockets = [];
assert.throws(() => validateCatalog(missingCoolerSockets), /invalid sockets/);

const missingPsuLength = structuredClone(catalog);
delete missingPsuLength.psu[0].length;
assert.throws(() => validateCatalog(missingPsuLength), /invalid length/);

const missingGpuInterface = structuredClone(catalog);
delete missingGpuInterface.gpu[0].interface;
assert.throws(() => validateCatalog(missingGpuInterface), /invalid interface/);

const missingCpuPowerLimit = structuredClone(catalog);
delete missingCpuPowerLimit.motherboard[0].maxCpuWatts;
assert.throws(() => validateCatalog(missingCpuPowerLimit), /invalid maxCpuWatts/);

console.log("catalog tests passed");
