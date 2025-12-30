import { stringifyJson } from './stringify'

const isNumericKey = (key) => /^[0-9]+$/.test(key)

const normalizeNumericKey = (key) => {
  // "00012" -> "12"；保留单个 "0"
  const normalized = String(key).replace(/^0+(?=\d)/, '')
  return normalized || '0'
}

const compareJsonObjectKeys = (a, b) => {
  const aStr = String(a)
  const bStr = String(b)
  const aIsNum = isNumericKey(aStr)
  const bIsNum = isNumericKey(bStr)

  if (aIsNum && bIsNum) {
    const aNorm = normalizeNumericKey(aStr)
    const bNorm = normalizeNumericKey(bStr)
    if (aNorm.length !== bNorm.length) return aNorm.length - bNorm.length
    const byLex = aNorm.localeCompare(bNorm)
    if (byLex) return byLex
    if (aStr.length !== bStr.length) return aStr.length - bStr.length
    return aStr.localeCompare(bStr)
  }

  if (aIsNum !== bIsNum) return aIsNum ? -1 : 1

  // 字母排序：a-z（不区分大小写），再用原始比较保证稳定
  return aStr.localeCompare(bStr, 'en', { sensitivity: 'base' }) || aStr.localeCompare(bStr)
}

const sortObjectKeysDeep = (value) => {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(sortObjectKeysDeep)

  const out = {}
  Object.keys(value)
    .sort(compareJsonObjectKeys)
    .forEach((k) => {
      out[k] = sortObjectKeysDeep(value[k])
    })
  return out
}

export const sortJsonKeys = (doc, { indent = 2 } = {}) => {
  if (!doc || doc.parseError) {
    return { text: null, error: doc?.parseError || 'JSON 解析失败' }
  }

  const sorted = sortObjectKeysDeep(doc.parsedValue)
  return { text: stringifyJson({ value: sorted, indent }), error: null }
}


