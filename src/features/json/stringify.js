/**
 * 判断对象键名是否为合法的 JavaScript 标识符
 * 合法标识符无需加引号即可直接用作 JS Object 的键名
 * @param {string} key - 键名
 * @returns {boolean} 是否为合法标识符
 */
const isSafeKey = (key) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);

/**
 * 将 JavaScript 值序列化为 JS Object 格式字符串（非标准 JSON）
 * 与 JSON.stringify 的区别：合法标识符键名不加引号
 *
 * @param {any} value - 要序列化的值
 * @param {number} indentLevel - 缩进大小（空格数）
 * @param {string} currentIndent - 当前层级的缩进字符串
 * @returns {string} 序列化后的字符串
 */
const stringifyJsObject = (value, indentLevel, currentIndent) => {
	const space = ' '.repeat(indentLevel);
	const nextIndent = currentIndent + space;

	if (value === null) return 'null';
	if (typeof value === 'undefined') return 'undefined';
	if (typeof value === 'boolean' || typeof value === 'number')
		return String(value);
	if (typeof value === 'string') return JSON.stringify(value); // 保持字符串的引号

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

		// 如果需要，对键进行排序（稍后添加，当前通过预排序或选项处理）
		// 目前我们相信顺序或让之前的逻辑处理它，
		// 但既然我们在重新实现，如果传递了排序选项，我们应该尊重它。
		// 但是，当前的函数签名很奇怪。
		// 让我们保持简单：我们只遍历键。

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

/**
 * 将 JavaScript 值序列化为字符串
 * 支持标准 JSON 格式和 JS Object 格式，以及可选的按 Key 排序功能
 *
 * @param {Object} params - 参数对象
 * @param {any} params.value - 要转换的值
 * @param {number|string} params.indent - 缩进量，数字或字符串
 * @param {boolean} [params.sortKeys=false] - 是否按 Key 字母序排序
 * @param {'json'|'jsObj'} [params.format='json'] - 输出格式：'json' 为标准 JSON，'jsObj' 为 JS Object 格式
 * @returns {string} 序列化后的字符串
 */
export const stringifyJson = ({
	value,
	indent = 2,
	sortKeys = false,
	format = 'json',
} = {}) => {
	// 使用 replacer 技巧重新排序键需要 JSON.stringify，
	// 检查我们是否需要在自定义 stringify 之前进行排序。
	let obj = value;
	if (sortKeys && typeof value === 'object' && value !== null) {
		// 深度排序助手
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

	// 标准 JSON
	const space =
		typeof indent === 'string'
			? indent
			: Math.max(0, Math.min(8, Number(indent) || 0));

	return JSON.stringify(obj, null, space);
};
