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
				'var(--f-border-subtle, rgba(128, 128, 128, 0.35))';
			container.appendChild(line);
		}

		return container;
	}

	ignoreEvent() {
		return true;
	}
}

/**
 * 遍历语法树，收集所有跨多行的括号对信息
 * @param {EditorView} view - 编辑器视图
 * @returns {Array} 括号对信息数组
 */
function collectBracketScopes(view) {
	const scopes = [];
	const doc = view.state.doc;
	const tree = syntaxTree(view.state);

	// 遍历语法树，查找 Object 和 Array 节点
	tree.iterate({
		enter: (node) => {
			// JSON 语法树中，Object 节点名称为 "Object"，Array 节点名称为 "Array"
			if (node.name === 'Object' || node.name === 'Array') {
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
 * 根据括号对信息生成装饰
 * @param {EditorView} view - 编辑器视图
 * @returns {DecorationSet} 装饰集
 */
function buildDecorations(view) {
	const builder = new RangeSetBuilder();
	const scopes = collectBracketScopes(view);
	const doc = view.state.doc;
	const charWidth = getCharWidth(view);

	// 按行收集所有需要显示的竖线
	// 键: 行号, 值: 该行需要显示的缩进位置 Set
	const lineIndents = new Map();

	for (const scope of scopes) {
		// 为括号内的每一行添加竖线（不包括开始行）
		for (
			let lineNum = scope.startLine + 1;
			lineNum <= scope.endLine;
			lineNum++
		) {
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
		backgroundColor: 'var(--f-border-subtle, rgba(128, 128, 128, 0.35))',
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
