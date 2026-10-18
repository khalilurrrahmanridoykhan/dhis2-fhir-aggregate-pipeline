// Maps a FHIR Immunization's vaccineCode (CVX system) to a real DHIS2
// aggregate data element in the public Sierra Leone demo database
// (https://play.im.dhis2.org/stable-2-43-2).
//
// Every entry here was independently cross-checked against the CDC's own
// CVX code set before being added -- not guessed. Any vaccine code not in
// this table is reported as "skipped", never silently dropped -- see
// lib/aggregate.mjs.
//
// OPV0-3, PCV1-3, Penta1-3, and TT1-5 are deliberately NOT here, for a
// different reason than "code not verified": each of those vaccines has a
// SEPARATE DHIS2 data element per dose number (e.g. "OPV0 doses given" vs
// "OPV1 doses given"), but a FHIR vaccineCode alone only identifies the
// vaccine product, not which dose in the series it was -- that lives in
// protocolApplied.doseNumber, a completely different field. Mapping these
// correctly needs a two-key (vaccine + dose number) lookup, not the simple
// single-key table below -- a real, separate piece of work, not an
// oversight.

export const vaccineMapping = {
  // CVX 19 -- BCG Bacillus Calmette-Guerin vaccine
  "19": { dataElement: "s46m5MS0hxu", label: "BCG doses given" },
  // CVX 37 -- yellow fever live
  "37": { dataElement: "l6byfWFUGaP", label: "Yellow Fever doses given" },
  // CVX 05 -- measles (standalone, not MMR -- CDC lists this as "Inactive,"
  // meaning it's kept for recording historical doses, not invalid data)
  "05": { dataElement: "YtbsuPPo010", label: "Measles doses given" },
};
