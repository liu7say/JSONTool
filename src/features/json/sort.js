import { stringifyJson } from './stringify';

// 检查键是否全为数字（数组索引）
const isNumericKey = (key) => /^[0-9]+$/.test(key);

// 规范化数字键，以便进行数值比较而不是字符串比较
const normalizeNumericKey = (key) => {
	// "00012" -> "12"；保留单个 "0"
	const normalized = String(key).replace(/^0+(?=\d)/, '');
	return normalized || '0';
};

/**
 * 自定义对象 Key 比较函数
 * 1. 都是数字时，按数值大小比较
 * 2. 数字和非数字混杂时，数字在前（可选）
 * 3. 都是字符串时，不区分大小写比较 + 原始比较兜底
 */
const compareJsonObjectKeys = (a, b) => {
	const aStr = String(a);
	const bStr = String(b);
	const aIsNum = isNumericKey(aStr);
	const bIsNum = isNumericKey(bStr);

	if (aIsNum && bIsNum) {
		const aNorm = normalizeNumericKey(aStr);
		const bNorm = normalizeNumericKey(bStr);
		if (aNorm.length !== bNorm.length) return aNorm.length - bNorm.length;
		const byLex = aNorm.localeCompare(bNorm);
		if (byLex) return byLex;
		if (aStr.length !== bStr.length) return aStr.length - bStr.length;
		return aStr.localeCompare(bStr);
	}

	if (aIsNum !== bIsNum) return aIsNum ? -1 : 1;

	// 字母排序：a-z（不区分大小写），再用原始比较保证稳定
	return (
		aStr.localeCompare(bStr, 'en', { sensitivity: 'base' }) ||
		aStr.localeCompare(bStr)
	);
};

/**
 * 递归地对对象的所有 Key 进行排序
 *
 * 排序应该是稳定的。
 * 当你重新排序一个文件时，不应该因为算法的不稳定性导致无关的行发生变化。
 */
const sortObjectKeysDeep = (value, options = {}) => {
	if (!value || typeof value !== 'object') return value;
	if (Array.isArray(value))
		return value.map((item) => sortObjectKeysDeep(item, options));

	const out = {};
	let keys = Object.keys(value);

	// 如果开启"结构类型在后"
	if (options.structureAtEnd) {
		const primitives = [];
		const structures = [];

		keys.forEach((key) => {
			const v = value[key];
			// null 在 JS 中是 object，但在这里我们将其视为基础类型？
			// 需求： "{"b":{"c":1},"a":1,"d":[2,1]} -> {"a":1,"b":{"c":1},"d":[1,2]}"
			// a:1 是基础类型。d:[] 是数组（结构）。b:{} 是对象（结构）。
			// 对于此逻辑，null 实际上是基础类型？通常是的。
			if (v !== null && typeof v === 'object') {
				structures.push(key);
			} else {
				primitives.push(key);
			}
		});

		primitives.sort(compareJsonObjectKeys);
		structures.sort(compareJsonObjectKeys);
		keys = [...primitives, ...structures];
	} else {
		// 默认排序
		keys.sort(compareJsonObjectKeys);
	}

	keys.forEach((k) => {
		out[k] = sortObjectKeysDeep(value[k], options);
	});
	return out;
};

/**
 * 对 JSON 文档进行 Key 排序
 * @param {Object} doc - 文档对象
 * @param {Object} options
 * @returns {Object} { text, error }
 */
export const sortJsonKeys = (
	doc,
	{ indent = 2, structureAtEnd = false } = {}
) => {
	if (!doc || doc.parseError) {
		return { text: null, error: doc?.parseError || 'JSON 解析失败' };
	}

	const sorted = sortObjectKeysDeep(doc.parsedValue, { structureAtEnd });
	return { text: stringifyJson({ value: sorted, indent }), error: null };
};
