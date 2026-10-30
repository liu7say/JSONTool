<template>
	<!-- 顶部统一 Header (Logo + Tools) -->
	<div class="header f-acrylic">
		<!-- 品牌标识与侧边栏折叠联动 -->
		<div
			class="brand"
			:style="{
				width: sessionStore.sidebarCollapsed ? '48px' : '140px',
				overflow: 'hidden',
			}">
			<Logo :collapsed="sessionStore.sidebarCollapsed" />
		</div>

		<div class="header-content">
			<!-- 左侧：编辑器工具组 -->
			<div class="toolbar-group left" v-if="activeTab">
				<!-- 视图切换 -->
				<div class="tool-section">
					<div class="f-button-group">
						<FButton
							v-if="activeTab.viewMode !== 'diff'"
							size="small"
							:type="activeTab.viewMode === 'table' ? 'primary' : 'subtle'"
							:disabled="
								activeTab.viewMode !== 'table' &&
								!String(activeTab.doc.sourceText || '').trim()
							"
							@click="triggerToggleTableRaw">
							<component
								:is="activeTab.viewMode === 'table' ? Back : Grid"
								style="width: 14px" />
							{{
								activeTab.viewMode === 'table'
									? t('app.back')
									: t('app.tableView')
							}}
						</FButton>

						<FButton
							v-if="activeTab.viewMode !== 'table'"
							size="small"
							:type="activeTab.viewMode === 'diff' ? 'primary' : 'subtle'"
							:disabled="
								activeTab.viewMode !== 'diff' &&
								!String(activeTab.doc.sourceText || '').trim()
							"
							@click="triggerToggleDiff">
							<component
								:is="activeTab.viewMode === 'diff' ? Back : Switch"
								style="width: 14px" />
							{{
								activeTab.viewMode === 'diff'
									? t('app.exitDiff')
									: t('app.diff')
							}}
						</FButton>
					</div>

					<!-- 对比模式下跳转到下一个差异点 -->
					<div
						class="f-button-group"
						v-if="
							activeTab.viewMode === 'diff' &&
							diffCount > 0 &&
							String(activeTab.doc.sourceText || '').trim() &&
							String(activeTab.compareContent || '').trim()
						">
						<FButton
							size="small"
							type="danger"
							@click="triggerNextDiff"
							:title="t('app.nextDiffTitle')">
							{{ t('app.nextDiff') }}
							<component :is="ArrowRight" style="width: 14px" />
						</FButton>
					</div>
				</div>

				<!-- 错误跳转 (仅 Code 模式) -->
				<div
					class="tool-section"
					v-if="activeTab.viewMode === 'code' && activeTab.doc.parseError">
					<FButton size="small" type="danger" @click="triggerNextError">
						{{ t('app.jumpToError') }}
					</FButton>
				</div>

				<!-- 格式化工具 (Code/Diff 模式) -->
				<div
					class="tool-section"
					v-if="
						activeTab.viewMode === 'code' || activeTab.viewMode === 'diff'
					">
					<div class="f-button-group" ref="formatButtonRef">
						<FButton
							size="small"
							type="subtle"
							class="group-left"
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click="triggerFormat"
							:title="t('app.format')">
							<component :is="DocumentCopy" style="width: 14px" />
							{{ t('app.format') }}
						</FButton>
						<FButton
							size="small"
							type="subtle"
							class="group-right"
							icon-only
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click.stop="showFormatMenu = !showFormatMenu"
							:title="t('app.formatOptions')">
							<component :is="ArrowDown" style="width: 12px; height: 12px" />
						</FButton>

						<!-- 格式化下拉菜单 -->
						<FPopoverMenu
							v-model:visible="showFormatMenu"
							:anchor="formatButtonRef"
							placement="bottom-start">
							<div class="menu-item switch-menu-item" @click.stop>
								<span style="white-space: nowrap">{{
									t('app.autoFormat')
								}}</span>
								<FVerticalSwitch
									v-model="settingsStore.autoFormatDetection"
									:title="t('app.autoFormat')"
									:aria-label="t('app.autoFormat')" />
							</div>
							<div class="menu-item switch-menu-item" @click.stop>
								<span style="white-space: nowrap">JS Object</span>
								<FVerticalSwitch
									:model-value="settingsStore.indent === 'jsObj'"
									@update:model-value="
										setFormatIndent($event ? 'jsObj' : 2, false)
									"
									title="JS Object"
									aria-label="JS Object" />
							</div>
							<div
								class="menu-item"
								@click="
									setFormatIndent(2);
									showFormatMenu = false;
								">
								<span>{{ t('app.indent2Spaces') }}</span>
								<div class="check-box">
									<component
										v-if="settingsStore.indent === 2"
										:is="Check"
										style="width: 12px" />
								</div>
							</div>
							<div
								class="menu-item"
								@click="
									setFormatIndent(4);
									showFormatMenu = false;
								">
								<span>{{ t('app.indent4Spaces') }}</span>
								<div class="check-box">
									<component
										v-if="settingsStore.indent === 4"
										:is="Check"
										style="width: 12px" />
								</div>
							</div>
						</FPopoverMenu>
					</div>
					<div class="f-button-group">
						<FButton
							size="small"
							type="subtle"
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click="triggerCompact"
							:title="t('app.compressDesc')">
							<component :is="ScaleToOriginal" style="width: 14px" />
							{{ t('app.compress') }}
						</FButton>
					</div>
				</div>

				<!-- Unicode 与中文字符互转 -->
				<div class="tool-section">
					<div class="f-button-group">
						<FButton
							size="small"
							type="subtle"
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click="triggerUnicodeToChinese"
							:title="t('app.unicodeToChineseTitle')">
							<component :is="MagicStick" style="width: 14px" />
							{{ t('app.unicodeToChinese') }}
						</FButton>
						<FButton
							size="small"
							type="subtle"
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click="triggerChineseToUnicode"
							:title="t('app.chineseToUnicodeTitle')">
							<component :is="Connection" style="width: 14px" />
							{{ t('app.chineseToUnicode') }}
						</FButton>
					</div>
				</div>

				<!-- 转义与去除转义 -->
				<div class="tool-section">
					<div class="f-button-group">
						<FButton
							size="small"
							type="subtle"
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click="triggerEscape"
							:title="t('app.escapeDesc')">
							<component :is="Link" style="width: 14px" />
							{{ t('app.escape') }}
						</FButton>
						<FButton
							size="small"
							type="subtle"
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click="triggerUnescape"
							:title="t('app.unescapeDesc')">
							<component :is="Unlock" style="width: 14px" />
							{{ t('app.unescape') }}
						</FButton>
					</div>
				</div>

				<!-- 排序 (Code 模式) -->
				<div class="tool-section" v-if="activeTab.viewMode === 'code'">
					<div class="f-button-group" ref="sortButtonRef">
						<FButton
							size="small"
							type="subtle"
							class="group-left"
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click="triggerSort"
							:title="t('app.sortDesc')">
							<component :is="Rank" style="width: 14px" />
							{{ t('app.sort') }}
						</FButton>
						<FButton
							size="small"
							type="subtle"
							class="group-right"
							icon-only
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click.stop="showSortMenu = !showSortMenu"
							:title="t('app.sortOptions')">
							<component :is="ArrowDown" style="width: 12px; height: 12px" />
						</FButton>

						<!-- 排序下拉菜单 -->
						<FPopoverMenu
							v-model:visible="showSortMenu"
							:anchor="sortButtonRef"
							placement="bottom-start">
							<div
								class="menu-item"
								@click="
									toggleSortStructureAtEnd();
									showSortMenu = false;
								">
								<span>{{ t('app.sortStructureAtEnd') }}</span>
								<div class="check-box">
									<component
										v-if="settingsStore.sortStructureAtEnd"
										:is="Check"
										style="width: 12px" />
								</div>
							</div>
						</FPopoverMenu>
					</div>
				</div>

				<!-- 代码折叠 (Code 模式) -->
				<div class="tool-section" v-if="activeTab.viewMode === 'code'">
					<div class="f-button-group">
						<FButton
							size="small"
							type="subtle"
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click="triggerExpandAll"
							:title="t('app.expandAllTitle')">
							<component :is="Expand" style="width: 14px" />
						</FButton>
						<FButton
							size="small"
							type="subtle"
							:disabled="!String(activeTab.doc.sourceText || '').trim()"
							@click="triggerCollapseAll"
							:title="t('app.collapseAllTitle')">
							<component :is="Fold" style="width: 14px" />
						</FButton>
					</div>
				</div>
			</div>
			<div class="toolbar-group left" v-else></div>

			<!-- 右侧：全局操作组 -->
			<div class="toolbar-group right">
				<FButton
					v-if="showHistoryEntry"
					size="small"
					type="subtle"
					icon-only
					@click="$emit('openHistory')"
					:class="{ 'bump-animation': historyButtonAnimate }"
					:title="t('app.historyTitle')">
					<component :is="Clock" style="width: 16px" />
				</FButton>

				<!-- 语言切换 (采用中性色按钮，防止主题蓝色干扰视觉) -->
				<div class="language-selector-wrapper" ref="languageButtonRef">
					<FButton
						size="small"
						type="subtle"
						color="neutral"
						icon-only
						@click.stop="showLanguageMenu = !showLanguageMenu"
						:title="t('common.language')">
						<span style="font-size: 12px; font-weight: 600">{{
							currentLanguageLabel
						}}</span>
					</FButton>

					<!-- 语言下拉菜单 -->
					<FPopoverMenu
						v-model:visible="showLanguageMenu"
						:anchor="languageButtonRef"
						placement="bottom-end">
						<div
							class="menu-item"
							@click="
								changeLocale('zh');
								showLanguageMenu = false;
							">
							<span>{{ t('common.chinese') }}</span>
							<div class="check-box">
								<component
									v-if="locale === 'zh'"
									:is="Check"
									style="width: 12px" />
							</div>
						</div>
						<div
							class="menu-item"
							@click="
								changeLocale('en');
								showLanguageMenu = false;
							">
							<span>{{ t('common.english') }}</span>
							<div class="check-box">
								<component
									v-if="locale === 'en'"
									:is="Check"
									style="width: 12px" />
							</div>
						</div>
					</FPopoverMenu>
				</div>

				<!-- 主题切换按钮 (采用中性色按钮，使其不呈现主题蓝色) -->
				<FButton
					size="small"
					type="subtle"
					color="neutral"
					icon-only
					@click="handleThemeToggle"
					:title="
						themeStore.isDark
							? t('common.switchToLight')
							: t('common.switchToDark')
					">
					<component
						:is="themeStore.isDark ? Moon : Sunny"
						style="width: 16px" />
				</FButton>

				<a
					class="f-button small subtle icon-only"
					title="GitHub"
					href="https://github.com/dnhyxc/JSONTool"
					target="_blank"
					style="
						text-decoration: none;
						color: var(--colorNeutralForeground1);
						border: none;
						background: transparent;
					">
					<component
						:is="BrandGithub"
						style="width: 16px; height: 16px" />
				</a>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { setLocale } from '../i18n';
