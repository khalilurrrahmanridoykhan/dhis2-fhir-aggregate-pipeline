// Reads the dose number from a FHIR Immunization's protocolApplied,
// handling the doseNumber[x] choice type (doseNumberPositiveInt or
// doseNumberString). A non-numeric string (e.g. "booster") deliberately
// returns null rather than guessing -- out of scope for v1.

export function readDoseNumber(resource) {
  const protocol = resource.protocolApplied?.[0];
  if (!protocol) return null;

  if (typeof protocol.doseNumberPositiveInt === "number") {
    return protocol.doseNumberPositiveInt;
  }

  const parsed = Number.parseInt(protocol.doseNumberString, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
