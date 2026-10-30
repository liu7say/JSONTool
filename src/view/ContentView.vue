<template>
	<!-- 主内容工作区 (编辑器 / 空状态) -->
	<main class="content-area">
		<!-- 标签切换原地平滑过渡容器 (避免销毁重建编辑器实例) -->
		<div
			v-if="activeTab"
			class="editor-transition-container"
			:class="{ 'tab-switching': isSwitching }"
			@animationend="onAnimationEnd">
			<JsonEditor
				ref="jsonEditorRef"
				:doc="activeTab.doc"
				:view-mode="activeTab.viewMode"
				:selected-array-path="activeTab.selectedArrayPath"
				:compare-content="activeTab.compareContent"
				:fold-ranges="activeTab.foldRanges"
				:auto-format-detection="settingsStore.autoFormatDetection"
				@update:doc="(val) => sessionStore.updateTabDoc(activeTab.id, val)"
				@update:view-mode="
					(val) => sessionStore.updateTabViewMode(activeTab.id, val)
				"
				@update:selected-array-path="
					(val) => sessionStore.updateTabArrayPath(activeTab.id, val)
				"
				@update:compare-content="
					(val) => sessionStore.updateTabCompareContent(activeTab.id, val)
				"
				@update:fold-ranges="
					(val) => sessionStore.updateTabFoldRanges(activeTab.id, val)
				"
				@save="$emit('save', activeTab)" />
		</div>
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
import { ref, computed, watch } from 'vue';
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

// 标签切换动效控制：保持编辑器实例常驻，通过 CSS 动画实现原地丝滑过渡
const isSwitching = ref(false);
let switchRafId = null;

watch(
	() => sessionStore.activeTabId,
	(newId, oldId) => {
		// 仅在不同标签之间真实切换时触发微动效，新建首个标签或关闭不触发
		if (newId && oldId && newId !== oldId) {
			if (switchRafId) cancelAnimationFrame(switchRafId);
			isSwitching.value = false;
			// 双重 rAF 确保 DOM 样式帧被重置后再添加动画类，即使用户极速连击切换也能稳定重新触发
			switchRafId = requestAnimationFrame(() => {
				switchRafId = requestAnimationFrame(() => {
					isSwitching.value = true;
				});
			});
		}
	},
);

const onAnimationEnd = () => {
	isSwitching.value = false;
};

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

/* 标签切换流畅动效容器 (遵循 Fluent 2 规范) */
.editor-transition-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;

	&.tab-switching {
		/* 280ms 从容的高阶平滑淡入，采用自然减速缓动，绝无位移与抽搐感 */
		animation: tabContentSmoothFade 500ms ease-in-out;
		will-change: opacity;
	}
}

@keyframes tabContentSmoothFade {
	0% {
		opacity: 0.6;
	}
	100% {
		opacity: 1;
	}
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