import { useSessionStore } from '../stores/session';
import { useThemeStore } from '../stores/theme';
import { useSettingsStore } from '../stores/settings';
import Logo from '../components/Logo.vue';
import FButton from '../components/FButton.vue';
import FPopoverMenu from '../components/FPopoverMenu.vue';
import FVerticalSwitch from '../components/FVerticalSwitch.vue';
import {
	IconClock as Clock,
	IconMoon as Moon,
	IconSun as Sunny,
	IconCopy as DocumentCopy,
	IconArrowAutofitWidth as ScaleToOriginal,
	IconArrowsSort as Rank,
	IconLayoutGrid as Grid,
	IconArrowBackUp as Back,
	IconArrowsDiff as Switch,
	IconChevronRight as ArrowRight,
	IconChevronDown as ArrowDown,
	IconCheck as Check,
	IconArrowsMaximize as Expand,
	IconArrowsMinimize as Fold,
	IconLink as Link,
	IconLockOpen as Unlock,
	IconWand as MagicStick,
	IconTransfer as Connection,
	IconBrandGithub as BrandGithub,
} from '@tabler/icons-vue';

const props = defineProps({
	// 编辑器内容区实例（暴露了操作方法与状态）
	editor: {
		type: Object,
		default: null,
	},
});

defineEmits(['openHistory', 'saveHistory']);

