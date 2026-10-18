// Fetches every Immunization resource from a FHIR search, following the
// Bundle's "next" link across pages until none remains.

export async function fetchImmunizations(baseUrl, { count = 20, maxPages = 20 } = {}) {
  let url = `${baseUrl}/Immunization?_count=${count}`;
  let resources = [];
  let pages = 0;

  while (url && pages < maxPages) {
    const response = await fetch(url);
    const bundle = await response.json();

    const pageResources = bundle.entry?.map((entry) => entry.resource) ?? [];
    resources = resources.concat(pageResources);

    const nextLink = bundle.link?.find((link) => link.relation === "next");
    url = nextLink?.url ?? null;
    pages += 1;
  }

  return resources;
}
