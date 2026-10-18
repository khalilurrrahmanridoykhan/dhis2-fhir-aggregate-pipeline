import { readFileSync } from "node:fs";
import { fetchImmunizations } from "./lib/fetchImmunizations.mjs";
import { aggregateByVaccineAndPeriod } from "./lib/aggregate.mjs";
import { buildDataValueSet } from "./lib/buildDataValueSet.mjs";

// Public demo instance, resets nightly -- never a pattern to copy for real credentials.
const DHIS2_BASE_URL = "https://play.im.dhis2.org/stable-2-43-2";
const DHIS2_AUTH = { username: "admin", password: "district" };

async function loadResources(source) {
  if (/^https?:\/\//.test(source)) {
    if (source.includes("/Immunization")) {
      // A full search URL -- fetch just that one page, no pagination.
      const response = await fetch(source);
      const bundle = await response.json();
      return bundle.entry?.map((entry) => entry.resource) ?? [];
    }
    return fetchImmunizations(source);
  }
  return JSON.parse(readFileSync(source, "utf8"));
}

async function writeToDhis2(dataValueSet) {
  const credentials = Buffer.from(`${DHIS2_AUTH.username}:${DHIS2_AUTH.password}`).toString("base64");
  const response = await fetch(`${DHIS2_BASE_URL}/api/dataValueSets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(dataValueSet),
  });
  return response.json();
}

async function main() {
  const [source, flag] = process.argv.slice(2);
  if (!source) {
    console.error("Usage: node run.mjs <fhir-source.json-or-url> [--write]");
    process.exit(1);
  }

  const resources = await loadResources(source);
  console.log(`Fetched ${resources.length} Immunization resource(s) from ${source}`);

  const { counts, skipped } = aggregateByVaccineAndPeriod(resources);
  const dataValueSets = buildDataValueSet(counts);
  const totalRows = dataValueSets.reduce((sum, dvs) => sum + dvs.dataValues.length, 0);

  console.log(`\nAggregated into ${totalRows} dataValue(s) across ${dataValueSets.length} dataset(s):`);
  dataValueSets.forEach((dvs) => {
    console.log(`  dataSet=${dvs.dataSet}`);
    dvs.dataValues.forEach((dv) =>
      console.log(`    dataElement=${dv.dataElement} period=${dv.period} value=${dv.value}`)
    );
  });

  if (skipped.length) {
    console.log(`\nSkipped (not counted): ${skipped.length}`);
    skipped.forEach((s) => console.log(`  resource ${s.id}: code=${s.code} -- ${s.reason}`));
  }

  if (flag === "--write") {
    for (const dataValueSet of dataValueSets) {
      console.log(`\nWriting dataSet=${dataValueSet.dataSet} to DHIS2...`);
      const result = await writeToDhis2(dataValueSet);
      console.log(JSON.stringify(result, null, 2));
    }
  } else {
    console.log("\n(dry run -- pass --write to actually POST to DHIS2)");
  }
}

main();
