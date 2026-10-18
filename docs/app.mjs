import { fetchImmunizations } from "./lib/fetchImmunizations.mjs";
import { aggregateByVaccineAndPeriod } from "./lib/aggregate.mjs";
import { buildDataValueSet } from "./lib/buildDataValueSet.mjs";

const resourcesText = document.getElementById("resources-text");
const fhirUrl = document.getElementById("fhir-url");
const fhirCount = document.getElementById("fhir-count");
const statusEl = document.getElementById("status");
const reportEl = document.getElementById("report");
const writeNote = document.getElementById("write-note");
const writeCommand = document.getElementById("write-command");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

document.querySelector('[data-example="fixture"]').addEventListener("click", async () => {
  try {
    setStatus("Loading sample fixture...");
    const response = await fetch("fixtures/sample-immunizations.json");
    resourcesText.value = await response.text();
    setStatus("Sample fixture loaded.");
  } catch (err) {
    setStatus(err.message, true);
  }
});

document.querySelector('[data-fetch="fhir"]').addEventListener("click", async () => {
  const url = fhirUrl.value.trim();
  if (!url) {
    setStatus("Enter a FHIR server base URL first.", true);
    return;
  }
  try {
    setStatus("Fetching from the FHIR server...");
    const count = Number(fhirCount.value) || 20;
    const resources = await fetchImmunizations(url, { count, maxPages: 5 });
    resourcesText.value = JSON.stringify(resources, null, 2);
    setStatus(`Fetched ${resources.length} resource(s).`);
  } catch (err) {
    setStatus(
      `Could not fetch: ${err.message}. The server may not allow cross-origin requests from a browser.`,
      true
    );
  }
});

document.getElementById("aggregate-btn").addEventListener("click", () => {
  reportEl.innerHTML = "";
  writeNote.style.display = "none";

  let resources;
  try {
    resources = JSON.parse(resourcesText.value);
    if (!Array.isArray(resources)) throw new Error("expected a JSON array of resources");
  } catch (err) {
    setStatus(`Not valid JSON: ${err.message}`, true);
    return;
  }

  const { counts, skipped } = aggregateByVaccineAndPeriod(resources);
  const dataValueSets = buildDataValueSet(counts);
  const totalRows = dataValueSets.reduce((sum, dvs) => sum + dvs.dataValues.length, 0);

  setStatus(
    `Aggregated ${resources.length} resource(s) into ${totalRows} dataValue row(s) across ${dataValueSets.length} dataset(s), ${skipped.length} skipped.`
  );

  dataValueSets.forEach((dvs) => {
    const heading = document.createElement("h3");
    heading.style.margin = "10px 0 4px";
    heading.style.fontSize = "0.9rem";
    heading.textContent = `dataSet: ${dvs.dataSet}`;
    reportEl.appendChild(heading);

    const table = document.createElement("table");
    table.innerHTML = `
      <thead><tr><th>dataElement</th><th>period</th><th>value</th></tr></thead>
      <tbody>
        ${dvs.dataValues
          .map((dv) => `<tr><td>${dv.dataElement}</td><td>${dv.period}</td><td>${dv.value}</td></tr>`)
          .join("")}
      </tbody>
    `;
    reportEl.appendChild(table);
  });

  if (skipped.length) {
    const div = document.createElement("div");
    div.className = "skipped";
    div.textContent = `Skipped: ${skipped.map((s) => `${s.id ?? "?"} (${s.reason})`).join(", ")}`;
    reportEl.appendChild(div);
  }

  if (totalRows) {
    writeCommand.textContent = `node run.mjs <your-source.json> --write`;
    writeNote.style.display = "block";
  }
});
