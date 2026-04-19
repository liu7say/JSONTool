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
export const relaxedJsonParse = (text) => {
	// 基于正则的"宽松"修复器，用于解析 JS Object 格式
	// 覆盖常见的 JS Object 情况：
	// - 给未加引号的键加上引号
	// - 将单引号字符串转换为双引号
	// - 删除尾随逗号

	let jsonStr = text;

	// 掩码字符串以避免替换其内部内容
	const strings = [];
	jsonStr = jsonStr.replace(/("(\\.|[^"])*"|'(\\.|[^'])*')/g, (match) => {
		// 如果是单引号字符串，转换为双引号
		if (match.startsWith("'")) {
			let content = match.slice(1, -1);
			// 转义内部的双引号
			content = content.replace(/"/g, '\\"');
			// 反转义单引号？
			content = content.replace(/\\'/g, "'");
			match = '"' + content + '"';
		}
		strings.push(match);
		return `###STR${strings.length - 1}###`;
	});

	// 给未加引号的键加上引号
	jsonStr = jsonStr.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '"$1":');

	// 还原字符串
	jsonStr = jsonStr.replace(
		/###STR(\d+)###/g,
		(_, index) => strings[Number(index)]
	);

	// 尾随逗号？（JSON 不支持，但 JS 支持）
	// 删除 } 或 ] 之前的尾随逗号
	jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

	return JSON.parse(jsonStr);
};

/**
 * 尝试解析 JSON 文本
 *
 * 永远不要信任用户的输入。
 * 始终捕获错误并优雅地返回，而不是让程序崩溃。
 * 若标准 JSON 解析失败，会自动尝试宽松解析（支持 JS Object 语法）。
 *
 * @param {string} sourceText - 原始 JSON 文本
 * @returns {{ parsedValue: any, parseError: string|null }} 解析结果，包含解析值和错误信息
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
		// JSON 解析失败。尝试宽松解析。
		try {
			const relaxed = relaxedJsonParse(text);
			return { parsedValue: relaxed, parseError: null };
		} catch (relaxedError) {
			const message = error instanceof Error ? error.message : String(error);
			return { parsedValue: null, parseError: message };
		}
	}
};
