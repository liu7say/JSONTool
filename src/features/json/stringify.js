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
export const stringifyJson = ({ value, indent = 2, sortKeys = false } = {}) => {
	const space = Math.max(0, Math.min(8, Number(indent) || 0));

	const replacer = sortKeys
		? (key, v) => {
				if (!v || typeof v !== 'object' || Array.isArray(v)) return v;
				const out = {};
				Object.keys(v)
					.sort()
					.forEach((k) => {
						out[k] = v[k];
					});
				return out;
		  }
		: null;

	return JSON.stringify(value, replacer, space);
};
