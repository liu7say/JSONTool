/**
 * 判断是否为普通对象（非数组、非 null）
 */
const isPlainObject = (v) => {
	return !!v && typeof v === 'object' && !Array.isArray(v);
};

/**
 * 收集一组对象中出现的所有 Key，作为表头
 */
const collectColumns = (rows) => {
	const set = new Set();
	rows.forEach((row) => {
		if (!isPlainObject(row)) return;
		Object.keys(row).forEach((k) => set.add(k));
	});
	return Array.from(set);
};

/**
 * 将单元格的值转化为可视字符串
 */
const cellToText = (v) => {
	if (v == null) return '';
	if (typeof v === 'string') return v;
	if (typeof v === 'number' || typeof v === 'boolean') return String(v);
	return JSON.stringify(v);
};

/**
 * 扫描 JSON 中所有可用的数组路径（只扫描指定深度）
 * 用于让用户选择将哪个数组展示为表格
 *
 * @param {any} value - JSON 对象
 * @param {number} maxDepth - 扫描深度
 * @returns {string[]} 路径数组，例如 ['', 'items', 'data.users']
 */
export const findArrayPaths = (value, maxDepth = 2) => {
	const paths = [];

	// 顶层就是数组
	if (Array.isArray(value)) {
		paths.push('');
	}

	// 顶层是对象，扫描第一层
	if (isPlainObject(value)) {
		Object.keys(value).forEach((key) => {
			if (Array.isArray(value[key])) {
				paths.push(key);
			}
			// 如果允许扫描第二层
			if (maxDepth >= 2 && isPlainObject(value[key])) {
				Object.keys(value[key]).forEach((subKey) => {
					if (Array.isArray(value[key][subKey])) {
						paths.push(`${key}.${subKey}`);
					}
				});
			}
		});
	}

	return paths;
};

/**
 * 按路径提取数组对象
 * 支持点分路径（如 'data.items'）
 */
export const extractArrayByPath = (value, path) => {
	if (!path || path === '') return value;

	const keys = path.split('.');
	let current = value;

	for (const key of keys) {
		if (!current || typeof current !== 'object') return null;
		current = current[key];
	}

	return current;
};

/**
 * 将 JSON 文档转换为表格数据
 *
 * 表格视图是对数据的另一种透视。
 * 注意：必须确保选择的是一个数组，否则表格无意义。
 *
 * @param {Object} doc - 文档对象
 * @param {string} path - 数组路径
 * @returns {Object} { columns, rows, error }
 */
export const jsonToTable = (doc, path = '') => {
	if (!doc || doc.parseError) {
		return { columns: [], rows: [], error: doc?.parseError || 'JSON 解析失败' };
	}

	const value = doc.parsedValue;

	// 按路径提取数组
	const array = extractArrayByPath(value, path);

	if (!Array.isArray(array)) {
		return { columns: [], rows: [], error: '所选路径不是数组，请选择其他路径' };
	}

	if (!array.length) {
		return { columns: [], rows: [], error: '数组为空' };
	}

	const columns = collectColumns(array);
	const normalizedRows = array.map((row, idx) => {
		if (!isPlainObject(row)) {
			return { __rowId: idx, value: cellToText(row) };
		}
		const out = { __rowId: idx };
		columns.forEach((k) => {
			out[k] = cellToText(row[k]);
		});
		return out;
	});

	const normalizedColumns = columns.length ? columns : ['value'];
	return { columns: normalizedColumns, rows: normalizedRows, error: null };
};
