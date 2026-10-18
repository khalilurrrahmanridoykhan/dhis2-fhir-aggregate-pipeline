// Fixed v1 dimension -- see README for why this is hardcoded rather than
// resolved from the FHIR data.
const ORG_UNIT = "DiszpKrYNg8"; // Ngelehun CHC

// Returns one dataValueSet payload PER DATASET, not one payload overall.
// DHIS2 rejects a single import whose data elements span more than one
// dataset ("Data set detection failed") -- see the note in
// vaccineMapping.mjs. counts is keyed
// "dataset|categoryOptionCombo|dataElement|period".
export function buildDataValueSet(counts) {
  const byDataset = new Map();

  for (const [key, value] of counts.entries()) {
    const [dataset, categoryOptionCombo, dataElement, period] = key.split("|");
    if (!byDataset.has(dataset)) byDataset.set(dataset, []);
    byDataset.get(dataset).push({
      dataElement,
      period,
      orgUnit: ORG_UNIT,
      categoryOptionCombo,
      value: String(value),
    });
  }

  return [...byDataset.entries()].map(([dataSet, dataValues]) => ({ dataSet, dataValues }));
}
