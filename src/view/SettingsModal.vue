<template>
	<FModal
		:visible="visible"
		:title="t('settings.title')"
		width="560px"
		@update:visible="(val) => emit('update:visible', val)">
		<div class="settings-container">
			<!-- 分组 1: 外观与字体 -->
			<div class="settings-group">
				<div class="group-header">
					<component :is="PaletteIcon" class="group-icon" />
					<span class="group-title">{{ t('settings.appearance') }}</span>
				</div>

				<div class="settings-list">
					<!-- 界面字体 -->
					<div class="setting-item">
						<div class="setting-info">
							<span class="setting-label">{{ t('settings.uiFont') }}</span>
						</div>
						<div class="setting-control font-control">
							<select
								v-model="settingsStore.uiFont"
								class="f-select setting-select">
								<option
									v-for="preset in UI_FONT_PRESETS"
									:key="preset.value"
									:value="preset.value">
									{{ preset.label }}
								</option>
							</select>
							<input
								v-if="settingsStore.uiFont === 'custom'"
								v-model="settingsStore.customUiFont"
								type="text"
								class="f-input font-custom-input"
								:placeholder="t('settings.customFontPlaceholder')" />
						</div>
					</div>

					<!-- 界面字重 -->
					<div class="setting-item">
						<div class="setting-info">
							<span class="setting-label">{{ t('settings.uiFontWeight') }}</span>
						</div>
						<div class="setting-control">
							<select
								v-model.number="settingsStore.uiFontWeight"
								class="f-select setting-select">
								<option
									v-for="opt in UI_FONT_WEIGHT_OPTIONS"
									:key="opt.value"
									:value="opt.value">
									{{ opt.label }}
								</option>
							</select>
						</div>
					</div>

					<!-- 编辑器代码字体 -->
					<div class="setting-item">
						<div class="setting-info">
							<span class="setting-label">{{ t('settings.editorFont') }}</span>
						</div>
						<div class="setting-control font-control">
							<select
								v-model="settingsStore.editorFont"
								class="f-select setting-select">
								<option
									v-for="preset in EDITOR_FONT_PRESETS"
									:key="preset.value"
									:value="preset.value">
									{{ preset.label }}
								</option>
							</select>
							<input
								v-if="settingsStore.editorFont === 'custom'"
								v-model="settingsStore.customEditorFont"
								type="text"
								class="f-input font-custom-input"
								:placeholder="t('settings.customEditorFontPlaceholder')" />
						</div>
					</div>

					<!-- 编辑器代码字号 -->
					<div class="setting-item">
						<div class="setting-info">
							<span class="setting-label">{{ t('settings.editorFontSize') }}</span>
						</div>
						<div class="setting-control">
							<select
								v-model.number="settingsStore.editorFontSize"
								class="f-select setting-select">
								<option
									v-for="size in EDITOR_FONT_SIZE_OPTIONS"
									:key="size"
									:value="size">
									{{ size }}px {{ size === 14 ? '(默认)' : '' }}
								</option>
							</select>
						</div>
					</div>

					<!-- 编辑器代码字重 -->
					<div class="setting-item">
						<div class="setting-info">
							<span class="setting-label">{{ t('settings.editorFontWeight') }}</span>
						</div>
						<div class="setting-control">
							<select
								v-model.number="settingsStore.editorFontWeight"
								class="f-select setting-select">
								<option
									v-for="opt in EDITOR_FONT_WEIGHT_OPTIONS"
									:key="opt.value"
									:value="opt.value">
									{{ opt.label }}
								</option>
							</select>
						</div>
					</div>

					<!-- 无动画模式 -->
					<div class="setting-item">
						<div class="setting-info">
							<span class="setting-label">{{
								t('settings.reducedMotion')
							}}</span>
							<span class="setting-desc">{{
								t('settings.reducedMotionDesc')
							}}</span>
						</div>
						<div class="setting-control">
							<FVerticalSwitch
								v-model="settingsStore.reducedMotion"
								:title="t('settings.reducedMotion')"
								:aria-label="t('settings.reducedMotion')" />
						</div>
					</div>

					<!-- 自定义 CSS -->
					<div class="setting-item setting-item-column">
						<div class="setting-info">
							<span class="setting-label">{{ t('settings.customCss') }}</span>
							<span class="setting-desc">{{ t('settings.customCssDesc') }}</span>
						</div>
						<div class="setting-control-full">
							<textarea
								v-model="settingsStore.customCss"
								class="f-textarea custom-css-textarea"
								rows="4"
								:placeholder="t('settings.customCssPlaceholder')"
								spellcheck="false" />
						</div>
					</div>
				</div>
			</div>

			<!-- 分组 2: 编辑与存储 -->
			<div class="settings-group">
				<div class="group-header">
					<component :is="DatabaseIcon" class="group-icon" />
					<span class="group-title">{{ t('settings.editingAndStorage') }}</span>
				</div>

				<div class="settings-list">
					<!-- 数据自动存储 -->
					<div class="setting-item">
						<div class="setting-info">
							<span class="setting-label">{{ t('settings.autoSave') }}</span>
							<span class="setting-desc">{{ t('settings.autoSaveDesc') }}</span>
						</div>
						<div class="setting-control">
							<FVerticalSwitch
								v-model="settingsStore.autoSaveWorkspace"
								:title="t('settings.autoSave')"
								:aria-label="t('settings.autoSave')" />
						</div>
					</div>

					<!-- 格式自动检测 -->
					<div class="setting-item">
						<div class="setting-info">
							<span class="setting-label">{{ t('settings.autoFormat') }}</span>
							<span class="setting-desc">{{
								t('settings.autoFormatDesc')
							}}</span>
						</div>
						<div class="setting-control">
							<FVerticalSwitch
								v-model="settingsStore.autoFormatDetection"
								:title="t('settings.autoFormat')"
								:aria-label="t('settings.autoFormat')" />
						</div>
					</div>
				</div>
			</div>

			<!-- 多端同步状态底条 -->
			<div class="sync-banner f-acrylic">
				<component
					:is="CloudIcon"
					style="width: 14px; height: 14px; flex-shrink: 0" />
				<span class="sync-text">{{ t('settings.syncNotice') }}</span>
			</div>
		</div>
	</FModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import {
	useSettingsStore,
	UI_FONT_PRESETS,
	UI_FONT_WEIGHT_OPTIONS,
	EDITOR_FONT_PRESETS,
	EDITOR_FONT_SIZE_OPTIONS,
	EDITOR_FONT_WEIGHT_OPTIONS,
} from '../stores/settings';
import FModal from '../components/FModal.vue';
import FVerticalSwitch from '../components/FVerticalSwitch.vue';
import {
	IconPalette as PaletteIcon,
	IconDatabase as DatabaseIcon,
	IconCloud as CloudIcon,
} from '@tabler/icons-vue';

