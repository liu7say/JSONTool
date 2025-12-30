const SCHEMA_VERSION = 1

const keys = {
  schemaVersion: 'storageSchemaVersion',
  historyIndex: 'historyIndex',
  historyBlob: (id) => `historyBlob:${id}`,
}

const storageGet = (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      const err = chrome.runtime.lastError
      if (err) return reject(err)
      resolve(result[key])
    })
  })
}

const storageSet = (obj) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(obj, () => {
      const err = chrome.runtime.lastError
      if (err) return reject(err)
      resolve()
    })
  })
}

const storageRemove = (keyList) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keyList, () => {
      const err = chrome.runtime.lastError
      if (err) return reject(err)
      resolve()
    })
  })
}

export const ensureStorageSchema = () => {
  return storageGet(keys.schemaVersion).then((version) => {
    if (version === SCHEMA_VERSION) return
    return storageSet({ [keys.schemaVersion]: SCHEMA_VERSION })
  })
}

export const loadHistoryIndex = () => {
  return ensureStorageSchema().then(() => {
    return storageGet(keys.historyIndex).then((index) => index || [])
  })
}

export const saveHistoryIndex = (index) => {
  return ensureStorageSchema().then(() => {
    return storageSet({ [keys.historyIndex]: index })
  })
}

export const loadHistoryBlob = (id) => {
  return storageGet(keys.historyBlob(id)).then((blob) => blob || null)
}

export const saveHistoryBlob = (id, blob) => {
  return storageSet({ [keys.historyBlob(id)]: blob })
}

export const removeHistoryBlob = (idList) => {
  const keyList = idList.map((id) => keys.historyBlob(id))
  return storageRemove(keyList)
}


