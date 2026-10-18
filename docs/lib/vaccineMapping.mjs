// Maps a FHIR Immunization's vaccineCode (CVX system) to a real DHIS2
// aggregate data element in the public Sierra Leone demo database
// (https://play.im.dhis2.org/stable-2-43-2).
//
// Both entries were independently cross-checked against the CDC's own CVX
// code set before being added here -- not guessed. Every other EPI vaccine
// the demo database has a "doses given" data element for (Measles, OPV0-3,
// PCV1-3, Penta1-3, TT1-5) is deliberately left unmapped for v1: their exact
// CVX codes weren't independently verified, so a wrong guess here would
// silently miscount real data. Any vaccine code not in this table is
// reported as "skipped", never silently dropped -- see lib/aggregate.mjs.

export const vaccineMapping = {
  // CVX 19 -- BCG Bacillus Calmette-Guerin vaccine
  "19": { dataElement: "s46m5MS0hxu", label: "BCG doses given" },
  // CVX 37 -- yellow fever live
  "37": { dataElement: "l6byfWFUGaP", label: "Yellow Fever doses given" },
};
