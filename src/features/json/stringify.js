/**
 * 将对象转换回 JSON 字符串
 * 支持按 Key 排序，保证输出的稳定性。
 *
 * @param {Object} params
 * @param {any} params.value - 要转换的值
 * @param {number|string} params.indent - 缩进
 * @param {boolean} params.sortKeys - 是否按 Key 排序
 * @returns {string}
 */
const isSafeKey = (key) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);

const stringifyJsObject = (value, indentLevel, currentIndent) => {
	const space = ' '.repeat(indentLevel);
	const nextIndent = currentIndent + space;

	if (value === null) return 'null';
	if (typeof value === 'undefined') return 'undefined';
	if (typeof value === 'boolean' || typeof value === 'number')
		return String(value);
	if (typeof value === 'string') return JSON.stringify(value); // Keep strings quoted

	if (Array.isArray(value)) {
		if (value.length === 0) return '[]';
		const items = value
			.map((v) => stringifyJsObject(v, indentLevel, nextIndent))
			.join(',\n' + nextIndent);
		return `[\n${nextIndent}${items}\n${currentIndent}]`;
	}

	if (typeof value === 'object') {
		const keys = Object.keys(value);
		if (keys.length === 0) return '{}';

		// Sort keys if needed (can be added later, currently handled by pre-sort or option)
		// For now we trust the order or let the previous logic handle it,
		// but since we are re-implementing, we should respect the sort option if passed.
		// However, the current function signature is weird.
		// Let's keep it simple: We iterate keys.

		const props = keys
			.map((key) => {
				const keyStr = isSafeKey(key) ? key : JSON.stringify(key);
				const valStr = stringifyJsObject(value[key], indentLevel, nextIndent);
				return `${keyStr}: ${valStr}`;
			})
			.join(',\n' + nextIndent);
		return `{\n${nextIndent}${props}\n${currentIndent}}`;
	}

	return String(value);
};

export const stringifyJson = ({
	value,
	indent = 2,
	sortKeys = false,
	format = 'json',
} = {}) => {
	// Pre-sort keys using the replacer trick requires JSON.stringify,
	// checking if we need to sort BEFORE custom stringify.
	let obj = value;
	if (sortKeys && typeof value === 'object' && value !== null) {
		// Deep sort helper
		const deepSort = (item) => {
			if (Array.isArray(item)) return item.map(deepSort);
			if (item && typeof item === 'object') {
				const sorted = {};
				Object.keys(item)
					.sort()
					.forEach((k) => {
						sorted[k] = deepSort(item[k]);
					});
				return sorted;
			}
			return item;
		};
		obj = deepSort(value);
	}

	if (format === 'jsObj') {
		const indentSize = Number(indent) || 2;
		return stringifyJsObject(obj, indentSize, '');
	}

	// Standard JSON
	const space =
		typeof indent === 'string'
			? indent
			: Math.max(0, Math.min(8, Number(indent) || 0));

	return JSON.stringify(obj, null, space);
};
