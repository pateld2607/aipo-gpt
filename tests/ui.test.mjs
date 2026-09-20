import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../dist/app.js", import.meta.url), "utf8");

for (const profile of ["balanced", "performance", "value"]) {
  assert.match(html, new RegExp(`data-profile="${profile}"`));
}

assert.equal((html.match(/class="profile-button/g) ?? []).length, 3);
assert.match(html, /role="group" aria-label="Recommendation profile"/);
assert.match(app, /recommendBuild\(constraints, activeProfile\)/);
assert.match(app, /setAttribute\("aria-pressed"/);
assert.match(app, /recommendation\.rationales\[type\]/);
assert.match(html, /shows why each component earned its place/);
assert.match(html, /id="copy-build"/);
assert.match(html, /id="download-build"/);
assert.match(html, /id="export-status" role="status" aria-live="polite"/);
assert.match(app, /navigator\.clipboard\.writeText/);
assert.match(app, /new Blob/);
assert.match(html, /<summary>Compare all profiles<\/summary>/);
assert.match(html, /id="profile-comparison-body"/);
assert.match(app, /data-compare-profile/);
assert.match(app, /button\.dataset\.compareProfile/);
assert.match(html, /id="upgrade-readiness"/);
assert.match(app, /recommendation\.upgradeReadiness\.label/);
assert.match(html, /id="cooler-noise"/);
assert.match(app, /recommendation\.acoustics\.decibels/);
assert.match(html, /id="goal"[^>]+required minlength="12"/);
assert.match(html, /id="budget"[^>]+required/);
assert.match(html, /id="form-error" role="alert"/);
assert.match(app, /form\.addEventListener\("invalid"/);

console.log("UI contract tests passed");
