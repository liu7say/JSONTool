import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

/**
 * 设置仓库
 * 将用户配置持久化到 chrome.storage.sync（带有 localStorage 回退）
 */
export const useSettingsStore = defineStore('settings', () => {
	// --- 状态 ---
	const sortStructureAtEnd = ref(false);
	const indent = ref(2);

	// --- 助手：通用存储访问 ---
	const storage = {
		/**
		 * 从存储中读取设置项
		 * 在 Chrome 扩展环境下使用 chrome.storage.sync，Web 开发环境下使用 localStorage
		 * @param {Object} defaults - 默认值对象，key 为设置项名称
		 * @returns {Promise<Object>} 读取到的设置项（未找到的项使用默认值）
		 */
		get: (defaults) =>
			new Promise((resolve) => {
				// Chrome 扩展环境
				if (
					typeof chrome !== 'undefined' &&
					chrome.storage &&
					chrome.storage.sync
				) {
					chrome.storage.sync.get(defaults, (items) => {
						// chrome.storage.sync 如果未找到会返回带有默认值的完整对象吗？
						// 实际上 get(defaults) 返回找到的项目与默认值的合并。
						resolve(items);
					});
				} else {
					// Web 环境 (开发)
					const result = { ...defaults };
					Object.keys(defaults).forEach((key) => {
						const val = localStorage.getItem('settings.' + key);
						if (val !== null) {
							try {
								result[key] = JSON.parse(val);
							} catch (e) {
								console.warn('Failed to parse setting:', key, val);
							}
						}
					});
					resolve(result);
				}
			}),
		/**
		 * 将设置项保存到存储中
		 * 在 Chrome 扩展环境下使用 chrome.storage.sync，Web 开发环境下使用 localStorage
		 * @param {Object} items - 要保存的设置项键值对
		 * @returns {Promise<void>}
		 */
		set: (items) =>
			new Promise((resolve) => {
				if (
					typeof chrome !== 'undefined' &&
					chrome.storage &&
					chrome.storage.sync
				) {
					chrome.storage.sync.set(items, () => resolve());
				} else {
					Object.entries(items).forEach(([key, val]) => {
						localStorage.setItem('settings.' + key, JSON.stringify(val));
					});
					resolve();
				}
			}),
	};

	// --- 动作 ---
	/**
	 * 从存储中加载用户设置
	 * 应在应用初始化时调用，以确保状态与持久化存储同步
	 * @returns {Promise<void>}
	 */
	const loadSettings = async () => {
		const defaults = {
			sortStructureAtEnd: false,
			indent: 2,
		};
		const data = await storage.get(defaults);

		sortStructureAtEnd.value = !!data.sortStructureAtEnd;
		indent.value = data.indent;
	};

	// --- 监听器 ---
	watch(sortStructureAtEnd, (newVal) => {
		storage.set({ sortStructureAtEnd: newVal });
	});
	watch(indent, (newVal) => {
		storage.set({ indent: newVal });
	});

	return {
		sortStructureAtEnd,
		indent,
		loadSettings,
	};
});
