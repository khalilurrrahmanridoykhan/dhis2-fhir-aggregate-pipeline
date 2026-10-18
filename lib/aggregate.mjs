import { vaccineMapping } from "./vaccineMapping.mjs";
import { toDhis2MonthlyPeriod } from "./period.mjs";

// Groups a list of FHIR Immunization resources into per-(dataElement,
// period) counts, using vaccineMapping to translate each resource's
// vaccineCode into a real DHIS2 data element. Any resource whose code isn't
// in vaccineMapping is reported in `skipped`, not silently dropped.
export function aggregateByVaccineAndPeriod(resources) {
  const counts = new Map();
  const skipped = [];

  for (const resource of resources) {
    const code = resource.vaccineCode?.coding?.[0]?.code;
    const mapping = code ? vaccineMapping[code] : undefined;

    if (!mapping) {
      skipped.push({ id: resource.id, code: code ?? null });
      continue;
    }

    const period = toDhis2MonthlyPeriod(resource.occurrenceDateTime);
    const key = `${mapping.dataElement}|${period}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return { counts, skipped };
}
