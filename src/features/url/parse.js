export const parseUrl = (text) => {
  const raw = (text || '').trim()
  if (!raw) return { url: null, error: 'URL 为空' }

  try {
    return { url: new URL(raw), error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { url: null, error: message }
  }
}


