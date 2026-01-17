import { EditorView } from '@codemirror/view';

/**
 * CodeMirror 的 Fluent 2 主题
 * 使用 src/styles/fluent.scss 中定义的 CSS 变量
 */
export const fluentTheme = EditorView.theme({
	// Base Editor Styles
	'&': {
		height: '100%',
		fontSize: '14px',
		color: 'var(--f-text-primary)',
		backgroundColor: 'var(--f-editor-bg)',
		fontFamily: "'Cascadia Code', Consolas, monospace",
	},
	// Scroller
	'.cm-scroller': {
		overflow: 'auto',
		fontFamily: "'Cascadia Code', Consolas, monospace",
	},
	// Gutters
	'.cm-gutters': {
		backgroundColor: 'var(--f-editor-gutter-bg)',
		color: 'var(--f-text-disabled)',
		borderRight: '1px solid var(--f-editor-gutter-border)',
		paddingRight: '6px',
	},
	'.cm-activeLineGutter': {
		backgroundColor: 'var(--f-bg-control)',
		color: 'var(--f-text-primary)',
		fontWeight: 'bold',
	},
	// Active Line
	'.cm-activeLine': {
		backgroundColor:
			'color-mix(in srgb, var(--f-text-primary), transparent 96%)',
	},
	// Selection - CodeMirror Layer
	'.cm-selectionBackground': {
		backgroundColor: 'var(--f-brand-base) !important',
		opacity: '0.3 !important',
	},
	// Selection - Native Layer (for simple text selection fallback)
	'::selection': {
		backgroundColor:
			'color-mix(in srgb, var(--f-brand-base), transparent 70%) !important',
		color: 'var(--f-text-primary) !important',
	},
	// Focused State
	'&.cm-focused .cm-selectionBackground': {
		backgroundColor: 'var(--f-brand-base) !important',
		opacity: '0.3 !important',
	},

	// Fold Gutter
	'.cm-foldGutter': {
		width: '12px',
	},
	'.cm-foldGutter .cm-gutterElement': {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		cursor: 'pointer',
		color: 'var(--f-text-secondary)',
		fontSize: '12px',
		userSelect: 'none',
	},
	'.cm-foldGutter .cm-gutterElement:hover': {
		color: 'var(--f-brand-base)',
	},

	// --- SEARCH PANEL (Fluent 2 Flyout Grid Style) ---
	'.cm-panels': {
		backgroundColor: 'transparent !important',
		border: 'none !important',
		zIndex: '200',
	},
	'.cm-panels-top': {
		borderBottom: 'none !important',
	},
	'.cm-panels-bottom': {
		borderTop: 'none !important',
	},

	// Floating Card Container
	'.cm-search': {
		position: 'absolute !important',
		top: '12px !important',
		right: '24px !important',
		padding: '16px !important',
		backgroundColor: 'var(--f-bg-layer2) !important',
		color: 'var(--f-text-primary) !important',
		border: '1px solid var(--f-border-subtle) !important',
		borderRadius: 'var(--f-radius-l) !important',
		boxShadow: 'var(--f-shadow-16) !important',
		minWidth: '420px !important',
		maxWidth: '90vw !important',

		// Master Grid: 2 Columns
		display: 'grid !important',
		gridTemplateColumns: '1fr 120px !important' /* 120px for Buttons */,
		columnGap: '12px !important',
		rowGap: '8px !important',
		alignItems: 'start !important',

		animation: 'slideIn 0.2s cubic-bezier(0, 0, 0.2, 1)',
		backdropFilter: 'blur(30px) saturate(125%)', // Acrylic
	},

	/* === COLUMN 1: Inputs === */

	// 1. Search Input
	'.cm-search > input.cm-textfield[name="search"]': {
		gridColumn: '1 / 2 !important',
		gridRow: '1 / 2 !important',
		width: '100% !important',
	},

	// 2. Replace Input
	'.cm-search > input.cm-textfield[name="replace"]': {
		gridColumn: '1 / 2 !important',
		gridRow: '2 / 3 !important',
		width: '100% !important',
		marginTop: '8px !important',
	},

	// 3. Options labels
	'.cm-search > label': {
		gridColumn: '1 / 2 !important',
		gridRow: '3 / 4 !important',

		display: 'inline-flex !important',
		alignItems: 'center !important',
		marginTop: '8px !important',
		fontSize: '12px !important',
		cursor: 'pointer',
		userSelect: 'none',
		color: 'var(--f-text-secondary)',
		textTransform: 'none !important',

		// Prevent overlapping by default?
		// We rely on manual positioning below because they share the grid cell.
	},

	// Manual spacing for labels
	'.cm-search > label:nth-of-type(1)': {
		justifySelf: 'start !important',
		marginLeft: '0 !important',
	},
	'.cm-search > label:nth-of-type(2)': {
		justifySelf: 'start !important',
		marginLeft: '95px !important',
	},
	'.cm-search > label:nth-of-type(3)': {
		justifySelf: 'start !important',
		marginLeft: '170px !important',
	},

	/* === COLUMN 2: Actions === */

	// 1. Navigation Buttons (Prev/Next)
	// Side-by-side split with larger gap
	'.cm-search button[name="prev"]': {
		gridColumn: '2 / 3 !important',
		gridRow: '1 / 2 !important',
		width: '44% !important',
		justifySelf: 'start !important',
		margin: '0 !important',
	},
	'.cm-search button[name="next"]': {
		gridColumn: '2 / 3 !important',
		gridRow: '1 / 2 !important',
		width: '44% !important',
		justifySelf: 'end !important',
		margin: '0 !important',
	},

	// 2. Replace & Replace All
	'.cm-search button[name="replace"]': {
		gridColumn: '2 / 3 !important',
		gridRow: '2 / 3 !important',
		width: '100% !important',
		marginTop: '0 !important',
	},
	'.cm-search button[name="replaceAll"]': {
		gridColumn: '2 / 3 !important',
		gridRow: '3 / 4 !important',
		width: '100% !important',
		marginTop: '0 !important',
	},

	'.cm-search button[name="select"]': {
		display: 'none !important',
	},

	/* === CLOSE BUTTON === */
	'.cm-search button[name="close"]': {
		position: 'absolute !important',
		top: '-12px !important',
		right: '-12px !important',
		width: '24px !important',
		height: '24px !important',
		borderRadius: '50% !important',
		backgroundColor: 'var(--f-bg-layer2) !important',
		border: '1px solid var(--f-border-subtle) !important',
		color: 'var(--f-text-secondary) !important',
		display: 'flex !important',
		alignItems: 'center !important',
		justifyContent: 'center !important',
		zIndex: '201 !important',
		boxShadow: 'var(--f-shadow-4) !important',
		cursor: 'pointer !important',
		padding: '0 !important',
		fontSize: '0 !important',
	},
	'.cm-search button[name="close"]:hover': {
		backgroundColor: 'var(--f-bg-control-hover) !important',
		color: 'var(--f-text-primary) !important',
	},
	'.cm-search button[name="close"]::before': {
		content: '"✕" !important',
		fontSize: '12px !important',
		lineHeight: '1 !important',
		display: 'block !important',
		color: 'inherit !important',
		margin: '0 !important',
	},
	'.cm-search button[name="close"]::after': { content: 'none !important' },

	/* === COMPONENT STYLING === */

	// Inputs
	'.cm-search input.cm-textfield': {
		fontSize: '13px !important',
		padding: '4px 0 !important',
		height: '28px !important',
		backgroundColor: 'transparent !important',
		border: 'none !important',
		borderBottom: '1px solid var(--f-border-strong) !important',
		borderRadius: '0 !important',
		outline: 'none !important',
		color: 'var(--f-text-primary) !important',
		fontFamily: 'inherit',
		boxShadow: 'none !important',
	},
	'.cm-search input.cm-textfield:focus': {
		borderBottom: '2px solid var(--f-brand-base) !important',
		paddingBottom: '3px !important',
	},

	// Buttons (Flat)
	'.cm-search button': {
		appearance: 'none !important',
		webkitAppearance: 'none !important',
		fontSize: '12px !important',
		padding: '0 !important',
		height: '28px !important',
		backgroundColor: 'var(--f-bg-control) !important',
		backgroundImage: 'none !important',
		boxShadow: 'none !important',
		textShadow: 'none !important',
		border: '1px solid var(--f-border-default) !important',
		borderRadius: 'var(--f-radius-s) !important',
		color: 'var(--f-text-primary) !important',
		cursor: 'pointer !important',
		display: 'flex !important',
		alignItems: 'center !important',
		justifyContent: 'center !important',
		textTransform: 'none !important',
	},
	'.cm-search button:hover': {
		backgroundColor: 'var(--f-bg-control-hover) !important',
		borderColor: 'var(--f-border-default) !important',
	},
	'.cm-search button:active': {
		backgroundColor: 'var(--f-bg-control-active) !important',
		transform: 'scale(0.98)',
	},

	// Primary Actions
	'.cm-search button[name="replace"], .cm-search button[name="replaceAll"]': {
		backgroundColor: 'var(--f-brand-base) !important',
		color: 'white !important',
		border: '1px solid transparent !important',
	},
	'.cm-search button[name="replace"]:hover, .cm-search button[name="replaceAll"]:hover':
		{
			backgroundColor: 'var(--f-brand-hover) !important',
		},

	// Checkboxes
	'.cm-search input[type="checkbox"]': {
		appearance: 'none !important',
		webkitAppearance: 'none !important',
		width: '16px !important',
		height: '16px !important',
		border: '1px solid var(--f-text-tertiary) !important',
		borderRadius: '3px !important',
		backgroundColor: 'transparent !important',
		marginRight: '6px !important',
		marginTop: '0 !important',
		verticalAlign: 'middle !important',
		position: 'relative !important',
		top: '0 !important',
		cursor: 'pointer !important',
	},
	'.cm-search input[type="checkbox"]:checked': {
		backgroundColor: 'var(--f-brand-base) !important',
		borderColor: 'var(--f-brand-base) !important',
	},
	'.cm-search input[type="checkbox"]:checked::after': {
		content: '""',
		position: 'absolute',
		left: '5px',
		top: '2px',
		width: '4px',
		height: '8px',
		border: 'solid white',
		borderWidth: '0 2px 2px 0',
		transform: 'rotate(45deg)',
		display: 'block !important',
	},

	// --- STRICTLY REMOVE ARROWS ---
	'.cm-search button[name="next"]::before, .cm-search button[name="prev"]::before':
		{
			content: 'none !important',
			display: 'none !important',
		},
});
