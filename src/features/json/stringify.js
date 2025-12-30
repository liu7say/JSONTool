export const stringifyJson = ({ value, indent = 2, sortKeys = false } = {}) => {
  const space = Math.max(0, Math.min(8, Number(indent) || 0))

  const replacer = sortKeys
    ? (key, v) => {
        if (!v || typeof v !== 'object' || Array.isArray(v)) return v
        const out = {}
        Object.keys(v)
          .sort()
          .forEach((k) => {
            out[k] = v[k]
          })
        return out
      }
    : null

  return JSON.stringify(value, replacer, space)
}


