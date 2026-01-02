import { defineStore } from 'pinia';
import { createDocument, updateDocumentText } from '../domain/document';
import { createId } from '../utils/id';
import { generateTabName } from '../utils/smartTabName';

export const useSessionStore = defineStore('session', {
	state: () => ({
		tabs: [], // 所有打开的标签页
		activeTabId: null, // 当前激活的标签页 ID
	}),

	getters: {
		// 获取当前激活的 Tab 对象
		activeTab: (state) => state.tabs.find((t) => t.id === state.activeTabId),
	},

	actions: {
		/**
		 * 创建一个新的标签页
		 * @param {string} sourceText - 初始文本内容
		 * @returns {Object} 新创建的 Tab 对象
		 */
		createTab(sourceText = '') {
			const id = createId();
			const doc = createDocument(sourceText);
			// 自动命名：优先使用智能命名，如果内容为空则回退到 "Tab N"
			const num = this.tabs.length + 1;
			const initialTitle = generateTabName(sourceText, `Tab ${num}`);

			const newTab = {
				id,
				title: initialTitle,
				doc,
				// 每个 Tab 独立的视图状态
				viewMode: 'code', // 'code' | 'table' | 'diff'
				splitRatio: 50, // 左右分栏比例
				selectedArrayPath: '', // 表格视图选中的数组路径
			};

			this.tabs.push(newTab);
			this.activeTabId = id;
			return newTab;
		},

		/**
		 * 关闭指定标签页
		 * 如果关闭的是当前激活的标签页，会自动尝试激活临近的标签页
		 * @param {string} id
		 */
		closeTab(id) {
			const idx = this.tabs.findIndex((t) => t.id === id);
			if (idx === -1) return;

			this.tabs.splice(idx, 1);

			// 如果关闭的是当前 Tab，且还有其他 Tab，则激活相邻的
			if (this.activeTabId === id) {
				if (this.tabs.length > 0) {
					// 优先激活左边的，如果没有则激活现在的第一个
					const nextTab = this.tabs[idx - 1] || this.tabs[0];
					this.activeTabId = nextTab.id;
				} else {
					this.activeTabId = null;
					// 如果全关了，自动创建一个新的，保证界面不空
					this.createTab();
				}
			}
		},

		/**
		 * 设置当前激活的标签页
		 * @param {string} id
		 */
		setActive(id) {
			if (this.tabs.find((t) => t.id === id)) {
				this.activeTabId = id;
			}
		},

		// 更新 Tab 文档内容
		updateTabDoc(id, text) {
			const tab = this.tabs.find((t) => t.id === id);
			if (!tab) return;

			tab.doc = updateDocumentText(tab.doc, text);

			// 更新文档内容时，同时更新标题（如果不为空）
			tab.title = generateTabName(text, tab.title);
		},

		// 更新 Tab 标题
		updateTabTitle(id, title) {
			const tab = this.tabs.find((t) => t.id === id);
			if (tab) tab.title = title;
		},

		// 更新 Tab 视图模式
		updateTabViewMode(id, mode) {
			const tab = this.tabs.find((t) => t.id === id);
			if (tab) tab.viewMode = mode;
		},

		// 更新 Tab 选中的数组路径（表格模式用）
		updateTabArrayPath(id, path) {
			const tab = this.tabs.find((t) => t.id === id);
			if (tab) tab.selectedArrayPath = path;
		},
	},
});
