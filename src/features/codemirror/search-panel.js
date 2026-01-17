/**
 * 自定义搜索面板模块
 * 扩展 CodeMirror 默认搜索面板，添加匹配项计数功能
 */

import { EditorView, ViewPlugin } from '@codemirror/view';
import {
	search,
	getSearchQuery,
	setSearchQuery,
	findNext,
	findPrevious,
	replaceNext,
	replaceAll,
	closeSearchPanel,
	SearchQuery,
} from '@codemirror/search';

/**
 * 计算搜索匹配项的数量和当前位置
 * @param {EditorView} view - 编辑器视图
 * @returns {{ current: number, total: number }} 当前位置和总匹配数
 */
function getMatchInfo(view) {
	const query = getSearchQuery(view.state);

	// 如果没有有效的查询，返回零
	if (!query.valid || !query.search) {
		return { current: 0, total: 0 };
	}

	const doc = view.state.doc;
	const queryObj = query;
	let total = 0;
	let current = 0;

	// 获取当前选择位置
	const selectionFrom = view.state.selection.main.from;
	const selectionTo = view.state.selection.main.to;

	// 使用查询的 getCursor 遍历所有匹配项
	const cursor = queryObj.getCursor(doc);
	let foundCurrent = false;

	while (!cursor.next().done) {
		total++;
		const match = cursor.value;

		// 检查当前选择是否与此匹配项对应
		if (
			!foundCurrent &&
			match.from === selectionFrom &&
			match.to === selectionTo
		) {
			current = total;
			foundCurrent = true;
		}
	}

	// 如果没有找到精确匹配，尝试找到最接近的上一个匹配
	if (!foundCurrent && total > 0) {
		const cursor2 = queryObj.getCursor(doc);
		let position = 0;
		while (!cursor2.next().done) {
			position++;
			if (cursor2.value.from <= selectionFrom) {
				current = position;
			}
		}
		// 如果光标在所有匹配项之前，当前为 0（未选中任何匹配）
		if (current === 0 && total > 0) {
			current = 0;
		}
	}

	return { current, total };
}

/**
 * 创建匹配计数显示元素
 */
function createMatchCounter() {
	const counter = document.createElement('span');
	counter.className = 'cm-search-match-counter';
	counter.setAttribute('aria-live', 'polite');
	return counter;
}

/**
 * 更新匹配计数显示
 * @param {HTMLElement} counter - 计数器元素
 * @param {number} current - 当前匹配项索引
 * @param {number} total - 总匹配项数
 * @param {boolean} hasQuery - 是否有搜索内容
 */
function updateMatchCounter(counter, current, total, hasQuery = true) {
	// 如果没有搜索内容，隐藏计数器
	if (!hasQuery) {
		counter.textContent = '';
		counter.style.display = 'none';
		counter.classList.remove('no-match', 'has-match');
		return;
	}

	// 确保计数器显示
	counter.style.display = '';

	if (total === 0) {
		counter.textContent = '无结果';
		counter.classList.add('no-match');
		counter.classList.remove('has-match');
	} else {
		counter.textContent = current > 0 ? `${current}/${total}` : `0/${total}`;
		counter.classList.remove('no-match');
		counter.classList.add('has-match');
	}
}

/**
 * 创建自定义搜索面板
 * @param {EditorView} view - 编辑器视图
 * @returns {Panel} 面板对象
 */
