import { foldGutter } from '@codemirror/language';

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
