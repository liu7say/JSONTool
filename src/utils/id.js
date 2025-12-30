export const createId = () => {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  // 退化方案：足够用于本地历史记录的唯一性（不用于安全目的）
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}


