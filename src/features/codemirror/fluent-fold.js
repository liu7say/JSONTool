import { foldGutter } from '@codemirror/language';

// 定义 Fluent Design 风格的折叠图标
const chevronRight = `
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="9 18 15 12 9 6"></polyline>
</svg>
`;

const chevronDown = `
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="6 9 12 15 18 9"></polyline>
</svg>
`;

/**
 * 自定义 CodeMirror 折叠槽
 * 使用 SVG 图标替代默认的三角箭头，以匹配 Fluent Design 风格
 */
export const fluentFoldGutter = foldGutter({
	markerDOM: (open) => {
		const span = document.createElement('span');
		span.style.display = 'flex';
		span.style.alignItems = 'center';
		span.style.justifyContent = 'center';
		span.style.width = '100%';
		span.style.height = '100%';
		span.innerHTML = open ? chevronDown : chevronRight;
		return span;
	},
});
