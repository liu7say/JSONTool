import { createId } from '../utils/id';

/**
 * 生成默认的标题，格式为 "YYYY-MM-DD HH:mm:ss"
 * @returns {string} 格式化后的时间字符串
 */
const defaultTitle = () => {
	const date = new Date();
	const yyyy = String(date.getFullYear());
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	const hh = String(date.getHours()).padStart(2, '0');
	const mi = String(date.getMinutes()).padStart(2, '0');
	const ss = String(date.getSeconds()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

/**
 * 创建历史记录条目
 *
 * 历史记录不仅仅是保存文本，还要保存当时的工具状态（如视图模式），
 * 这样用户恢复时能回到当时的工作上下文。
 *
 * @param {Object} params - 参数对象
 * @param {Object} [params.doc] - 文档对象
 * @param {Object|null} [params.toolState=null] - 工具状态，例如视图模式等
 * @param {string} [params.title] - 标题，如果未提供则使用当前时间
 * @returns {Object} 历史记录条目对象
 */
export const createHistoryEntry = ({ doc, toolState = null, title } = {}) => {
	return {
		id: createId(),
		title: title || defaultTitle(),
		doc,
		toolState,
		createdAt: Date.now(),
	};
};
