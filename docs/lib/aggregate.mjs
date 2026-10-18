import { vaccineMapping } from "./vaccineMapping.mjs";
import { toDhis2MonthlyPeriod } from "./period.mjs";
import { readDoseNumber } from "./doseNumber.mjs";

// Groups a list of FHIR Immunization resources into per-(dataElement,
// period) counts, using vaccineMapping to translate each resource's
// vaccineCode (and, for multi-dose vaccines, its dose number) into a real
// DHIS2 data element. Any resource that can't be resolved is reported in
// `skipped`, not silently dropped.
export function aggregateByVaccineAndPeriod(resources) {
  const counts = new Map();
  const skipped = [];

  for (const resource of resources) {
    const code = resource.vaccineCode?.coding?.[0]?.code;
    const mapping = code ? vaccineMapping[code] : undefined;

    if (!mapping) {
      skipped.push({ id: resource.id, code: code ?? null, reason: "unmapped vaccine code" });
      continue;
    }

    let dataElement;
    if (mapping.kind === "simple") {
      dataElement = mapping.dataElement;
    } else {
      const doseNumber = readDoseNumber(resource);
      dataElement = doseNumber != null ? mapping.byDose[doseNumber] : undefined;
      if (!dataElement) {
        skipped.push({
          id: resource.id,
          code,
          reason: `unknown dose number (${doseNumber ?? "missing"}) for ${mapping.label}`,
        });
        continue;
      }
    }

    const period = toDhis2MonthlyPeriod(resource.occurrenceDateTime);
    // dataset and categoryOptionCombo are both part of the key -- see the
    // note in vaccineMapping.mjs on why a write must be grouped by these,
    // not just dataElement+period.
    const key = `${mapping.dataset}|${mapping.categoryOptionCombo}|${dataElement}|${period}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return { counts, skipped };
}
