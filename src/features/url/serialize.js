export const serializeUrl = (url, { sortParams = true } = {}) => {
  if (!url) return ''
  const out = new URL(url.toString())

  if (sortParams) {
    const entries = Array.from(out.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b))
    out.search = ''
    entries.forEach(([k, v]) => out.searchParams.append(k, v))
  }

  return out.toString()
}


