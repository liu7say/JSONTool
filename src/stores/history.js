import { defineStore } from 'pinia'
import { compressToUTF16, decompressFromUTF16 } from 'lz-string'
import { createHistoryEntry } from '../domain/historyEntry'
import {
  loadHistoryBlob,
  loadHistoryIndex,
  removeHistoryBlob,
  saveHistoryBlob,
  saveHistoryIndex,
} from '../services/storage'

const HISTORY_LIMIT = 200

const encodeBlob = (data) => compressToUTF16(JSON.stringify(data))
const decodeBlob = (text) => JSON.parse(decompressFromUTF16(text))

const toIndexItem = (entry, blobSize) => {
  return {
    id: entry.id,
    title: entry.title,
    createdAt: entry.createdAt,
    size: blobSize,
  }
}

const trimIndex = (index) => {
  if (index.length <= HISTORY_LIMIT) return { index, removedIds: [] }
  const removed = index.slice(HISTORY_LIMIT)
  return { index: index.slice(0, HISTORY_LIMIT), removedIds: removed.map((i) => i.id) }
}

export const useHistoryStore = defineStore('history', {
  state: () => ({
    index: [],
    isLoading: false,
    hasLoaded: false,
    lastError: null,
  }),
  actions: {
    loadIndex() {
      this.isLoading = true
      this.lastError = null

      return loadHistoryIndex()
        .then((index) => {
          this.index = index
          this.hasLoaded = true
        })
        .catch((error) => {
          this.lastError = error instanceof Error ? error.message : String(error)
        })
        .finally(() => {
          this.isLoading = false
        })
    },

    saveEntry({ doc, toolState, title }) {
      const entry = createHistoryEntry({ doc, toolState, title })
      const blobText = encodeBlob(entry)
      const indexItem = toIndexItem(entry, blobText.length)

      this.lastError = null

      return saveHistoryBlob(entry.id, blobText)
        .then(() => {
          const nextIndex = [indexItem, ...this.index]
          const { index, removedIds } = trimIndex(nextIndex)
          this.index = index
          return saveHistoryIndex(index).then(() => removedIds)
        })
        .then((removedIds) => {
          if (!removedIds.length) return
          return removeHistoryBlob(removedIds)
        })
        .catch((error) => {
          this.lastError = error instanceof Error ? error.message : String(error)
          throw error
        })
    },

    loadEntry(id) {
      this.lastError = null
      return loadHistoryBlob(id).then((blobText) => {
        if (!blobText) return null
        return decodeBlob(blobText)
      })
    },

    removeEntry(id) {
      this.lastError = null

      const nextIndex = this.index.filter((i) => i.id !== id)
      this.index = nextIndex

      return Promise.all([saveHistoryIndex(nextIndex), removeHistoryBlob([id])]).catch((error) => {
        this.lastError = error instanceof Error ? error.message : String(error)
        throw error
      })
    },

    clearAll() {
      this.lastError = null
      const ids = this.index.map((i) => i.id)
      this.index = []

      return saveHistoryIndex([])
        .then(() => removeHistoryBlob(ids))
        .catch((error) => {
          this.lastError = error instanceof Error ? error.message : String(error)
          throw error
        })
    },
  },
})


