// Maps a FHIR Immunization's vaccineCode (CVX system) to a real DHIS2
// aggregate data element in the public Sierra Leone demo database
// (https://play.im.dhis2.org/stable-2-43-2).
//
// Every entry here was independently cross-checked against the CDC's own
// primary CVX data file (not a third-party mirror) before being added. Any
// vaccine code not in this table is reported as "skipped", never silently
// dropped -- see lib/aggregate.mjs.
//
// Each entry also carries the real DHIS2 dataset AND categoryOptionCombo
// its data element(s) actually accept -- both confirmed directly against
// the server, not assumed. Two real, separate write failures surfaced this
// while building it: (1) writing dataValues whose data elements span more
// than one dataset in a single import fails with "Data set detection
// failed", because DHIS2 can't auto-infer one dataset for a mixed batch;
// (2) a categoryOptionCombo valid for one data element can be rejected by
// another ("not usable with category option combo(s)"), because they use
// different categoryCombos entirely. Every vaccine here is Child Health
// with the "Location and age group" categoryCombo EXCEPT TT, which is
// Reproductive Health with its own "TT" categoryCombo (pregnant/
// non-pregnant x fixed/outreach/school, not age) -- tetanus toxoid is a
// maternal-health vaccine in this EPI schedule, not a childhood one.
// lib/buildDataValueSet.mjs groups the write by dataset to handle this.
//
// Two kinds of entries:
//
// "simple" -- a single-dose vaccine, one CVX code maps directly to one
// DHIS2 data element.
//
// "by-dose" -- a multi-dose vaccine where DHIS2 has a SEPARATE data element
// per dose number in the series (e.g. "OPV0 doses given" vs "OPV1 doses
// given"). A FHIR vaccineCode alone only identifies the vaccine product,
// not which dose it was -- that's protocolApplied.doseNumber[x], a
// different field, read by lib/doseNumber.mjs. OPV's doses start at 0 (the
// birth dose); PCV/Penta run 1-3; TT runs 1-5.

const CHILD_HEALTH = "BfMAe6Itzgt";
const REPRODUCTIVE_HEALTH = "QX4ZTUbOt3a";

// "Location and age group" categoryCombo, option "Fixed, <1y" -- used by
// every Child Health vaccine here.
const CHILD_HEALTH_COC = "Prlt0C1RF0s";
// "TT" categoryCombo, option "Pregnant, Fixed" -- used by TT. A fixed
// simplification, same spirit as the fixed org unit: this pipeline doesn't
// read the FHIR Patient's pregnancy status, so every TT dose is recorded
// under one option rather than resolved per resource.
const TT_COC = "dcguXUTwenI";

export const vaccineMapping = {
  // CVX 19 -- BCG Bacillus Calmette-Guerin vaccine
  "19": {
    kind: "simple",
    dataset: CHILD_HEALTH,
    categoryOptionCombo: CHILD_HEALTH_COC,
    dataElement: "s46m5MS0hxu",
    label: "BCG doses given",
  },
  // CVX 37 -- yellow fever live
  "37": {
    kind: "simple",
    dataset: CHILD_HEALTH,
    categoryOptionCombo: CHILD_HEALTH_COC,
    dataElement: "l6byfWFUGaP",
    label: "Yellow Fever doses given",
  },
  // CVX 05 -- measles (standalone, not MMR -- CDC lists this as "Inactive,"
  // meaning it's kept for recording historical doses, not invalid data)
  "05": {
    kind: "simple",
    dataset: CHILD_HEALTH,
    categoryOptionCombo: CHILD_HEALTH_COC,
    dataElement: "YtbsuPPo010",
    label: "Measles doses given",
  },

  // CVX 02 -- OPV, trivalent (Inactive -- no longer manufactured, but still
  // the correct historical code; OPV is no longer produced per CDC's own
  // business rules, yet real records using it still exist)
  "02": {
    kind: "by-dose",
    dataset: CHILD_HEALTH,
    categoryOptionCombo: CHILD_HEALTH_COC,
    label: "OPV",
    byDose: { 0: "x3Do5e7g4Qo", 1: "pikOziyCXbM", 2: "O05mAByOgAv", 3: "vI2csg55S9C" },
  },
  // CVX 152 -- Pneumococcal Conjugate, unspecified formulation
  "152": {
    kind: "by-dose",
    dataset: CHILD_HEALTH,
    categoryOptionCombo: CHILD_HEALTH_COC,
    label: "PCV",
    byDose: { 1: "xc8gmAKfO95", 2: "mGN1az8Xub6", 3: "L2kxa2IA2cs" },
  },
  // CVX 198 -- DTP-hepB-Hib Pentavalent Non-US (the WHO/Gavi pentavalent EPI vaccine)
  "198": {
    kind: "by-dose",
    dataset: CHILD_HEALTH,
    categoryOptionCombo: CHILD_HEALTH_COC,
    label: "Penta",
    byDose: { 1: "fClA2Erf6IO", 2: "I78gJm4KBo7", 3: "n6aMJNLdvep" },
  },
  // CVX 35 -- tetanus toxoid, adsorbed (the standard WHO EPI formulation;
  // not CVX 142 "not adsorbed"). Reproductive Health, with its own "TT"
  // categoryCombo -- see the module-level note above.
  "35": {
    kind: "by-dose",
    dataset: REPRODUCTIVE_HEALTH,
    categoryOptionCombo: TT_COC,
    label: "TT",
    byDose: { 1: "zzHwXqxKYy1", 2: "DUTSJE8MGCw", 3: "jWaNoH0X0Am", 4: "tbudfYMNFS5", 5: "B2ocYtYkPBD" },
  },
};
