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

// 扫描 JSON 中所有可用的数组路径（只扫描 2 层深度）
export const findArrayPaths = (value, maxDepth = 2) => {
  const paths = []

  // 顶层就是数组
  if (Array.isArray(value)) {
    paths.push('')
  }

  // 顶层是对象，扫描第一层
  if (isPlainObject(value)) {
    Object.keys(value).forEach(key => {
      if (Array.isArray(value[key])) {
        paths.push(key)
      }
      // 如果允许扫描第二层
      if (maxDepth >= 2 && isPlainObject(value[key])) {
        Object.keys(value[key]).forEach(subKey => {
          if (Array.isArray(value[key][subKey])) {
            paths.push(`${key}.${subKey}`)
          }
        })
      }
    })
  }

  return paths
}

// 按路径提取数组
export const extractArrayByPath = (value, path) => {
  if (!path || path === '') return value

  const keys = path.split('.')
  let current = value

  for (const key of keys) {
    if (!current || typeof current !== 'object') return null
    current = current[key]
  }

  return current
}

export const jsonToTable = (doc, path = '') => {
  if (!doc || doc.parseError) {
    return { columns: [], rows: [], error: doc?.parseError || 'JSON 解析失败' }
  }

  const value = doc.parsedValue

  // 按路径提取数组
  const array = extractArrayByPath(value, path)

  if (!Array.isArray(array)) {
    return { columns: [], rows: [], error: '所选路径不是数组，请选择其他路径' }
  }

  if (!array.length) {
    return { columns: [], rows: [], error: '数组为空' }
  }

  const columns = collectColumns(array)
  const normalizedRows = array.map((row, idx) => {
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


