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

console.log("catalog tests passed");
