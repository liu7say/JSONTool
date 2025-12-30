import { createId } from '../utils/id'
import { tryParseJson } from '../features/json/parse'

const now = () => Date.now()

export const createDocument = (sourceText = '') => {
  const { parsedValue, parseError } = tryParseJson(sourceText)

  return {
    id: createId(),
    sourceText,
    parsedValue,
    parseError,
    updatedAt: now(),
  }
}

export const updateDocumentText = (doc, sourceText) => {
  const { parsedValue, parseError } = tryParseJson(sourceText)

  return {
    ...doc,
    sourceText,
    parsedValue,
    parseError,
    updatedAt: now(),
  }
}


