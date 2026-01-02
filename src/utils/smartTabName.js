/**
 * 智能 Tab 命名生成器
 *
 * 这是一个纯函数，职责单一：根据给定的内容返回一个最佳的标题。
 * 不涉及任何 UI 或 Store 状态。
 */

import { tryParseJson } from '../features/json/parse';

// 有语义的键名列表，优先级从高到低
const SEMANTIC_KEYS = [
	'name',
	'title',
	'label',
	'id',
	'plugin_id',
	'app_id',
	'key',
	'code',
	'message',
	'description',
	'type',
];

/**
 * 截断过长的字符串
 * @param {string} str
 * @param {number} maxLength
 */
const truncate = (str, maxLength = 15) => {
	if (!str) return '';
	const s = String(str).trim();
	return s.length > maxLength ? s.slice(0, maxLength) + '...' : s;
};

/**
 * 根据内容生成智能标题
 * @param {string} content - JSON 文本内容
 * @param {string} defaultName - 默认名称 (如 'Tab 1')
 * @returns {string}
 */
export const generateTabName = (content, defaultName) => {
	if (!content || !content.trim()) {
		return defaultName;
	}

	const { parsedValue } = tryParseJson(content);

	// case 1: 无法解析为 JSON，或者解析结果为 null/undefined
	if (parsedValue === null || parsedValue === undefined) {
		// 尝试取第一行非空文本
		const lines = content.trim().split('\n');
		const firstLine = lines[0].trim();
		return truncate(firstLine) || defaultName;
	}

	// case 2: 数组
	if (Array.isArray(parsedValue)) {
		return `Array(${parsedValue.length})`;
	}

	// case 3: 对象
	if (typeof parsedValue === 'object') {
		// 寻找语义键
		for (const key of SEMANTIC_KEYS) {
			if (
				Object.prototype.hasOwnProperty.call(parsedValue, key) &&
				parsedValue[key]
			) {
				const val = parsedValue[key];
				// 只使用字符串或数字类型的值
				if (typeof val === 'string' || typeof val === 'number') {
					return truncate(val);
				}
			}
		}

		// 没有任何语义键，使用键的数量
		const keysCount = Object.keys(parsedValue).length;
		return `Object {${keysCount}}`;
	}

	// case 4: 基础类型 (String, Number, Boolean)
	return truncate(String(parsedValue));
};
