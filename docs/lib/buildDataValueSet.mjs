// Fixed v1 dimensions -- see README for why these are hardcoded rather than
// resolved from the FHIR data.
const ORG_UNIT = "DiszpKrYNg8"; // Ngelehun CHC
const CATEGORY_OPTION_COMBO = "Prlt0C1RF0s"; // "Fixed, <1y"

export function buildDataValueSet(counts) {
  const dataValues = [...counts.entries()].map(([key, value]) => {
    const [dataElement, period] = key.split("|");
    return {
      dataElement,
      period,
      orgUnit: ORG_UNIT,
      categoryOptionCombo: CATEGORY_OPTION_COMBO,
      value: String(value),
    };
  });

  return { dataValues };
}
