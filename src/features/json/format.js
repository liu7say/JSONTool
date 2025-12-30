import { stringifyJson } from './stringify'

export const formatJsonText = (doc, { indent = 2 } = {}) => {
  if (!doc || doc.parseError) {
    return { text: null, error: doc?.parseError || 'JSON 解析失败' }
  }

  return { text: stringifyJson({ value: doc.parsedValue, indent }), error: null }
}


