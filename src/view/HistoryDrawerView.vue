<template>
	<!-- 历史记录抽屉遮罩 -->
	<div
		class="f-drawer-overlay"
		v-if="visible"
		@click="$emit('update:visible', false)"></div>

	<!-- 历史记录抽屉面板 (从右侧滑出) -->
	<aside class="f-drawer" :class="{ open: visible }">
		<div class="f-drawer-header">
			<span>{{ t('app.history') }}</span>
			<FButton type="subtle" icon-only @click="$emit('update:visible', false)">
				<component :is="Close" style="width: 18px" />
			</FButton>
		</div>

		<div class="history-list">
			<div v-if="!historyStore.index.length" class="muted-text">
				{{ t('app.noHistory') }}
			</div>
			<div
				v-for="item in historyStore.index"
				:key="item.id"
				class="history-entry f-card"
				@click="handleLoadEntry(item)">
				<div class="entry-main">
					<div class="entry-title">{{ item.title }}</div>
					<div class="entry-time">
						{{ new Date(item.createdAt).toLocaleString() }}
					</div>
				</div>
				<FButton
					type="subtle"
					icon-only
					class="entry-del"
					@click.stop="historyStore.removeEntry(item.id)"
					:title="t('app.deleteEntry')">
					<component
						:is="Delete"
						style="width: 14px; color: var(--colorStatusErrorForeground)" />
				</FButton>
			</div>

			<div v-if="historyStore.index.length" class="history-footer">
				<FButton
					type="subtle"
					style="color: var(--colorStatusErrorForeground)"
					@click="historyStore.clearAll">
					{{ t('app.clearAll') }}
				</FButton>
			</div>
		</div>
	</aside>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useHistoryStore } from '../stores/history';
import { useSessionStore } from '../stores/session';
import FButton from '../components/FButton.vue';
import { IconX as Close, IconTrash as Delete } from '@tabler/icons-vue';

defineProps({
	visible: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['update:visible', 'entryLoaded']);

const { t } = useI18n();
const historyStore = useHistoryStore();
const sessionStore = useSessionStore();

/**
 * 加载历史记录条目到新标签页
 * @param {Object} entry - 历史记录索引项
 */
const handleLoadEntry = async (entry) => {
	const data = await historyStore.loadEntry(entry.id);
	if (data && data.doc) {
		const tab = sessionStore.createTab(data.doc.sourceText);
		tab.title = entry.title || tab.title;
		if (data.toolState?.viewMode) {
			tab.viewMode = data.toolState.viewMode;
		}
		emit('entryLoaded', tab);
	}
	emit('update:visible', false);
};
</script>

<style scoped lang="scss">
.history-list {
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;
	overflow-y: auto;
	flex: 1;
}

.history-entry {
	display: flex;
	align-items: center;
	padding: 10px 12px;
	cursor: pointer;
	border-radius: 6px;
	transition: background-color 0.2s;
	background-color: var(--colorNeutralBackground2);
	border: 1px solid var(--colorNeutralStroke1);

	&:hover {
		background-color: var(--colorNeutralBackgroundSubtle-hover);

		.entry-del {
			opacity: 1;
		}
	}

	.entry-main {
		flex: 1;
		min-width: 0;

		.entry-title {
			font-size: 13px;
			font-weight: 500;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			color: var(--colorNeutralForeground1);
		}

		.entry-time {
			font-size: 11px;
			color: var(--colorNeutralForeground3);
			margin-top: 2px;
		}
	}

	.entry-del {
		opacity: 0;
		transition: opacity 0.2s;
	}
}

.history-footer {
	margin-top: 8px;
	display: flex;
	justify-content: flex-end;
}

.muted-text {
	color: var(--colorNeutralForeground3);
	font-size: 13px;
	text-align: center;
	margin-top: 32px;
}
</style>
