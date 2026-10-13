export function queryParams(params = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.append(key, value);
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}