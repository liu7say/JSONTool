/**
 * 去除文本开头的 BOM (Byte Order Mark)
 * @param {string} text
 * @returns {string}
 */
const stripBom = (text) => {
	if (!text) return '';
	return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
};

/**
 * 尝试解析 JSON 文本
 *
 * 永远不要信任用户的输入。
 * 始终捕获错误并优雅地返回，而不是让程序崩溃。
 *
 * @param {string} sourceText
 * @returns {Object} { parsedValue, parseError }
 */
export const tryParseJson = (sourceText) => {
	const text = stripBom(
		typeof sourceText === 'string' ? sourceText : String(sourceText ?? '')
	);
	if (!text.trim()) {
		return { parsedValue: null, parseError: null };
	}

	try {
		return { parsedValue: JSON.parse(text), parseError: null };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { parsedValue: null, parseError: message };
	}
};
