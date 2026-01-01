/**
 * 序列化 URL 对象回字符串，支持参数排序
 * @param {URL|string} url
 * @param {Object} options
 * @param {boolean} options.sortParams - 是否对 Query 参数排序
 * @returns {string}
 */
export const serializeUrl = (url, { sortParams = true } = {}) => {
	if (!url) return '';
	const out = new URL(url.toString());

	if (sortParams) {
		const entries = Array.from(out.searchParams.entries()).sort(([a], [b]) =>
			a.localeCompare(b)
		);
		out.search = '';
		entries.forEach(([k, v]) => out.searchParams.append(k, v));
	}

	return out.toString();
};
