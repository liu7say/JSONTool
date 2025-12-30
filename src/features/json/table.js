const isPlainObject = (v) => {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

const collectColumns = (rows) => {
  const set = new Set()
  rows.forEach((row) => {
    if (!isPlainObject(row)) return
    Object.keys(row).forEach((k) => set.add(k))
  })
  return Array.from(set)
}

const cellToText = (v) => {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return JSON.stringify(v)
}

export const jsonToTable = (doc) => {
  if (!doc || doc.parseError) {
    return { columns: [], rows: [], error: doc?.parseError || 'JSON 解析失败' }
  }

  const value = doc.parsedValue
  const rows = Array.isArray(value) ? value : []
  if (!rows.length) return { columns: [], rows: [], error: '仅支持数组作为表格数据（例如：[{"a":1}]）' }

  const columns = collectColumns(rows)
  const normalizedRows = rows.map((row, idx) => {
    if (!isPlainObject(row)) {
      return { __rowId: idx, value: cellToText(row) }
    }
    const out = { __rowId: idx }
    columns.forEach((k) => {
      out[k] = cellToText(row[k])
    })
    return out
  })

  const normalizedColumns = columns.length ? columns : ['value']
  return { columns: normalizedColumns, rows: normalizedRows, error: null }
}


