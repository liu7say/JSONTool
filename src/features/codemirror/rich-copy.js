/**
 * 富文本复制扩展
 * 在复制代码时保留语法高亮颜色，使粘贴到 Word、邮件等富文本应用时保持样式
 *
 * 实现原理：使用 CodeMirror 的语法树（syntaxTree）而非 DOM 来获取高亮信息
 * 这样可以正确处理虚拟滚动导致未渲染到 DOM 的内容
 */

import { EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

/**
 * 节点类型名称到颜色的映射
 * 根据 Lezer JSON 语法树的节点类型名称进行映射
 * 节点名称来自调试输出：JsonText, Object, {, Property, PropertyName, :, String, ,, Array, [, ], Number, False, Null, }
 */
const nodeColorMaps = {
	light: {
		// JSON 属性名
		PropertyName: '#383a42',
		// 字符串值
		String: '#a31515',
		// 数字
		Number: '#098658',
		// 布尔值
		True: '#0000ff',
		False: '#0000ff',
		// null
		Null: '#0000ff',
		// 标点符号：大括号、方括号、冒号、逗号
		'{': '#383a42',
		'}': '#383a42',
		'[': '#383a42',
		']': '#383a42',
		':': '#383a42',
		',': '#383a42',
		// 默认颜色
		default: '#383a42',
	},
	dark: {
		// JSON 属性名
		PropertyName: '#e06c75',
		// 字符串值
		String: '#98c379',
		// 数字
		Number: '#d19a66',
		// 布尔值
		True: '#56b6c2',
		False: '#56b6c2',
		// null
		Null: '#56b6c2',
		// 标点符号
		'{': '#abb2bf',
		'}': '#abb2bf',
		'[': '#abb2bf',
		']': '#abb2bf',
		':': '#abb2bf',
		',': '#abb2bf',
		// 默认颜色
		default: '#abb2bf',
	},
};

/**
 * 检测当前是否为深色模式
 * @param {EditorView} view - 编辑器视图
 * @returns {boolean}
 */
const isDarkMode = (view) => {
	const bgColor = getComputedStyle(view.dom).backgroundColor;
	const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
	if (match) {
		const [, r, g, b] = match.map(Number);
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness < 128;
	}
	return false;
};

/**
 * 使用语法树生成带样式的 HTML
 * @param {EditorView} view - 编辑器视图
 * @param {number} from - 选区起始位置
 * @param {number} to - 选区结束位置
 * @returns {string} 带样式的 HTML
 */
const getStyledHtmlFromSyntaxTree = (view, from, to) => {
	const state = view.state;
	const doc = state.doc;
	const tree = syntaxTree(state);
	const isDark = isDarkMode(view);
	const colorMap = isDark ? nodeColorMaps.dark : nodeColorMaps.light;

	// 收集所有叶子节点（没有子节点的节点）的高亮信息
	const highlights = [];

	tree.iterate({
		from,
		to,
		enter(node) {
			// 检查节点范围是否与选区重叠
			const nodeFrom = Math.max(node.from, from);
			const nodeTo = Math.min(node.to, to);

			if (nodeFrom >= nodeTo) return;

			// 只处理叶子节点（终端节点）
			// 叶子节点是可以直接着色的最小单位
			// 非叶子节点（如 Object、Array、Property）只是结构容器
			const nodeName = node.name;

			// 跳过容器节点，只处理有颜色映射的叶子节点
			if (
				colorMap[nodeName] &&
				nodeName !== 'JsonText' &&
				nodeName !== 'Object' &&
				nodeName !== 'Array' &&
				nodeName !== 'Property'
			) {
				highlights.push({
					from: nodeFrom,
					to: nodeTo,
					color: colorMap[nodeName],
				});
			}
		},
	});

	// 对高亮区域按位置排序
	highlights.sort((a, b) => a.from - b.from);

	// 合并和填充，生成完整的带样式文本
	// 需要处理可能的重叠区域（父子节点可能有重叠）
	const parts = [];
	let pos = from;

	for (const hl of highlights) {
		// 如果当前高亮的起始位置在已处理位置之前，说明有重叠，跳过
		if (hl.from < pos) {
			// 检查是否有未覆盖的部分
			if (hl.to > pos) {
				parts.push({
					text: doc.sliceString(pos, hl.to),
					color: hl.color,
				});
				pos = hl.to;
			}
			continue;
		}

		// 填充高亮之前的未着色部分
		if (hl.from > pos) {
			const text = doc.sliceString(pos, hl.from);
			parts.push({
				text,
				color: colorMap.default,
			});
		}

		// 添加高亮部分
		parts.push({
			text: doc.sliceString(hl.from, hl.to),
			color: hl.color,
		});
		pos = hl.to;
	}

	// 填充剩余部分
	if (pos < to) {
		parts.push({
			text: doc.sliceString(pos, to),
			color: colorMap.default,
		});
	}

	// 生成 HTML
	const htmlContent = parts
		.map(
			(part) =>
				`<span style="color: ${part.color};">${escapeHtml(part.text)}</span>`,
		)
		.join('');

	// 获取编辑器字体样式
	const editorStyle = getComputedStyle(view.contentDOM);
	const fontFamily = editorStyle.fontFamily || 'Consolas, Monaco, monospace';
	const fontSize = editorStyle.fontSize || '14px';
	const backgroundColor = isDark ? '#282c34' : '#ffffff';

	return `<pre style="font-family: ${fontFamily}; font-size: ${fontSize}; background-color: ${backgroundColor}; color: ${colorMap.default}; white-space: pre-wrap; margin: 0; padding: 8px; border-radius: 4px;">${htmlContent}</pre>`;
};

/**
 * HTML 转义
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
const escapeHtml = (text) => {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
};

/**
 * 富文本复制扩展
 * 拦截复制事件，将带样式的 HTML 写入剪贴板
 */
export const richCopyExtension = EditorView.domEventHandlers({
	copy(event, view) {
		const selection = view.state.selection.main;
		if (selection.empty) return false;

		try {
			const plainText = view.state.sliceDoc(selection.from, selection.to);
			const htmlContent = getStyledHtmlFromSyntaxTree(
				view,
				selection.from,
				selection.to,
			);

			event.clipboardData.setData('text/plain', plainText);
			event.clipboardData.setData('text/html', htmlContent);
			event.preventDefault();
			return true;
		} catch (error) {
			console.warn('[JSONTool] 富文本复制失败，降级为纯文本:', error);
			return false;
		}
	},

	cut(event, view) {
		const selection = view.state.selection.main;
		if (selection.empty) return false;

		try {
			const plainText = view.state.sliceDoc(selection.from, selection.to);
			const htmlContent = getStyledHtmlFromSyntaxTree(
				view,
				selection.from,
				selection.to,
			);

			event.clipboardData.setData('text/plain', plainText);
			event.clipboardData.setData('text/html', htmlContent);
			event.preventDefault();

			view.dispatch({
				changes: { from: selection.from, to: selection.to },
				userEvent: 'delete.cut',
			});

			return true;
		} catch (error) {
			console.warn('[JSONTool] 富文本剪切失败，降级为默认行为:', error);
			return false;
		}
	},
});