defineProps({
	visible: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['update:visible']);

const { t } = useI18n();
const settingsStore = useSettingsStore();
</script>

<style scoped lang="scss">
.settings-container {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

/* 分组卡片 */
.settings-group {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.group-header {
	display: flex;
	align-items: center;
	gap: 8px;
	padding-bottom: 4px;
	border-bottom: 1px solid var(--colorNeutralStroke2);
}

.group-icon {
	width: 16px;
	height: 16px;
	color: var(--colorBrandBackground);
}

.group-title {
	font-size: 13px;
	font-weight: var(--fontWeightSemibold);
	color: var(--colorNeutralForeground2);
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

/* 列表项集合 */
.settings-list {
	display: flex;
	flex-direction: column;
	background-color: var(--colorNeutralBackground1);
	border: 1px solid var(--colorNeutralStroke2);
	border-radius: var(--borderRadiusLarge);
	overflow: hidden;
}

.setting-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 14px;
	gap: 16px;
	border-bottom: 1px solid var(--colorNeutralStroke3);

	&:last-child {
		border-bottom: none;
	}
}

.setting-info {
	display: flex;
	flex-direction: column;
	gap: 3px;
	flex: 1;
	min-width: 0;
}

.setting-label {
	font-size: 14px;
	font-weight: var(--fontWeightMedium);
	color: var(--colorNeutralForeground1);
}

.setting-desc {
	font-size: 12px;
	color: var(--colorNeutralForeground3);
	line-height: 1.4;
}

.setting-control {
	display: flex;
	align-items: center;
	flex-shrink: 0;
}

.font-control {
	display: flex;
	flex-direction: column;
	gap: 6px;
	align-items: flex-end;
}

/* 通用 Select 与 Input */
.setting-select {
	min-width: 170px;
	height: 28px;
	padding: 0 10px;
	font-size: 13px;
	border-radius: var(--borderRadiusMedium);
	border: 1px solid var(--colorNeutralStroke1);
	background-color: var(--colorNeutralBackground2);
	color: var(--colorNeutralForeground1);
	outline: none;
	cursor: pointer;
	transition:
		border-color var(--f-transition-fast),
		background-color var(--f-transition-fast);

	&:hover {
		border-color: var(--colorNeutralStrokeAccessible);
	}

	&:focus {
		border-color: var(--colorBrandBackground);
	}
}

.font-custom-input {
	width: 170px;
	height: 28px;
	padding: 0 8px;
	font-size: 12px;
	border-radius: var(--borderRadiusMedium);
	border: 1px solid var(--colorNeutralStroke1);
	background-color: var(--colorNeutralBackground2);
	color: var(--colorNeutralForeground1);
	outline: none;
	box-sizing: border-box;

	&:focus {
		border-color: var(--colorBrandBackground);
	}
}

/* 垂直通栏设置项与自定义 CSS 文本域 */
.setting-item-column {
	flex-direction: column;
	align-items: stretch;
	gap: 10px;
}

.setting-control-full {
	width: 100%;
}

.custom-css-textarea {
	width: 100%;
	min-height: 84px;
	padding: 8px 10px;
	font-family: var(--fontFamilyMonospace);
	font-size: 12px;
	line-height: 1.5;
	border-radius: var(--borderRadiusMedium);
	border: 1px solid var(--colorNeutralStroke1);
	background-color: var(--colorNeutralBackground2);
	color: var(--colorNeutralForeground1);
	outline: none;
	resize: vertical;
	box-sizing: border-box;
	transition: border-color var(--f-transition-fast);

	&:focus {
		border-color: var(--colorBrandBackground);
	}

	&::placeholder {
		color: var(--colorNeutralForeground4);
	}
}

/* 底部多端同步状态条 */
.sync-banner {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	margin-top: 4px;
	border-radius: var(--borderRadiusMedium);
	border: 1px dashed var(--colorNeutralStroke1);
	color: var(--colorNeutralForeground3);
	font-size: 12px;
	background-color: var(--colorNeutralBackground3);
}

.sync-text {
	line-height: 1.3;
}
</style>
