import { createId } from '../utils/id';
import { tryParseJson } from '../features/json/parse';

/**
 * 获取当前时间戳
 * @returns {number} 当前时间的毫秒数
 */
const now = () => Date.now();

/**
 * 创建一个新的文档对象
 *
 * 数据结构是核心。文档对象包含了原始内容、解析后的值以及可能存在的错误。
 * 总是保持数据结构的清晰和单一职责。
 *
 * @param {string} sourceText - 原始 JSON 文本
 * @returns {Object} 新创建的文档对象，包含 id, sourceText, parsedValue, parseError, updatedAt
 */
export const createDocument = (sourceText = '') => {
	const { parsedValue, parseError } = tryParseJson(sourceText);

	return {
		id: createId(),
		sourceText,
		parsedValue,
		parseError,
		updatedAt: now(),
	};
};

/**
 * 更新文档内容的纯函数
 *
 * 不直接修改原对象，而是返回一个新的对象（Immutability）。
 * 这避免了副作用，让状态管理更容易追踪。
 *
 * @param {Object} doc - 旧的文档对象
 * @param {string} sourceText - 新的 JSON 文本
 * @returns {Object} 更新后的文档对象
 */
export const updateDocumentText = (doc, sourceText) => {
	const { parsedValue, parseError } = tryParseJson(sourceText);

	return {
		...doc,
		sourceText,
		parsedValue,
		parseError,
		updatedAt: now(),
	};
};
