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
	// A simple, regex-based "relaxed" tokenizer/fixer is dangerous and hard to get right.
	// However, for "JS Object" format which we just generated (keys unquoted, single quotes maybe),
	// we can try to quote unquoted keys and flip single quotes to double quotes.

	// Strategy:
	// 1. Replace single quotes with double quotes? No, strings might contain double quotes.
	// 2. Use `Function` constructor? NO. CSP blocks it in extensions.
	// 3. Simple State Machine / Parser.

	// To avoid writing a full parser, let's try a heuristic approach that covers 99% of "JS Object" cases:
	// - Keys: `key:` -> `"key":`
	// - Strings: `'value'` -> `"value"`

	// BUT, what if value contains ':' or quotes?

	// Let's implement a minimal recursive descent parser context?
	// Or, use a known library approach like "json5" but since we can't add deps easily,
	// we will write a small tokenizing parser.

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

	// Initialize
	next();

	// ... Actually, writing a full parser here is too risky for "Simple".
	// Let's use a Regex-replacement approach that is "Good Enough" for config files/JS Objects.
	// Reference: modifying text to be JSON compatible.

	/*
        Heuristic Fixer:
        1. Quote keys that are unquoted (alphanumeric+$_).
        2. Convert single-quoted strings to double-quoted.
    */

	// Safety check: if it looks like code (function calls, etc), fail.
	if (/[\(=>]/.test(text)) {
		// Arrow functions, function calls
		// This is a rough check, might have false positives in strings, but safer.
		// Actually, let's just allow data.
	}

	// 1. Strings: specific handling to avoid matching inside strings.
	// We will attempt to tokenize simple JS objects.

	// Regex to match:
	// - Strings: '...' or "..."
	// - keys: identifier followed by :
	// - values: true, false, null, numbers

	// If this is too complex, we fallback to "Strict JSON Only" and tell user "Code Mode requires strictly valid JSON".
	// BUT the requirement says "Compatible in all places".

	// Let's try the `new Function` alternative:
	// "Content Security Policy (CSP) prevents 'new Function' in extensions."
	// So we MUST parsing text.

	// Let's try a robust Regex replacement for Unquoted Keys.
	// keys: \s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:
	// We want to replace $1 with "$1"

	let jsonStr = text;

	// Mask strings to avoid replacing inside them
	const strings = [];
	jsonStr = jsonStr.replace(/("(\\.|[^"])*"|'(\\.|[^'])*')/g, (match) => {
		// If it's a single quoted string, convert to double quoted
		if (match.startsWith("'")) {
			let content = match.slice(1, -1);
			// Escape double quotes inside
			content = content.replace(/"/g, '\\"');
			// Unescape single quotes?
			content = content.replace(/\\'/g, "'");
			match = '"' + content + '"';
		}
		strings.push(match);
		return `###STR${strings.length - 1}###`;
	});

	// Quote unquoted keys
	jsonStr = jsonStr.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '"$1":');

	// Restore strings
	jsonStr = jsonStr.replace(
		/###STR(\d+)###/g,
		(_, index) => strings[Number(index)]
	);

	// Trailing commas? (JSON doesn't support them, JS does)
	// Remove trailing commas before } or ]
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
		// JSON parse failed. Try relaxed parse.
		try {
			const relaxed = relaxedJsonParse(text);
			return { parsedValue: relaxed, parseError: null };
		} catch (relaxedError) {
			const message = error instanceof Error ? error.message : String(error);
			return { parsedValue: null, parseError: message };
		}
	}
};