const { t, locale } = useI18n();
const sessionStore = useSessionStore();
const themeStore = useThemeStore();
const settingsStore = useSettingsStore();

const activeTab = computed(() => sessionStore.activeTab);
const diffCount = computed(() => props.editor?.diffCount || 0);

// 是否显示历史记录按钮入口 (原版默认受控为 false)
const showHistoryEntry = false;

// 格式化与排序下拉菜单控制
const showFormatMenu = ref(false);
const formatButtonRef = ref(null);
const showSortMenu = ref(false);
const sortButtonRef = ref(null);

// 语言切换下拉菜单
const showLanguageMenu = ref(false);
const languageButtonRef = ref(null);
const currentLanguageLabel = computed(() =>
	locale.value === 'zh' ? '中' : 'EN'
);

const changeLocale = (value) => {
	setLocale(value);
	showLanguageMenu.value = false;
};

// 历史按钮弹跳动画控制
const historyButtonAnimate = ref(false);

/**
 * 触发格式化操作
 */
const triggerFormat = () => {
	const currentIndent = settingsStore.indent;
	if (currentIndent === 'jsObj') {
		props.editor?.applyFormat({ indent: 2, format: 'jsObj' });
	} else {
		props.editor?.applyFormat({ indent: currentIndent, format: 'json' });
	}
};

