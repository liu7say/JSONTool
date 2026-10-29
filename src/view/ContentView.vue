<template>
	<!-- 主内容工作区 (编辑器 / 空状态) -->
	<main class="content-area">
		<JsonEditor
			v-if="activeTab"
			ref="jsonEditorRef"
			:doc="activeTab.doc"
			:view-mode="activeTab.viewMode"
			:selected-array-path="activeTab.selectedArrayPath"
			:compare-content="activeTab.compareContent"
			:fold-ranges="activeTab.foldRanges"
			:auto-format-detection="settingsStore.autoFormatDetection"
			@update:doc="(val) => sessionStore.updateTabDoc(activeTab.id, val)"
			@update:view-mode="(val) => sessionStore.updateTabViewMode(activeTab.id, val)"
			@update:selected-array-path="
				(val) => sessionStore.updateTabArrayPath(activeTab.id, val)
			"
			@update:compare-content="
				(val) => sessionStore.updateTabCompareContent(activeTab.id, val)
			"
			@update:fold-ranges="(val) => sessionStore.updateTabFoldRanges(activeTab.id, val)"
			@save="$emit('save', activeTab)" />
		<div v-else class="empty-state">
			<div class="empty-content">
				<h3>{{ t('app.noOpenFiles') }}</h3>
				<FButton type="primary" @click="sessionStore.createTab()">
					{{ t('app.newJson') }}
				</FButton>
			</div>
		</div>
	</main>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSessionStore } from '../stores/session';
import { useSettingsStore } from '../stores/settings';
import JsonEditor from '../components/JsonEditor.vue';
import FButton from '../components/FButton.vue';

defineEmits(['save']);

const { t } = useI18n();
const sessionStore = useSessionStore();
const settingsStore = useSettingsStore();

const activeTab = computed(() => sessionStore.activeTab);
const jsonEditorRef = ref(null);

// 向外暴露编辑器指令方法与响应式状态，供 HeaderView 与全局快捷键调度
defineExpose({
	applyFormat: (...args) => jsonEditorRef.value?.applyFormat(...args),
	applyCompact: () => jsonEditorRef.value?.applyCompact(),
	applyEscape: () => jsonEditorRef.value?.applyEscape(),
	applyUnescape: () => jsonEditorRef.value?.applyUnescape(),
	applyUnicodeToChinese: () => jsonEditorRef.value?.applyUnicodeToChinese(),
	applyChineseToUnicode: () => jsonEditorRef.value?.applyChineseToUnicode(),
	applySort: (...args) => jsonEditorRef.value?.applySort(...args),
	toggleTableMode: () => jsonEditorRef.value?.toggleTableMode(),
	toggleDiffMode: () => jsonEditorRef.value?.toggleDiffMode(),
	jumpToNextError: () => jsonEditorRef.value?.jumpToNextError(),
	expandAll: () => jsonEditorRef.value?.expandAll(),
	collapseAll: () => jsonEditorRef.value?.collapseAll(),
	nextDiff: () => jsonEditorRef.value?.nextDiff(),
	get diffCount() {
		return jsonEditorRef.value?.diffCount || 0;
	},
	rawEditor: jsonEditorRef,
});
</script>

<style scoped lang="scss">
.content-area {
	flex: 1;
	overflow: hidden;
	position: relative;
}

.empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
}

.empty-content {
	text-align: center;
	color: var(--colorNeutralForeground2);

	h3 {
		margin-bottom: 20px;
		font-weight: normal;
	}
}
</style>
