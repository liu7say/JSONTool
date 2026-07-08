import { EditorView } from '@codemirror/view';

/**
 * CodeMirror 的 Fluent 2 主题
 * 使用 src/styles/fluent.scss 中定义的标准 CSS 变量，移除所有的旧版别名，保持纯正风格
 */
export const fluentTheme = EditorView.theme({
	// 编辑器基础容器样式 (Base Editor Styles)
	'&': {
		height: '100%',
		fontSize: '14px',
		color: 'var(--colorNeutralForeground1)',
		backgroundColor: 'var(--f-editor-bg)',
		fontFamily: "'Fira Code', 'Microsoft YaHei', 'PingFang SC', monospace",
	},
	// 滚动区域 (Scroller)
	'.cm-scroller': {
		overflow: 'auto',
		fontFamily: "'Fira Code', 'Microsoft YaHei', 'PingFang SC', monospace",
	},
	// 侧边栏/行号区域 (Gutters)
	'.cm-gutters': {
		backgroundColor: 'var(--f-editor-gutter-bg)',
		color: 'var(--colorNeutralForegroundDisabled)',
		borderRight: '1px solid var(--f-editor-gutter-border)',
		paddingRight: '6px',
	},
	// 激活行对应的侧边行号
	'.cm-activeLineGutter': {
		backgroundColor: 'var(--colorNeutralBackgroundSubtle)',
		color: 'var(--colorNeutralForeground1)',
		fontWeight: 'bold',
	},
	// 当前激活的行 (Active Line)
	'.cm-activeLine': {
		backgroundColor:
			'color-mix(in srgb, var(--colorNeutralForeground1), transparent 96%)',
	},
	// 选中区域底色 - CodeMirror 编辑器层 (Selection - CodeMirror Layer)
	'.cm-selectionBackground': {
		backgroundColor: 'var(--colorBrandBackground) !important',
		opacity: '0.3 !important',
	},
	// 原生文本选中区配置 (Selection - Native Layer)
	'::selection': {
		backgroundColor:
			'color-mix(in srgb, var(--colorBrandBackground), transparent 70%) !important',
		color: 'var(--colorNeutralForeground1) !important',
	},
	// 获得焦点时的选中区样式
	'&.cm-focused .cm-selectionBackground': {
		backgroundColor: 'var(--colorBrandBackground) !important',
		opacity: '0.3 !important',
	},

	// 折叠栏槽 (Fold Gutter)
	'.cm-foldGutter': {
		width: '12px',
	},
	'.cm-foldGutter .cm-gutterElement': {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		cursor: 'pointer',
		color: 'var(--colorNeutralForeground2)',
		fontSize: '12px',
		userSelect: 'none',
	},
	'.cm-foldGutter .cm-gutterElement:hover': {
		color: 'var(--colorBrandBackground)',
	},

	// --- 搜索面板 (Fluent 2 悬浮卡片网格样式) ---
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

	// 悬浮主面板卡片 (Floating Card Container)
	'.cm-search': {
		position: 'absolute !important',
		top: '12px !important',
		right: '24px !important',
		padding: '16px !important',
		backgroundColor: 'var(--colorNeutralBackground3) !important',
		color: 'var(--colorNeutralForeground1) !important',
		border: '1px solid var(--colorNeutralStroke2) !important',
		borderRadius: 'var(--borderRadiusXXLarge) !important',
		boxShadow: 'var(--f-shadow-16) !important',
		minWidth: '420px !important',
		maxWidth: '90vw !important',

		// 主双栏网格布局
		display: 'grid !important',
		gridTemplateColumns: '1fr 120px !important',
		columnGap: '12px !important',
		rowGap: '8px !important',
		alignItems: 'start !important',

		animation: 'slideIn 0.2s cubic-bezier(0, 0, 0.2, 1)',
		backdropFilter: 'blur(30px) saturate(125%)', // 亚克力磨砂效果
	},

	/* === 第 1 列：输入框及表单项 === */

	// 搜索输入框
	'.cm-search > input.cm-textfield[name="search"]': {
		gridColumn: '1 / 2 !important',
		gridRow: '1 / 2 !important',
		width: '100% !important',
	},

	// 替换输入框
	'.cm-search > input.cm-textfield[name="replace"]': {
		gridColumn: '1 / 2 !important',
		gridRow: '2 / 3 !important',
		width: '100% !important',
		marginTop: '8px !important',
	},

	// 搜索选项 Checkbox 标签
	'.cm-search > label': {
		gridColumn: '1 / 2 !important',
		gridRow: '3 / 4 !important',

		display: 'inline-flex !important',
		alignItems: 'center !important',
		marginTop: '8px !important',
		fontSize: '12px !important',
		cursor: 'pointer',
		userSelect: 'none',
		color: 'var(--colorNeutralForeground2)',
		textTransform: 'none !important',
	},

	// 调整复选框标签布局，防止重叠
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

	/* === 第 2 列：操作按钮 === */

	// 导航按钮 (上一个/下一个) 左右平分
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

	// 替换 & 替换全部
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

	/* === 关闭面板按钮 === */
	'.cm-search button[name="close"]': {
		position: 'absolute !important',
		top: '-12px !important',
		right: '-12px !important',
		width: '24px !important',
		height: '24px !important',
		borderRadius: '50% !important',
		backgroundColor: 'var(--colorNeutralBackground3) !important',
		border: '1px solid var(--colorNeutralStroke2) !important',
		color: 'var(--colorNeutralForeground2) !important',
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
		backgroundColor: 'var(--colorNeutralBackgroundSubtleHover) !important',
		color: 'var(--colorNeutralForeground1) !important',
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

	/* === 面板内的细微控件样式 === */

	// 输入框下划线风格 (Input Fields)
	'.cm-search input.cm-textfield': {
		fontSize: '13px !important',
		padding: '4px 0 !important',
		height: '28px !important',
		backgroundColor: 'transparent !important',
		border: 'none !important',
		borderBottom: '1px solid var(--colorNeutralStrokeStrong) !important',
		borderRadius: '0 !important',
		outline: 'none !important',
		color: 'var(--colorNeutralForeground1) !important',
		fontFamily: 'inherit',
		boxShadow: 'none !important',
	},
	'.cm-search input.cm-textfield:focus': {
		borderBottom: '2px solid var(--colorBrandBackground) !important',
		paddingBottom: '3px !important',
	},

	// 扁平交互按钮 (Flat Buttons)
	'.cm-search button': {
		appearance: 'none !important',
		webkitAppearance: 'none !important',
		fontSize: '12px !important',
		padding: '0 !important',
		height: '28px !important',
		backgroundColor: 'var(--colorNeutralBackgroundSubtle) !important',
		backgroundImage: 'none !important',
		boxShadow: 'none !important',
		textShadow: 'none !important',
		border: '1px solid var(--colorNeutralStroke1) !important',
		borderRadius: 'var(--borderRadiusMedium) !important',
		color: 'var(--colorNeutralForeground1) !important',
		cursor: 'pointer !important',
		display: 'flex !important',
		alignItems: 'center !important',
		justifyContent: 'center !important',
		textTransform: 'none !important',
	},
	'.cm-search button:hover': {
		backgroundColor: 'var(--colorNeutralBackgroundSubtleHover) !important',
		borderColor: 'var(--colorNeutralStroke1) !important',
	},
	'.cm-search button:active': {
		backgroundColor: 'var(--colorNeutralBackgroundSubtlePressed) !important',
		transform: 'scale(0.98)',
	},

	// 主色动作按钮 (Primary Buttons)
	'.cm-search button[name="replace"], .cm-search button[name="replaceAll"]': {
		backgroundColor: 'var(--colorBrandBackground) !important',
		color: 'white !important',
		border: '1px solid transparent !important',
	},
	'.cm-search button[name="replace"]:hover, .cm-search button[name="replaceAll"]:hover': {
		backgroundColor: 'var(--colorBrandBackgroundHover) !important',
	},

	// 复选框外观 (Checkboxes)
	'.cm-search input[type="checkbox"]': {
		appearance: 'none !important',
		webkitAppearance: 'none !important',
		width: '16px !important',
		height: '16px !important',
		border: '1px solid var(--colorNeutralForeground3) !important',
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
		backgroundColor: 'var(--colorBrandBackground) !important',
		borderColor: 'var(--colorBrandBackground) !important',
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

	// 强制删除自带的多余箭头
	'.cm-search button[name="next"]::before, .cm-search button[name="prev"]::before': {
		content: 'none !important',
		display: 'none !important',
	},
});
