<template>
	<!-- 使用 Teleport 挂载到 body，彻底消除祖先层叠上下文与 overflow 裁剪 -->
	<Teleport to="body">
		<Transition name="f-modal-fade">
			<div
				v-if="visible"
				class="f-modal-overlay"
				@click="handleOverlayClick">
				<div
					class="f-modal-dialog f-acrylic"
					:style="{ width }"
					@click.stop
					role="dialog"
					aria-modal="true"
					:aria-label="title">
					<!-- 弹窗标题栏 -->
					<div class="f-modal-header">
						<div class="f-modal-title">
							<slot name="title">
								<span>{{ title }}</span>
							</slot>
						</div>
						<button
							v-if="showClose"
							type="button"
							class="f-modal-close-btn"
							@click="close"
							:aria-label="t('common.close') || '关闭'"
							title="关闭">
							<component :is="CloseIcon" style="width: 16px; height: 16px" />
						</button>
					</div>

					<!-- 弹窗主体内容区 -->
					<div class="f-modal-body">
						<slot />
					</div>

					<!-- 弹窗底部操作区 (可选) -->
					<div v-if="$slots.footer" class="f-modal-footer">
						<slot name="footer" />
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconX as CloseIcon } from '@tabler/icons-vue';

const props = defineProps({
	// 控制弹窗显示/隐藏
	visible: {
		type: Boolean,
		default: false,
	},
	// 弹窗标题
	title: {
		type: String,
		default: '',
	},
	// 弹窗宽度
	width: {
		type: String,
		default: '520px',
	},
	// 是否显示右上角关闭按钮
	showClose: {
		type: Boolean,
		default: true,
	},
	// 是否允许点击遮罩关闭
	closeOnClickModal: {
		type: Boolean,
		default: true,
	},
	// 是否允许按 ESC 关闭
	closeOnPressEscape: {
		type: Boolean,
		default: true,
	},
});

const emit = defineEmits(['update:visible', 'close']);
const { t } = useI18n();

const close = () => {
	emit('update:visible', false);
	emit('close');
};

const handleOverlayClick = () => {
	if (props.closeOnClickModal) {
		close();
	}
};

const handleKeyDown = (e) => {
	if (props.visible && props.closeOnPressEscape && e.key === 'Escape') {
		e.stopPropagation();
		close();
	}
};

watch(
	() => props.visible,
	(val) => {
		if (val) {
			window.addEventListener('keydown', handleKeyDown);
		} else {
			window.removeEventListener('keydown', handleKeyDown);
		}
	},
);

onMounted(() => {
	if (props.visible) {
		window.addEventListener('keydown', handleKeyDown);
	}
});

onBeforeUnmount(() => {
	window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped lang="scss">
/* 遮罩背景 */
.f-modal-overlay {
	position: fixed;
	inset: 0;
	z-index: 2000;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(0, 0, 0, 0.45);
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
}

/* 居中弹窗主体卡片 (Fluent 2 亚克力半透明材质) */
.f-modal-dialog {
	max-width: calc(100vw - 32px);
	max-height: calc(100vh - 64px);
	display: flex;
	flex-direction: column;
	border-radius: var(--borderRadiusXXLarge);
	border: 1px solid var(--colorNeutralStroke1);
	background-color: var(--colorNeutralBackground2);
	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.32);
	overflow: hidden;
}

/* 标题栏 */
.f-modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border-bottom: 1px solid var(--colorNeutralStroke2);
	flex-shrink: 0;
}

.f-modal-title {
	font-size: 16px;
	font-weight: var(--fontWeightSemibold);
	color: var(--colorNeutralForeground1);
	line-height: 1.4;
}

/* 关闭按钮 */
.f-modal-close-btn {
	appearance: none;
	border: none;
	background: transparent;
	color: var(--colorNeutralForeground3);
	cursor: pointer;
	padding: 4px;
	border-radius: var(--borderRadiusMedium);
	display: flex;
	align-items: center;
	justify-content: center;
	transition:
		background-color var(--f-transition-fast),
		color var(--f-transition-fast);

	&:hover {
		background-color: var(--colorNeutralBackgroundSubtleHover);
		color: var(--colorNeutralForeground1);
	}

	&:active {
		background-color: var(--colorNeutralBackgroundSubtlePressed);
	}
}

/* 内容主体 */
.f-modal-body {
	padding: 20px;
	overflow-y: auto;
	flex: 1;
	min-height: 0;
}

/* 底部操作区 */
.f-modal-footer {
	padding: 12px 20px;
	border-top: 1px solid var(--colorNeutralStroke2);
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	flex-shrink: 0;
}

/* Fluent 2 平滑缩放与淡入淡出动画 */
.f-modal-fade-enter-active,
.f-modal-fade-leave-active {
	transition: opacity 200ms cubic-bezier(0.16, 1, 0.3, 1);

	.f-modal-dialog {
		transition:
			transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
			opacity 200ms cubic-bezier(0.16, 1, 0.3, 1);
	}
}

.f-modal-fade-enter-from,
.f-modal-fade-leave-to {
	opacity: 0;

	.f-modal-dialog {
		transform: scale(0.95);
		opacity: 0;
	}
}
</style>
