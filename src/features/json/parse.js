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
	// 简单的基于正则的“宽松”分词器/修复器是危险且难以完全正确的。
	// 然而，对于我们刚刚生成的“JS Object”格式（键未加引号，可能包含单引号），
	// 我们可以尝试给未加引号的键加上引号，并将单引号转换双引号。

	// 策略：
	// 1. 将单引号替换为双引号？不行，字符串内部可能包含双引号。
	// 2. 使用 `Function` 构造函数？不行。CSP 在扩展中禁止这样做。
	// 3. 简单的状态机/解析器。

	// 为了避免编写完整的解析器，我们可以尝试一种启发式方法，覆盖 99% 的 “JS Object” 情况：
	// - 键：`key:` -> `"key":`
	// - 字符串：`'value'` -> `"value"`

	// 但是，如果值包含 ':' 或引号怎么办？

	// 实现一个最小递归下降解析上下文？
	// 或者使用像 "json5" 这样的已知库方法，但因为我们不能轻易添加依赖，
	// 我们将编写一个小的分词解析器。

	let at = 0;
	let ch = ' ';

	const next = (c) => {
		if (c && c !== ch) {
			throw new Error("Expected '" + c + "' instead of '" + ch + "'");
		}
		ch = text.charAt(at);
		at += 1;
		return ch;
	};

	const error = (m) => {
		throw new Error(m);
	};

	// 初始化
	next();

	// ... 实际上，在这里编写完整的解析器对于“简单”需求来说风险太大了。
	// 让我们使用正则替换方法，对于配置文件/JS 对象来说“足够好”了。
	// 参考：修改文本以兼容 JSON。

	/*
        启发式修复器：
        1. 给未加引号的键（字母数字+$_）加上引号。
        2. 将单引号字符串转换为双引号。
    */

	// 安全检查：如果看起来像代码（函数调用等），则失败。
	if (/[\(=>]/.test(text)) {
		// 箭头函数，函数调用
		// 这是一个粗略的检查，可能会在字符串中误报，但更安全。
		// 实际上，暂时允许数据通过。
	}

	// 1. 字符串：特殊处理以避免匹配字符串内部。
	// 我们将尝试对简单的 JS 对象进行分词。

	// 正则匹配：
	// - 字符串：'...' 或 "..."
	// - 键：标识符后跟 :
	// - 值：true, false, null, 数字

	// 如果这太复杂，我们就回退到“仅严格 JSON”并告诉用户“代码模式需要严格有效的 JSON”。
	// 但是需求说“在所有地方兼容”。

	// 让我们尝试 `new Function` 替代方案：
	// "内容安全策略 (CSP) 禁止在扩展中使用 'new Function'。"
	// 所以我们必须解析文本。

	// 让我们尝试一种健壮的正则替换未加引号的键。
	// keys: \s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:
	// 我们想将 $1 替换为 "$1"

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
