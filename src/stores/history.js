import { defineStore } from 'pinia';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { createHistoryEntry } from '../domain/historyEntry';
import {
	loadHistoryBlob,
	loadHistoryIndex,
	removeHistoryBlob,
	saveHistoryBlob,
	saveHistoryIndex,
} from '../services/storage';

// 为了节省 Chrome Storage 空间，我们使用 compression
// JSON 文本通常具有极高的压缩率
const encodeBlob = (data) => compressToUTF16(JSON.stringify(data));
// 历史记录最大数量限制
const HISTORY_LIMIT = 200;

const decodeBlob = (text) => JSON.parse(decompressFromUTF16(text));

/**
 * 将完整的历史记录条目转换为索引条目（轻量级）
 * 索引只保留元数据，不包含具体的文档内容
 */
const toIndexItem = (entry, blobSize) => {
	return {
		id: entry.id,
		title: entry.title,
		createdAt: entry.createdAt,
		size: blobSize,
	};
};

/**
 * 裁剪历史记录索引，确保不超过限制
 * @returns {Object} { index, removedIds }
 */
const trimIndex = (index) => {
	if (index.length <= HISTORY_LIMIT) return { index, removedIds: [] };
	const removed = index.slice(HISTORY_LIMIT);
	return {
		index: index.slice(0, HISTORY_LIMIT),
		removedIds: removed.map((i) => i.id),
	};
};

export const useHistoryStore = defineStore('history', {
	state: () => ({
		index: [],
		isLoading: false,
		hasLoaded: false,
		lastError: null,
	}),
	actions: {
		/**
		 * 加载历史记录索引
		 * 初始化 Store 时调用
		 */
		loadIndex() {
			this.isLoading = true;
			this.lastError = null;

			return loadHistoryIndex()
				.then((index) => {
					this.index = index;
					this.hasLoaded = true;
				})
				.catch((error) => {
					this.lastError =
						error instanceof Error ? error.message : String(error);
				})
				.finally(() => {
					this.isLoading = false;
				});
		},

		/**
		 * 保存一条新的历史记录
		 * 1. 压缩内容
		 * 2. 保存 Blob
		 * 3. 更新并保存索引
		 * 4. 如果超出限制，删除旧的 Blob
		 */
		saveEntry({ doc, toolState, title }) {
			const entry = createHistoryEntry({ doc, toolState, title });
			const blobText = encodeBlob(entry);
			const indexItem = toIndexItem(entry, blobText.length);

			this.lastError = null;

			return saveHistoryBlob(entry.id, blobText)
				.then(() => {
					const nextIndex = [indexItem, ...this.index];
					const { index, removedIds } = trimIndex(nextIndex);
					this.index = index;
					return saveHistoryIndex(index).then(() => removedIds);
				})
				.then((removedIds) => {
					if (!removedIds.length) return;
					return removeHistoryBlob(removedIds);
				})
				.catch((error) => {
					this.lastError =
						error instanceof Error ? error.message : String(error);
					throw error;
				});
		},

		/**
		 * 加载一条历史记录的详细内容
		 * @param {string} id
		 * @returns {Promise<Object|null>}
		 */
		loadEntry(id) {
			this.lastError = null;
			return loadHistoryBlob(id).then((blobText) => {
				if (!blobText) return null;
				return decodeBlob(blobText);
			});
		},

		/**
		 * 删除一条历史记录
		 * 同时删除索引和 Blob
		 */
		removeEntry(id) {
			this.lastError = null;

			const nextIndex = this.index.filter((i) => i.id !== id);
			this.index = nextIndex;

			return Promise.all([
				saveHistoryIndex(nextIndex),
				removeHistoryBlob([id]),
			]).catch((error) => {
				this.lastError = error instanceof Error ? error.message : String(error);
				throw error;
			});
		},

		/**
		 * 清空所有历史记录
		 * 这是一个破坏性操作，必须小心
		 */
		clearAll() {
			this.lastError = null;
			const ids = this.index.map((i) => i.id);
			this.index = [];

			return saveHistoryIndex([])
				.then(() => removeHistoryBlob(ids))
				.catch((error) => {
					this.lastError =
						error instanceof Error ? error.message : String(error);
					throw error;
				});
		},
	},
});
