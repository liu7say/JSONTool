const stripBom = (text) => {
  if (!text) return ''
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

export const tryParseJson = (sourceText) => {
  const text = stripBom(typeof sourceText === 'string' ? sourceText : String(sourceText ?? ''))
  if (!text.trim()) {
    return { parsedValue: null, parseError: null }
  }

  try {
    return { parsedValue: JSON.parse(text), parseError: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { parsedValue: null, parseError: message }
  }
}


