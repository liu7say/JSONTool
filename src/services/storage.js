// Schema 版本，用于后续可能的迁移
const SCHEMA_VERSION = 1;

const IDB_DATABASE_NAME = 'jsonTool';
const IDB_DATABASE_VERSION = 1;
const IDB_STORE_NAME = 'kv';

// Storage Key 定义
const keys = {
	schemaVersion: 'storageSchemaVersion',
	historyIndex: 'historyIndex',
	historyBlob: (id) => `historyBlob:${id}`,
	workspaceSnapshot: 'workspaceSnapshot',
};

/**
 * 封装 chrome.storage.local.get 为 Promise
 * @param {string} key
 * @returns {Promise<any>}
 */
const storageGet = (key) => {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get([key], (result) => {
			const err = chrome.runtime.lastError;
			if (err) return reject(err);
			resolve(result[key]);
		});
	});
};

/**
 * 封装 chrome.storage.local.set 为 Promise
 * @param {Object} obj
 * @returns {Promise<void>}
 */
const storageSet = (obj) => {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set(obj, () => {
			const err = chrome.runtime.lastError;
			if (err) return reject(err);
			resolve();
		});
	});
};

const storageRemove = (keyList) => {
	return new Promise((resolve, reject) => {
		chrome.storage.local.remove(keyList, () => {
			const err = chrome.runtime.lastError;
			if (err) return reject(err);
			resolve();
		});
	});
};

const openIndexedDb = () => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(IDB_DATABASE_NAME, IDB_DATABASE_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
				db.createObjectStore(IDB_STORE_NAME, { keyPath: 'key' });
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
};

const readIndexedDbValue = (key) => {
	return openIndexedDb().then((db) => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(IDB_STORE_NAME, 'readonly');
			const store = transaction.objectStore(IDB_STORE_NAME);
			const request = store.get(key);

			request.onsuccess = () => resolve(request.result?.value ?? null);
			request.onerror = () => reject(request.error);
			transaction.oncomplete = () => db.close();
			transaction.onerror = () => db.close();
		});
	});
};

const writeIndexedDbValue = (key, value) => {
	return openIndexedDb().then((db) => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(IDB_STORE_NAME, 'readwrite');
			const store = transaction.objectStore(IDB_STORE_NAME);

			store.put({ key, value });
			transaction.oncomplete = () => {
				db.close();
				resolve();
			};
			transaction.onerror = () => {
				db.close();
				reject(transaction.error);
			};
		});
	});
};

/**
 * 确保 Storage Schema 版本正确
 * 如果是新用户，写入当前版本号
 */
export const ensureStorageSchema = () => {
	return storageGet(keys.schemaVersion).then((version) => {
		if (version === SCHEMA_VERSION) return;
		return storageSet({ [keys.schemaVersion]: SCHEMA_VERSION });
	});
};

/**
 * 加载历史记录索引列表
 * @returns {Promise<Array>}
 */
export const loadHistoryIndex = () => {
	return ensureStorageSchema().then(() => {
		return storageGet(keys.historyIndex).then((index) => index || []);
	});
};

/**
 * 保存历史记录索引列表
 * @param {Array} index
 * @returns {Promise<void>}
 */
export const saveHistoryIndex = (index) => {
	return ensureStorageSchema().then(() => {
		return storageSet({ [keys.historyIndex]: index });
	});
};

/**
 * 加载具体的历史记录内容（Blob）
 * @param {string} id
 * @returns {Promise<string|null>} 压缩后的字符串
 */
export const loadHistoryBlob = (id) => {
	return storageGet(keys.historyBlob(id)).then((blob) => blob || null);
};

/**
 * 保存具体的历史记录内容（Blob）
 * @param {string} id
 * @param {string} blob
 * @returns {Promise<void>}
 */
export const saveHistoryBlob = (id, blob) => {
	return storageSet({ [keys.historyBlob(id)]: blob });
};

/**
 * 批量删除历史记录内容
 * @param {Array<string>} idList
 * @returns {Promise<void>}
 */
export const removeHistoryBlob = (idList) => {
	const keyList = idList.map((id) => keys.historyBlob(id));
	return storageRemove(keyList);
};

export const loadWorkspaceSnapshot = () => {
	return readIndexedDbValue(keys.workspaceSnapshot);
};

export const saveWorkspaceSnapshot = (snapshot) => {
	return writeIndexedDbValue(keys.workspaceSnapshot, snapshot);
};
