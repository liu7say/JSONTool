// Schema 版本，用于后续可能的迁移
const SCHEMA_VERSION = 1;

// Storage Key 定义
const keys = {
	schemaVersion: 'storageSchemaVersion',
	historyIndex: 'historyIndex',
	historyBlob: (id) => `historyBlob:${id}`,
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