function createSearchPanel(view) {
	const dom = document.createElement('div');
	dom.className = 'cm-search';

	// 获取当前搜索查询
	const query = getSearchQuery(view.state);

	// 创建搜索行包装容器（包含输入框和计数器）
	const searchRow = document.createElement('div');
	searchRow.className = 'cm-search-row';

	// 创建搜索输入框
	const searchInput = document.createElement('input');
	searchInput.className = 'cm-textfield';
	searchInput.name = 'search';
	searchInput.placeholder = '查找';
	searchInput.setAttribute('main-field', 'true');
	searchInput.value = query.search || '';

	// 创建匹配计数器
	const matchCounter = createMatchCounter();

	// 将搜索输入框和计数器放入搜索行
	searchRow.appendChild(searchInput);
	searchRow.appendChild(matchCounter);

	// 创建替换输入框
	const replaceInput = document.createElement('input');
	replaceInput.className = 'cm-textfield';
	replaceInput.name = 'replace';
	replaceInput.placeholder = '替换';
	replaceInput.value = query.replace || '';

	// 创建按钮
	const prevBtn = document.createElement('button');
	prevBtn.name = 'prev';
	prevBtn.textContent = '上一个';
	prevBtn.type = 'button';

	const nextBtn = document.createElement('button');
	nextBtn.name = 'next';
	nextBtn.textContent = '下一个';
	nextBtn.type = 'button';

	const replaceBtn = document.createElement('button');
	replaceBtn.name = 'replace';
	replaceBtn.textContent = '替换';
	replaceBtn.type = 'button';

	const replaceAllBtn = document.createElement('button');
	replaceAllBtn.name = 'replaceAll';
	replaceAllBtn.textContent = '替换全部';
	replaceAllBtn.type = 'button';

	const closeBtn = document.createElement('button');
	closeBtn.name = 'close';
	closeBtn.textContent = '关闭';
	closeBtn.type = 'button';
	closeBtn.setAttribute('aria-label', '关闭搜索');

	// 创建选项复选框
	const createCheckbox = (name, label, checked) => {
		const labelElem = document.createElement('label');
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.name = name;
		checkbox.checked = checked;
		labelElem.appendChild(checkbox);
		labelElem.appendChild(document.createTextNode(label));
		return labelElem;
	};

	const caseSensitiveLabel = createCheckbox(
		'case',
		'区分大小写',
		query.caseSensitive || false,
	);
	const regexpLabel = createCheckbox('regexp', '正则', query.regexp || false);
	const wholeWordLabel = createCheckbox(
		'word',
		'全字匹配',
		query.wholeWord || false,
	);

	// 组装 DOM（使用搜索行包装容器）
	dom.appendChild(searchRow);
	dom.appendChild(replaceInput);
	dom.appendChild(prevBtn);
	dom.appendChild(nextBtn);
	dom.appendChild(replaceBtn);
	dom.appendChild(replaceAllBtn);
	dom.appendChild(caseSensitiveLabel);
	dom.appendChild(regexpLabel);
	dom.appendChild(wholeWordLabel);
	dom.appendChild(closeBtn);

	// 更新计数的统一辅助函数
	const updateCounter = () => {
		const info = getMatchInfo(view);
		const hasQuery = searchInput.value.length > 0;
		updateMatchCounter(matchCounter, info.current, info.total, hasQuery);
	};

	// 更新搜索查询的辅助函数
	const runSearch = () => {
		const newQuery = new SearchQuery({
			search: searchInput.value,
			replace: replaceInput.value,
			caseSensitive: caseSensitiveLabel.querySelector('input').checked,
			regexp: regexpLabel.querySelector('input').checked,
			wholeWord: wholeWordLabel.querySelector('input').checked,
		});
		view.dispatch({ effects: setSearchQuery.of(newQuery) });

		// 更新匹配计数（延迟以确保状态已更新）
		requestAnimationFrame(updateCounter);
	};

	// 绑定事件
	searchInput.addEventListener('input', runSearch);
	searchInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (e.shiftKey) {
				findPrevious(view);
			} else {
				findNext(view);
			}
			requestAnimationFrame(updateCounter);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			closeSearchPanel(view);
		}
	});

	replaceInput.addEventListener('input', runSearch);
	replaceInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			replaceNext(view);
			requestAnimationFrame(updateCounter);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			closeSearchPanel(view);
		}
	});

	prevBtn.addEventListener('click', () => {
		findPrevious(view);
		requestAnimationFrame(updateCounter);
	});

	nextBtn.addEventListener('click', () => {
		findNext(view);
		requestAnimationFrame(updateCounter);
	});

	replaceBtn.addEventListener('click', () => {
		replaceNext(view);
		requestAnimationFrame(updateCounter);
	});

	replaceAllBtn.addEventListener('click', () => {
		replaceAll(view);
		requestAnimationFrame(updateCounter);
	});

	closeBtn.addEventListener('click', () => {
		closeSearchPanel(view);
	});

	// 复选框变化时更新搜索
	[caseSensitiveLabel, regexpLabel, wholeWordLabel].forEach((label) => {
		label.querySelector('input').addEventListener('change', runSearch);
	});

	// 初始更新计数
	requestAnimationFrame(updateCounter);

	return {
		dom,
		top: true,
		mount() {
			searchInput.focus();
			searchInput.select();
		},
		update(update) {
			// 当文档或选择变化时更新计数
			if (update.docChanged || update.selectionSet) {
				updateCounter();
			}

			// 检查搜索查询是否被外部更改
			for (const tr of update.transactions) {
				for (const effect of tr.effects) {
					if (effect.is(setSearchQuery)) {
						const query = effect.value;
						if (searchInput.value !== query.search) {
							searchInput.value = query.search;
						}
						if (replaceInput.value !== query.replace) {
							replaceInput.value = query.replace;
						}
						requestAnimationFrame(updateCounter);
					}
				}
			}
		},
	};
}

/**
 * 匹配计数器样式
 */
const searchPanelStyles = EditorView.baseTheme({
	// 搜索行容器：包含输入框和计数器
	'.cm-search-row': {
		gridColumn: '1 / 2',
		gridRow: '1 / 2',
		display: 'flex',
		alignItems: 'center',
		gap: '1px',
		width: '100%',
	},
	// 搜索行内的输入框
	'.cm-search-row input.cm-textfield[name="search"]': {
		flex: '1',
		minWidth: '0',
		margin: '0',
		marginRight: '0',
	},
	// 匹配计数器
	'.cm-search-match-counter': {
		flexShrink: '0',
		fontSize: '12px',
		padding: '2px 0',
		fontFamily: 'inherit',
		whiteSpace: 'nowrap',
		minWidth: '50px',
		textAlign: 'right',
		color: 'var(--f-text-secondary)',
	},
	'.cm-search-match-counter.no-match': {
		color: 'var(--f-status-danger)',
	},
	'.cm-search-match-counter.has-match': {
		color: 'var(--f-text-secondary)',
	},
});

/**
 * 自定义搜索扩展
 * 使用自定义面板并显示匹配计数
 */
export const searchWithMatchCount = [
	search({
		top: true,
		createPanel: createSearchPanel,
	}),
	searchPanelStyles,
];