/**
 * 设置缩进并触发格式化
 */
const setFormatIndent = (indent, closeMenu = true) => {
	settingsStore.indent = indent;
	triggerFormat();
	if (closeMenu) {
		showFormatMenu.value = false;
	}
};

const triggerCompact = () => props.editor?.applyCompact();
const triggerEscape = () => props.editor?.applyEscape();
const triggerUnescape = () => props.editor?.applyUnescape();
const triggerUnicodeToChinese = () => props.editor?.applyUnicodeToChinese();
const triggerChineseToUnicode = () => props.editor?.applyChineseToUnicode();

const triggerSort = () => {
	props.editor?.applySort({
		structureAtEnd: settingsStore.sortStructureAtEnd,
	});
	showSortMenu.value = false;
};

const toggleSortStructureAtEnd = () => {
	settingsStore.sortStructureAtEnd = !settingsStore.sortStructureAtEnd;
	triggerSort();
};

const triggerToggleTableRaw = () => props.editor?.toggleTableMode();
const triggerToggleDiff = () => props.editor?.toggleDiffMode();
const triggerNextError = () => props.editor?.jumpToNextError();
const triggerExpandAll = () => props.editor?.expandAll();
const triggerCollapseAll = () => props.editor?.collapseAll();
const triggerNextDiff = () => props.editor?.nextDiff();

/**
 * 处理主题切换（支持视图平滑过渡波纹动画）
 */
const handleThemeToggle = (event) => {
	if (!document.startViewTransition) {
		themeStore.toggle();
		return;
	}

	const x = event.clientX;
	const y = event.clientY;

	const endRadius = Math.hypot(
		Math.max(x, innerWidth - x),
		Math.max(y, innerHeight - y),
	);

	const transition = document.startViewTransition(async () => {
		await themeStore.toggle();
		await nextTick();
	});

	transition.ready.then(() => {
		const clipPath = [
			`circle(0px at ${x}px ${y}px)`,
			`circle(${endRadius}px at ${x}px ${y}px)`,
		];
		document.documentElement.animate(
			{
				clipPath: clipPath,
			},
			{
				duration: 800,
				easing: 'ease-in-out',
				pseudoElement: '::view-transition-new(root)',
			},
		);
	});
};
</script>

<style scoped lang="scss">
.header {
	height: 48px;
	display: flex;
	align-items: center;
	padding: 0 16px 0 13px;
	border-bottom: 1px solid var(--colorNeutralStroke2);
	background-color: var(--colorNeutralBackground2);
	z-index: 100;
	flex-shrink: 0;
}

.brand {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 16px;
	margin-right: 0;
	width: 200px;
	flex-shrink: 0;
	color: var(--colorBrandBackground);
	transition: width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
	padding-right: 16px;
}

.header-content {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-width: 0;
}

