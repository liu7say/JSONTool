<template>
	<!-- 全局底部状态栏 -->
	<footer class="footer status-bar" :class="{ error: statusBarInfo.isError }">
		<span>{{ statusBarInfo.text }}</span>
	</footer>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSessionStore } from '../stores/session';

const { t } = useI18n();
const sessionStore = useSessionStore();

const activeTab = computed(() => sessionStore.activeTab);

/**
 * 状态栏展示信息与错误态判定
 */
const statusBarInfo = computed(() => {
	if (!activeTab.value) return { text: t('common.ready'), isError: false };

	const tab = activeTab.value;
	const doc = tab.doc;

	if (tab.viewMode === 'table') {
		const path = tab.selectedArrayPath || t('app.topLevel');
		return { text: t('app.tableStatus', { path }), isError: false };
	}

	if (tab.viewMode === 'diff') {
		const mainLen = (doc.sourceText || '').length;
		const compareLen = (tab.compareContent || '').length;
		return {
			text: t('app.diffStatus', { main: mainLen, compare: compareLen }),
			isError: false,
		};
	}

	if (!String(doc.sourceText || '').trim()) {
		return { text: t('app.inputJson'), isError: false };
	}

	if (doc.parseError) {
		return { text: doc.parseError, isError: true };
	}

	return {
		text: t('app.jsonValid', { count: doc.sourceText.length }),
		isError: false,
	};
});
</script>

<style scoped lang="scss">
.footer {
	flex-shrink: 0;
	height: 24px;
	padding: 0 16px;
	display: flex;
	align-items: center;
	background-color: var(--colorBrandBackground);
	color: white;
	font-size: 11px;
	z-index: 100;
	user-select: none;

	&.error {
		background-color: var(--colorStatusErrorForeground);
	}
}
</style>
