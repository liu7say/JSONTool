import { stringifyJson } from './stringify';

/**
 * 格式化 JSON 文本
 *
 * 格式化是保持代码整洁的唯一方式。
 *
 * @param {Object} doc - 文档对象
 * @param {Object} options - 选项
 * @param {number|string} options.indent - 缩进量
 * @returns {Object} { text, error }
 */
export const formatJsonText = (doc, { indent = 2 } = {}) => {
	if (!doc || doc.parseError) {
		return { text: null, error: doc?.parseError || 'JSON 解析失败' };
	}

	return {
		text: stringifyJson({ value: doc.parsedValue, indent }),
		error: null,
	};
};
