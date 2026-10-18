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

**Vaccine mapping** (`lib/vaccineMapping.mjs`): only 2 entries, both real CVX codes independently cross-checked against the CDC's own CVX code set before being added:
- CVX `19` (BCG) -> `BCG doses given`
- CVX `37` (Yellow Fever) -> `Yellow Fever doses given`

Any other vaccine code is reported as **skipped**, not silently dropped or miscounted. The Sierra Leone demo database has "doses given" data elements for more EPI vaccines (Measles, OPV0-3, PCV1-3, Penta1-3, TT1-5) -- they're left unmapped here because their exact CVX codes weren't independently verified; adding them is a natural next step once confirmed against the CDC list, not a silent gap.

**Fixed dimensions**, not resolved from the data:
- `orgUnit` -- every count is written against `Ngelehun CHC`. Real FHIR -> DHIS2 org unit resolution (from a FHIR `Location`/`Organization` reference) is a separate, nontrivial problem, out of scope here.
- `categoryOptionCombo` -- every count uses `"Fixed, <1y"`. Real disaggregation by the patient's actual age or service-delivery type would need reading the FHIR `Patient`'s birth date and the `Encounter`/`Location` type -- out of scope here.
- `period` -- this one **is** computed for real, from each resource's `occurrenceDateTime`, at monthly granularity (`YYYYMM`), matching the target dataset's period type.

**A known, honest mismatch**: public FHIR test sandboxes (`hapi.fhir.org`, `r4.smarthealthit.org`) carry US/Synthea-generated *adult* immunization data (flu, COVID, Tdap) -- none of which overlaps with Sierra Leone's EPI childhood schedule. Running this against those sandboxes will complete successfully but report everything as skipped. `fixtures/sample-immunizations.json` exists specifically so the pipeline has real, matching data to demonstrate against.

## Running the tests

```bash
npm test
# or directly:
node run.test.mjs
```

## License

MIT -- see [LICENSE](LICENSE).
