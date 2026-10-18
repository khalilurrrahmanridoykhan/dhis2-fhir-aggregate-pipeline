import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toDhis2MonthlyPeriod } from "./lib/period.mjs";
import { aggregateByVaccineAndPeriod } from "./lib/aggregate.mjs";
import { buildDataValueSet } from "./lib/buildDataValueSet.mjs";

// toDhis2MonthlyPeriod
assert.equal(toDhis2MonthlyPeriod("2026-10-03"), "202610");
assert.equal(toDhis2MonthlyPeriod("2026-01-15"), "202601");
assert.equal(toDhis2MonthlyPeriod("2025-12-31"), "202512"); // year-boundary case
console.log("PASS: toDhis2MonthlyPeriod converts real ISO dates correctly, including a year boundary");

// aggregateByVaccineAndPeriod + buildDataValueSet, against the real fixture
const resources = JSON.parse(readFileSync(new URL("./fixtures/sample-immunizations.json", import.meta.url), "utf8"));
const { counts, skipped } = aggregateByVaccineAndPeriod(resources);

// 3 BCG in October 2026, 1 BCG in November 2026, 2 Yellow Fever in October
// 2026, 2 Measles in October 2026
assert.equal(counts.get("s46m5MS0hxu|202610"), 3, "expected 3 BCG doses in October 2026");
assert.equal(counts.get("s46m5MS0hxu|202611"), 1, "expected 1 BCG dose in November 2026");
assert.equal(counts.get("l6byfWFUGaP|202610"), 2, "expected 2 Yellow Fever doses in October 2026");
assert.equal(counts.get("YtbsuPPo010|202610"), 2, "expected 2 Measles doses in October 2026");
console.log("PASS: aggregateByVaccineAndPeriod produces correct counts per (vaccine, month)");

assert.equal(skipped.length, 1, "expected exactly 1 skipped (unmapped) resource");
assert.equal(skipped[0].code, "03", "expected the skipped resource's code to be the unmapped MMR code");
console.log("PASS: the deliberately-unmapped vaccine code is reported as skipped, not silently dropped");

const dataValueSet = buildDataValueSet(counts);
assert.equal(
  dataValueSet.dataValues.length,
  4,
  "expected 4 dataValues (2 BCG periods + 1 Yellow Fever period + 1 Measles period)"
);
dataValueSet.dataValues.forEach((dv) => {
  assert.equal(dv.orgUnit, "DiszpKrYNg8", "expected the fixed Ngelehun CHC org unit on every row");
  assert.equal(dv.categoryOptionCombo, "Prlt0C1RF0s", "expected the fixed 'Fixed, <1y' category option combo on every row");
});
console.log("PASS: buildDataValueSet applies the fixed orgUnit/categoryOptionCombo to every row");

console.log("\nAll tests passed.");
