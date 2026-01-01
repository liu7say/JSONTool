import { create } from 'jsondiffpatch';

const diffpatch = create({
	objectHash: (obj) => {
		// 尝试使用 id 属性作为数组对象的唯一标识，否则回退到整个对象的 hash
		if (!obj || typeof obj !== 'object') return String(obj);
		if (typeof obj.id === 'string' || typeof obj.id === 'number')
			return String(obj.id);
		return JSON.stringify(obj);
	},
});

/**
 * 计算两个 JSON 对象之间的差异
 * @param {Object} params
 * @param {any} params.leftValue - 旧值
 * @param {any} params.rightValue - 新值
 * @returns {any} diff 结果对象
 */
export const diffJson = ({ leftValue, rightValue } = {}) => {
	return diffpatch.diff(leftValue, rightValue);
};
