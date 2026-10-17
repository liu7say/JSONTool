/**
 * 快速折叠兜底扩展 (Fallback Fold Service)
 * 解决大数据量下 CodeMirror Lezer 语法树异步解析断流导致的折叠指示器失效问题。
 * 当语法树尚未覆盖当前行时，采用轻量级括号扫描定位闭合行，确保折叠箭头 100% 实时常驻。
 */

import { syntaxTree, foldService } from '@codemirror/language';

/**
 * 轻量级括号匹配折叠服务
 * @param {EditorState} state - 编辑器状态
 * @param {number} lineStart - 当前行起点
 * @param {number} lineEnd - 当前行终点
 * @returns {{ from: number, to: number } | null}
 */
export const fallbackFoldService = foldService.of((state, lineStart, lineEnd) => {
	const tree = syntaxTree(state);
	// 若 Lezer 语法树已完整解析至当前行，则交由语法树处理，保证 AST 精确度
	if (tree.length >= lineEnd) {
		return null;
	}

	const line = state.doc.lineAt(lineStart);
	const text = line.text;

	// 查找行尾有效开括号（跳过行尾空白和逗号）
	let openChar = '';
	let closeChar = '';
	let openPos = -1;

	for (let i = text.length - 1; i >= 0; i--) {
		const ch = text[i];
		if (ch === '{') {
			openChar = '{';
			closeChar = '}';
			openPos = line.from + i;
			break;
		} else if (ch === '[') {
			openChar = '[';
			closeChar = ']';
			openPos = line.from + i;
			break;
		} else if (ch !== ' ' && ch !== '\t' && ch !== ',') {
			// 行尾不是以开括号或紧跟逗号结尾，则不具备折叠起点特征
			break;
		}
	}

	if (openPos === -1) return null;

	// 向后扫描配对闭合括号（设置安全上限 50000 行，完整覆盖超大文档）
	let depth = 1;
	const maxScanLines = Math.min(state.doc.lines, line.number + 50000);
	let inString = false;
	let quoteChar = '';

	for (let lineNum = line.number + 1; lineNum <= maxScanLines; lineNum++) {
		const curLine = state.doc.line(lineNum);
		const curText = curLine.text;

		for (let i = 0; i < curText.length; i++) {
			const ch = curText[i];
			if (inString) {
				if (ch === '\\') {
					i++; // 跳过转义字符
				} else if (ch === quoteChar) {
					inString = false;
				}
			} else {
				if (ch === '"' || ch === "'") {
					inString = true;
					quoteChar = ch;
				} else if (ch === openChar) {
					depth++;
				} else if (ch === closeChar) {
					depth--;
					if (depth === 0) {
						// 成功定位闭合括号，返回从起始行末尾到闭合括号的折叠区间
						if (curLine.number > line.number) {
							return {
								from: line.to,
								to: curLine.from + i,
							};
						}
						return null;
					}
				}
			}
		}
	}

	return null;
});