.toolbar-group {
	display: flex;
	align-items: center;
	gap: 12px;

	&.left {
		flex: 1;
		justify-content: flex-start;
		min-width: 0; /* 允许弹性容器自适应收缩 */
		overflow-x: auto; /* 极端缩放下支持横向滚动，避免挤压破损 */
		overflow-y: hidden;
		scrollbar-width: none; /* 隐藏滚动条 */
		&::-webkit-scrollbar {
			display: none;
		}
	}

	&.right {
		flex-shrink: 0;
	}
}

.tool-section {
	display: flex;
	align-items: center;
	gap: 6px;
	padding-right: 12px;
	border-right: 1px solid var(--colorNeutralStroke1);
	flex-shrink: 0; /* 工具分区保持自身宽度，不被暴力挤压变形 */

	&:last-child {
		border-right: none;
	}
}

/* 分段式按钮组样式 (Segmented Button Group) */
.f-button-group {
	display: flex;
	align-items: center;
	position: relative;
	/* 移除容器边框，改为按钮各自持有边框以支持独立缩放与分段合并 */
	border: none;
	background-color: transparent;
	box-shadow: none;

	&:hover {
		border-color: transparent;
		box-shadow: none;
	}

	:deep(.f-button),
	.f-button {
		border-radius: 0;
		border: 1px solid var(--colorNeutralStroke1);
		box-shadow: none !important;
		margin: 0;
		height: 24px;
		background-color: transparent;
		color: var(--colorNeutralForeground1);
		position: relative;
		padding: 0 8px;
		white-space: nowrap; /* 保证分段按钮文本严格单行，禁止换行 */
		overflow: hidden; /* 严格隐藏超出边界的内容，杜绝破框 */
		text-overflow: ellipsis; /* 溢出文本省略截断 */

		/* 内部图标防挤压变形 */
		.f-icon,
		svg {
			flex-shrink: 0;
		}

		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;

		&:not(:first-of-type) {
			margin-left: -1px;
		}

		&:first-of-type {
			border-top-left-radius: 2px;
			border-bottom-left-radius: 2px;
		}

		&:last-of-type {
			border-top-right-radius: 2px;
			border-bottom-right-radius: 2px;
		}

		&:hover:not(:disabled):not(.disabled),
		&:focus:not(:disabled):not(.disabled) {
			background-color: var(--colorNeutralBackgroundSubtle-hover);
			border-color: var(--colorNeutralForeground2);
			z-index: 5;
		}

		&:active:not(:disabled):not(.disabled) {
			background-color: var(--colorNeutralBackgroundSubtle-active);
			transform: scale(0.96);
			z-index: 5;
		}

		&.group-left {
			padding: 0 8px;
		}

		&.group-right {
			padding: 0;
			width: 20px;
			flex-shrink: 0; /* 下拉箭头按钮禁止被压缩 */
		}

		&.primary {
			background-color: var(--colorBrandBackground);
			border-color: var(--colorBrandBackground);
			color: white;

			&:hover:not(:disabled):not(.disabled),
			&:focus:not(:disabled):not(.disabled) {
				background-color: var(--colorBrandBackgroundHover);
				border-color: var(--colorBrandBackgroundHover);
			}

			&:active:not(:disabled):not(.disabled) {
				background-color: var(--colorBrandBackgroundPressed);
				border-color: var(--colorBrandBackgroundPressed);
			}
		}

		&.danger {
			background-color: var(--colorStatusErrorForeground);
			border-color: var(--colorStatusErrorForeground);
			color: white;

			&:hover:not(:disabled):not(.disabled),
			&:focus:not(:disabled):not(.disabled) {
				filter: brightness(0.9);
				border-color: var(--colorStatusErrorForeground);
			}

			&:active:not(:disabled):not(.disabled) {
				filter: brightness(0.8);
			}
		}

		&:disabled,
		&.disabled {
			background-color: transparent;
			color: var(--colorNeutralForegroundDisabled);
			cursor: not-allowed;
		}
	}
}

.language-selector-wrapper {
	position: relative;
	display: inline-flex;
}

/* 按钮弹跳动效 */
.bump-animation {
	animation: bump 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes bump {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.2);
	}
	100% {
		transform: scale(1);
	}
}
</style>
