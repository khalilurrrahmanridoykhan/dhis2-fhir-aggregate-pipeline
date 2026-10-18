import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toDhis2MonthlyPeriod } from "./lib/period.mjs";
import { aggregateByVaccineAndPeriod } from "./lib/aggregate.mjs";
import { buildDataValueSet } from "./lib/buildDataValueSet.mjs";

const CHILD_HEALTH = "BfMAe6Itzgt";
const REPRODUCTIVE_HEALTH = "QX4ZTUbOt3a";
const CHILD_HEALTH_COC = "Prlt0C1RF0s";
const TT_COC = "dcguXUTwenI";

// toDhis2MonthlyPeriod
assert.equal(toDhis2MonthlyPeriod("2026-10-03"), "202610");
assert.equal(toDhis2MonthlyPeriod("2026-01-15"), "202601");
assert.equal(toDhis2MonthlyPeriod("2025-12-31"), "202512"); // year-boundary case
console.log("PASS: toDhis2MonthlyPeriod converts real ISO dates correctly, including a year boundary");

// aggregateByVaccineAndPeriod + buildDataValueSet, against the real fixture
const resources = JSON.parse(readFileSync(new URL("./fixtures/sample-immunizations.json", import.meta.url), "utf8"));
const { counts, skipped } = aggregateByVaccineAndPeriod(resources);

// 3 BCG in October 2026, 1 BCG in November 2026, 2 Yellow Fever in October
// 2026, 2 Measles in October 2026 -- all Child Health
assert.equal(counts.get(`${CHILD_HEALTH}|${CHILD_HEALTH_COC}|s46m5MS0hxu|202610`), 3, "expected 3 BCG doses in October 2026");
assert.equal(counts.get(`${CHILD_HEALTH}|${CHILD_HEALTH_COC}|s46m5MS0hxu|202611`), 1, "expected 1 BCG dose in November 2026");
assert.equal(counts.get(`${CHILD_HEALTH}|${CHILD_HEALTH_COC}|l6byfWFUGaP|202610`), 2, "expected 2 Yellow Fever doses in October 2026");
assert.equal(counts.get(`${CHILD_HEALTH}|${CHILD_HEALTH_COC}|YtbsuPPo010|202610`), 2, "expected 2 Measles doses in October 2026");
console.log("PASS: aggregateByVaccineAndPeriod produces correct counts per (vaccine, month)");

// dose-number-aware vaccines: 2 OPV dose 1 (Child Health), 1 Penta dose 2
// (Child Health), 1 TT dose 1 (Reproductive Health, its own categoryCombo
// -- a different dataset AND a different category option combo), all
// October 2026
assert.equal(counts.get(`${CHILD_HEALTH}|${CHILD_HEALTH_COC}|pikOziyCXbM|202610`), 2, "expected 2 OPV1 doses in October 2026");
assert.equal(counts.get(`${CHILD_HEALTH}|${CHILD_HEALTH_COC}|I78gJm4KBo7|202610`), 1, "expected 1 Penta2 dose in October 2026");
assert.equal(
  counts.get(`${REPRODUCTIVE_HEALTH}|${TT_COC}|zzHwXqxKYy1|202610`),
  1,
  "expected 1 TT1 dose in October 2026, under the Reproductive Health dataset and TT category option combo"
);
console.log("PASS: dose-number-aware vaccines (OPV/Penta/TT) resolve to the correct per-dose data element, dataset, and category option combo");

assert.equal(skipped.length, 2, "expected exactly 2 skipped resources");
const unmappedCode = skipped.find((s) => s.reason === "unmapped vaccine code");
assert.equal(unmappedCode?.code, "03", "expected the unmapped-code skip to be the MMR resource");
const unknownDose = skipped.find((s) => s.reason?.startsWith("unknown dose number"));
assert.ok(unknownDose, "expected an 'unknown dose number' skip for the OPV dose-9 resource");
assert.equal(unknownDose.code, "02", "expected the unknown-dose skip to be the OPV resource");
console.log("PASS: both an unmapped vaccine code and an unmapped dose number are reported as skipped, with distinct reasons");

// buildDataValueSet now returns one payload PER DATASET, since DHIS2
// rejects a single import whose data elements span more than one dataset.
const dataValueSets = buildDataValueSet(counts);
assert.equal(dataValueSets.length, 2, "expected 2 dataset groups: Child Health and Reproductive Health");

const childHealthSet = dataValueSets.find((dvs) => dvs.dataSet === CHILD_HEALTH);
const reproHealthSet = dataValueSets.find((dvs) => dvs.dataSet === REPRODUCTIVE_HEALTH);
assert.equal(childHealthSet?.dataValues.length, 6, "expected 6 Child Health rows (2 BCG + 1 YF + 1 Measles + 1 OPV1 + 1 Penta2 periods)");
assert.equal(reproHealthSet?.dataValues.length, 1, "expected 1 Reproductive Health row (TT1)");
console.log("PASS: buildDataValueSet groups rows into separate payloads by dataset");

[...childHealthSet.dataValues, ...reproHealthSet.dataValues].forEach((dv) => {
  assert.equal(dv.orgUnit, "DiszpKrYNg8", "expected the fixed Ngelehun CHC org unit on every row");
});
childHealthSet.dataValues.forEach((dv) => {
  assert.equal(dv.categoryOptionCombo, CHILD_HEALTH_COC, "expected the 'Fixed, <1y' category option combo on every Child Health row");
});
reproHealthSet.dataValues.forEach((dv) => {
  assert.equal(dv.categoryOptionCombo, TT_COC, "expected the TT-specific category option combo on the Reproductive Health row");
});
console.log("PASS: buildDataValueSet applies the fixed orgUnit, and the correct per-dataset categoryOptionCombo, to every row");

console.log("\nAll tests passed.");
