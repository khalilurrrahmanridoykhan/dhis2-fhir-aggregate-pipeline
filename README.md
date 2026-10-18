# DHIS2 FHIR Aggregate Pipeline

[![CI](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-aggregate-pipeline/actions/workflows/ci.yml/badge.svg)](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-aggregate-pipeline/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Fetches FHIR `Immunization` resources, counts them by vaccine and month, and writes the totals into DHIS2's **Aggregate API** (`dataValueSets`) -- a genuinely different data model from DHIS2's Tracker API, which stores one record per individual event rather than one summarized count per period.

Written as a companion exploration to two DHIS2/FHIR apps ([`dhis2-fhir-mapping-studio`](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-mapping-studio) and [`dhis2-fhir-sync-console`](https://github.com/khalilurrrahmanridoykhan/dhis2-fhir-sync-console)) that both write to DHIS2 Tracker. This one is standalone -- no code or runtime dependency on either.

## What it does

```bash
node run.mjs <fhir-source.json-or-url>            # dry run: fetch, aggregate, print
node run.mjs <fhir-source.json-or-url> --write     # also POST the aggregate to DHIS2
```

`<fhir-source>` can be a local JSON file (an array of Immunization resources) or an `http(s)://` FHIR search URL.

```bash
node run.mjs fixtures/sample-immunizations.json
node run.mjs fixtures/sample-immunizations.json --write
node run.mjs "https://r4.smarthealthit.org/Immunization?_count=20"
```

## The real DHIS2 target

This writes to DHIS2's public demo instance, confirmed live: `https://play.im.dhis2.org/stable-2-43-2` (login `admin`/`district`, hardcoded in `run.mjs` -- never a pattern to copy for real credentials). It resets nightly, so writing test data to it is safe.

Specifically, it writes to the real **"BCG doses given"** and **"Yellow Fever doses given"** data elements already present in that instance's Sierra Leone demo database, under the `Child Health` dataset, at the `Ngelehun CHC` org unit.

## Scope -- what this does and doesn't handle

This is a mini pipeline with a deliberately bounded v1, not a general-purpose one.

**Vaccine mapping** (`lib/vaccineMapping.mjs`): 7 vaccines across two kinds, every CVX code independently cross-checked against the CDC's own primary CVX data file before being added -- never guessed.

Single-dose vaccines (one CVX code -> one data element):
- CVX `19` (BCG) -> `BCG doses given`
- CVX `37` (Yellow Fever) -> `Yellow Fever doses given`
- CVX `05` (measles, standalone) -> `Measles doses given`

Multi-dose vaccines (one CVX code -> a *different* data element per dose number, resolved via `lib/doseNumber.mjs` reading `protocolApplied.doseNumber`, since a FHIR `vaccineCode` alone only identifies the vaccine product, not which dose in the series it was):
- CVX `02` (OPV) -> `OPV0`/`OPV1`/`OPV2`/`OPV3 doses given` (dose `0` is the birth dose)
- CVX `152` (PCV, unspecified formulation) -> `PCV1`/`PCV2`/`PCV3 doses given`
- CVX `198` (DTP-hepB-Hib Pentavalent Non-US -- the WHO/Gavi pentavalent EPI vaccine) -> `Penta1`/`Penta2`/`Penta3 doses given`
- CVX `35` (tetanus toxoid, adsorbed) -> `TT1`-`TT5 doses given`

**Two real DHIS2 write constraints discovered while building this** (not assumed, hit as actual `409 Conflict` responses from the live demo server):

1. **A single `dataValueSets` import can't span more than one dataset.** Every vaccine above belongs to the `Child Health` dataset **except TT**, which belongs to `Reproductive Health` -- tetanus toxoid is a maternal-health vaccine in this EPI schedule, not a childhood one. Writing both together in one request fails with `"Data set detection failed"`. `lib/buildDataValueSet.mjs` groups the aggregate into one payload per dataset, and `run.mjs`/the browser demo each POST once per group.
2. **A `categoryOptionCombo` is specific to a data element's own `categoryCombo`, not universal.** The Child Health vaccines all share a `"Location and age group"` categoryCombo (option used: `"Fixed, <1y"`), but TT uses its own `"TT"` categoryCombo (pregnant/non-pregnant x fixed/outreach/school -- not age at all). Using the Child Health option for a TT value fails with `"not usable with category option combo(s)"`. Each vaccine mapping entry now carries its own correct `categoryOptionCombo`, confirmed against the server, not just the org unit's.

Both are documented, fixed simplifications for v1 -- this pipeline doesn't read the FHIR `Patient`'s pregnancy status to choose among TT's six real category options, it records every TT dose under one (`"Pregnant, Fixed"`), the same kind of fixed-dimension simplification as the org unit below.

Any vaccine code not in this table is reported as **skipped** with a reason (`"unmapped vaccine code"`). For a multi-dose vaccine whose dose number is missing or doesn't match a known dose (e.g. a non-numeric `doseNumberString` like `"booster"`, or a dose number with no corresponding data element), it's also reported skipped, with its own reason (`"unknown dose number for <vaccine>"`) -- never guessed or silently dropped either way.

**Fixed dimensions**, not resolved from the data:
- `orgUnit` -- every count is written against `Ngelehun CHC`. Real FHIR -> DHIS2 org unit resolution (from a FHIR `Location`/`Organization` reference) is a separate, nontrivial problem, out of scope here.
- `categoryOptionCombo` -- fixed *per vaccine* (see above: `"Fixed, <1y"` for Child Health vaccines, `"Pregnant, Fixed"` for TT), not fixed globally. Real disaggregation by the patient's actual age, pregnancy status, or service-delivery type would need reading the FHIR `Patient`'s birth date and the `Encounter`/`Location` type -- out of scope here.
- `period` -- this one **is** computed for real, from each resource's `occurrenceDateTime`, at monthly granularity (`YYYYMM`), matching each target dataset's period type.

**A known, honest mismatch**: public FHIR test sandboxes (`hapi.fhir.org`, `r4.smarthealthit.org`) carry US/Synthea-generated *adult* immunization data (flu, COVID, Tdap) -- none of which overlaps with Sierra Leone's EPI childhood schedule. Running this against those sandboxes will complete successfully but report everything as skipped. `fixtures/sample-immunizations.json` exists specifically so the pipeline has real, matching data to demonstrate against.

## Running the tests

```bash
npm test
# or directly:
node run.test.mjs
```

## License

MIT -- see [LICENSE](LICENSE).
