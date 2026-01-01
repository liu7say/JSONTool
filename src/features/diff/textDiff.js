import { diffLines } from 'diff';

/**
 * 计算两个文本之间的差异（按行）
 * @param {Object} params
 * @param {string} params.leftText - 旧文本
 * @param {string} params.rightText - 新文本
 * @returns {Array} diff 结果数组
 */
export const diffText = ({ leftText = '', rightText = '' } = {}) => {
	return diffLines(leftText, rightText);
};
