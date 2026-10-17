/**
 * JSON 括号范围线扩展
 * 在 { } 和 [ ] 括号配对之间显示垂直连接线
 */

import {
	ViewPlugin,
	Decoration,
	EditorView,
	WidgetType,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';

/**
 * 括号范围线 Widget
 * 用于在行首显示多条垂直线
 */
class BracketScopeLinesWidget extends WidgetType {
	constructor(indents, charWidth) {
		super();
		this.indents = indents; // 缩进位置数组（字符数）
		this.charWidth = charWidth || 7.8; // 字符宽度估算
	}

	eq(other) {
		return (
			this.indents.length === other.indents.length &&
			this.indents.every((v, i) => v === other.indents[i])
		);
	}

	toDOM() {
		const container = document.createElement('span');
		container.className = 'cm-bracket-scope-lines-container';
		container.style.position = 'absolute';
		container.style.left = '0';
		container.style.top = '0';
		container.style.bottom = '0';
		container.style.pointerEvents = 'none';
		container.style.zIndex = '1';

		for (const indent of this.indents) {
			const line = document.createElement('span');
			line.className = 'cm-bracket-scope-line-mark';
			line.style.position = 'absolute';
			line.style.left = `${indent * this.charWidth}px`;
			line.style.top = '0';
			line.style.bottom = '0';
			line.style.width = '1px';
			line.style.backgroundColor =
				'var(--colorNeutralStroke2, rgba(128, 128, 128, 0.35))';
			container.appendChild(line);
		}

		return container;
	}

	ignoreEvent() {
		return true;
	}
}

/**
 * 收集与当前可视视口重叠的括号对范围信息
 * 针对超大文档进行视口裁剪优化：仅检索视口祖先节点与视口内部节点，
 * 避免全文档全量语法树遍历导致主线程卡死和 Lezer 解析断流。
 * @param {EditorView} view - 编辑器视图
 * @returns {Array} 括号对信息数组
 */
function collectBracketScopes(view) {
	const scopes = [];
	const doc = view.state.doc;
	const tree = syntaxTree(view.state);
	if (!tree || tree.length === 0) return scopes;

	const vpFrom = view.viewport.from;
	const vpTo = view.viewport.to;
	const seen = new Set();

	// 辅助函数：记录符合跨行条件的 Object/Array 节点
	const addScopeFromNode = (node) => {
		if (node.name === 'Object' || node.name === 'Array') {
			const key = `${node.from}-${node.to}`;
			if (seen.has(key)) return;
			seen.add(key);

			const from = node.from;
			const to = node.to;
			const startLine = doc.lineAt(from);
			const endLine = doc.lineAt(to);

			// 只处理跨多行的括号对
			if (startLine.number < endLine.number) {
				// 计算闭合括号 } 的缩进位置（以结束行为准，视觉效果更好）
				const indent = to - endLine.from;

				scopes.push({
					startLine: startLine.number,
					endLine: endLine.number,
					indent: indent,
				});
			}
		}
	};

	// 1. 向上回溯当前视口起点的所有外层祖先节点（覆盖跨越视口的父级括号）
	let ancestor = tree.resolveInner(vpFrom, 1);
	while (ancestor) {
		addScopeFromNode(ancestor);
		ancestor = ancestor.parent;
	}

	// 2. 仅在视口范围内遍历语法树节点
	tree.iterate({
		from: vpFrom,
		to: vpTo,
		enter: (node) => {
			addScopeFromNode(node);
		},
	});

	return scopes;
}

/**
 * 估算编辑器字符宽度
 * @param {EditorView} view - 编辑器视图
 * @returns {number} 字符宽度（像素）
 */
function getCharWidth(view) {
	// 尝试从编辑器获取字符宽度
	const defaultCharWidth = view.defaultCharacterWidth;
	if (defaultCharWidth > 0) {
		return defaultCharWidth;
	}
	// 降级使用默认值
	return 7.8;
}

/**
 * 根据括号对信息生成装饰（严格局限在视口可见行内）
 * @param {EditorView} view - 编辑器视图
 * @returns {DecorationSet} 装饰集
 */
function buildDecorations(view) {
	const builder = new RangeSetBuilder();
	const scopes = collectBracketScopes(view);
	if (!scopes.length) return builder.finish();

	const doc = view.state.doc;
	const charWidth = getCharWidth(view);

	// 获取视口可见行的起始与结束行号
	const vpStartLine = doc.lineAt(view.viewport.from).number;
	const vpEndLine = doc.lineAt(view.viewport.to).number;

	// 仅收集视口范围内的行竖线
	// 键: 行号, 值: 该行需要显示的缩进位置 Set
	const lineIndents = new Map();

	for (const scope of scopes) {
		// 计算该作用域与视口可见行的交集（不包括开始行）
		const fromLine = Math.max(scope.startLine + 1, vpStartLine);
		const toLine = Math.min(scope.endLine, vpEndLine);

		for (let lineNum = fromLine; lineNum <= toLine; lineNum++) {
			if (!lineIndents.has(lineNum)) {
				lineIndents.set(lineNum, new Set());
			}
			lineIndents.get(lineNum).add(scope.indent);
		}
	}

	// 按行号排序，生成装饰
	const sortedLines = Array.from(lineIndents.keys()).sort((a, b) => a - b);

	for (const lineNum of sortedLines) {
		if (lineNum < 1 || lineNum > doc.lines) continue;

		const line = doc.line(lineNum);
		const indents = Array.from(lineIndents.get(lineNum)).sort((a, b) => a - b);

		// 创建 widget 装饰
		const deco = Decoration.widget({
			widget: new BracketScopeLinesWidget(indents, charWidth),
			side: -1, // 放在行内容之前
		});

		builder.add(line.from, line.from, deco);
	}

	return builder.finish();
}

/**
 * 括号范围线 ViewPlugin
 */
const bracketScopeLinesPlugin = ViewPlugin.fromClass(
	class {
		decorations;

		constructor(view) {
			this.decorations = buildDecorations(view);
		}

		update(update) {
			if (
				update.docChanged ||
				update.viewportChanged ||
				update.geometryChanged ||
				syntaxTree(update.state) !== syntaxTree(update.startState)
			) {
				this.decorations = buildDecorations(update.view);
			}
		}
	},
	{
		decorations: (v) => v.decorations,
	},
);

/**
 * 括号范围线样式主题
 */
const bracketScopeLinesTheme = EditorView.baseTheme({
	'.cm-line': {
		position: 'relative',
	},
	'.cm-bracket-scope-lines-container': {
		position: 'absolute',
		left: '0',
		top: '0',
		bottom: '0',
		pointerEvents: 'none',
	},
	'.cm-bracket-scope-line-mark': {
		position: 'absolute',
		top: '0',
		bottom: '0',
		width: '1px',
		backgroundColor: 'var(--colorNeutralStroke2, rgba(128, 128, 128, 0.35))',
	},
});

/**
 * 括号范围线扩展
 * 导出此扩展以在编辑器中启用
 */
export const bracketScopeLines = [
	bracketScopeLinesPlugin,
	bracketScopeLinesTheme,
];
