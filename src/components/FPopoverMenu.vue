<template>
	<!-- 使用 Teleport 将弹出层提升至 body，杜绝层叠上下文与 overflow 裁剪 -->
	<Teleport to="body">
		<Transition name="fade-scale">
			<div
				v-if="visible"
				ref="menuRef"
				class="f-popover-menu f-acrylic"
				:class="customClass"
				:style="menuStyle"
				@contextmenu.prevent
				@click.stop>
				<!-- 优先使用默认插槽自定义内容（如含开关、勾选框的复杂面板） -->
				<slot>
					<!-- 若未提供插槽，则按 items 结构化数据渲染通用菜单项 -->
					<template v-for="(item, idx) in items" :key="item.id || idx">
						<!-- 分隔线 -->
						<div v-if="item.divider" class="f-popover-divider" />

						<!-- 菜单项 -->
						<div
							v-else
							class="menu-item"
							:class="{
								disabled: item.disabled,
								danger: item.danger,
							}"
							@click="handleItemClick(item)">
							<!-- 图标 -->
							<span v-if="item.icon" class="item-icon">
								<component :is="item.icon" />
							</span>
							<!-- 文本 -->
							<span class="item-label">{{ item.label }}</span>
						</div>
					</template>
				</slot>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';

const props = defineProps({
	// 控制显示/隐藏
	visible: {
		type: Boolean,
		default: false,
	},
	// 模式 1：基于锚点元素定位（适用于工具栏下拉按钮）
	anchor: {
		type: [Object, null],
		default: null,
	},
	// 锚点对齐方式：'bottom-start' | 'bottom-end'
	placement: {
		type: String,
		default: 'bottom-start',
	},
	// 模式 2：基于光标坐标定位（适用于鼠标右键菜单）
	position: {
		type: [Object, null],
		default: null,
	},
	// 结构化菜单项数据（可选）
	items: {
		type: Array,
		default: () => [],
	},
	// 自定义类名
	customClass: {
		type: String,
		default: '',
	},
});

const emit = defineEmits(['update:visible', 'select']);

const menuRef = ref(null);
// 经过视口安全计算后的实际定位坐标
const coords = ref({ top: 0, left: 0 });

// 计算应用到容器上的定位样式
const menuStyle = computed(() => ({
	top: `${coords.value.top}px`,
	left: `${coords.value.left}px`,
}));

/**
 * 获取锚点元素的真实 DOM 节点
 */
const getAnchorEl = () => {
	if (!props.anchor) return null;
	return props.anchor.$el || props.anchor;
};

/**
 * 核心定位算法：支持双模（锚点 / 光标坐标）与视口防碰撞自适应翻折
 */
const updatePosition = () => {
	const margin = 8;
	const viewportW = window.innerWidth;
	const viewportH = window.innerHeight;

	// 获取菜单当前渲染尺寸，默认保底估算
	const menuW = menuRef.value?.offsetWidth || 140;
	const menuH = menuRef.value?.offsetHeight || 120;

	// 1. 锚点模式计算 (下拉菜单)
	const anchorEl = getAnchorEl();
	if (anchorEl && typeof anchorEl.getBoundingClientRect === 'function') {
		const rect = anchorEl.getBoundingClientRect();
		let top = rect.bottom + 4; // 默认位于锚点正下方 4px
		let left =
			props.placement === 'bottom-end'
				? rect.right - menuW
				: rect.left;

		// 垂直防溢出：若下方空间不足，则向上翻转至锚点上方
		if (top + menuH > viewportH - margin) {
			top = Math.max(margin, rect.top - menuH - 4);
		}

		// 水平防溢出：保证不超出屏幕左右边界
		if (left + menuW > viewportW - margin) {
			left = Math.max(margin, viewportW - menuW - margin);
		}
		if (left < margin) {
			left = margin;
		}

		coords.value = { top, left };
		return;
	}

	// 2. 坐标模式计算 (右键菜单)
	if (props.position) {
		let left = props.position.x;
		let top = props.position.y;

		// 水平防溢出：靠近右边界时反向向左展开
		if (left + menuW > viewportW - margin) {
			left = Math.max(margin, left - menuW);
		}

		// 垂直防溢出：靠近底边界时反向向上展开
		if (top + menuH > viewportH - margin) {
			top = Math.max(margin, top - menuH);
		}

		coords.value = { top, left };
	}
};

/**
 * 全局点击拦截（排除自身及触发锚点，实现点击外部关闭）
 */
const handlePointerDown = (e) => {
	if (!props.visible) return;

	// 点击发生在菜单内部，不关闭
	if (menuRef.value && menuRef.value.contains(e.target)) {
		return;
	}

	// 若存在锚点元素，且点击发生在锚点元素内，交由锚点自身的 click 事件处理
	const anchorEl = getAnchorEl();
	if (anchorEl && anchorEl.contains(e.target)) {
		return;
	}

	emit('update:visible', false);
};

/**
 * 监听全局按键 (Escape)
 */
const handleKeyDown = (e) => {
	if (e.key === 'Escape' && props.visible) {
		emit('update:visible', false);
	}
};

/**
 * 菜单项点击触发
 */
const handleItemClick = (item) => {
	if (item.disabled) return;
	if (typeof item.action === 'function') {
		item.action();
	}
	emit('select', item);
	emit('update:visible', false);
};

// 监听可见性状态，处理定位与事件挂载
watch(
	() => props.visible,
	async (val) => {
		if (val) {
			// 先进行一次预计算，避免闪现
			updatePosition();
			await nextTick();
			// DOM 挂载后根据真实高度做二次精确纠偏
			updatePosition();

			window.addEventListener('pointerdown', handlePointerDown, true);
			window.addEventListener('keydown', handleKeyDown, true);
			window.addEventListener('resize', updatePosition, { passive: true });
			window.addEventListener('wheel', handlePointerDown, { passive: true });
		} else {
			window.removeEventListener('pointerdown', handlePointerDown, true);
			window.removeEventListener('keydown', handleKeyDown, true);
			window.removeEventListener('resize', updatePosition);
			window.removeEventListener('wheel', handlePointerDown);
		}
	},
);

onBeforeUnmount(() => {
	window.removeEventListener('pointerdown', handlePointerDown, true);
	window.removeEventListener('keydown', handleKeyDown, true);
	window.removeEventListener('resize', updatePosition);
	window.removeEventListener('wheel', handlePointerDown);
});
</script>

<style scoped lang="scss">
/* 统一 Fluent 2 亚克力浮层面板 */
.f-popover-menu {
	position: fixed;
	z-index: 10000;
	min-width: 140px;
	padding: 6px;
	background-color: var(--colorNeutralBackground3);
	border: 1px solid var(--colorNeutralStroke1);
	border-radius: var(--f-border-radius-medium, 8px);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.18), 0 0 2px rgba(0, 0, 0, 0.12);
	display: flex;
	flex-direction: column;
	outline: none;
	user-select: none;

	/* 亚克力模糊材质 */
	@supports (backdrop-filter: blur(20px)) or (-webkit-backdrop-filter: blur(20px)) {
		background-color: var(--f-popover-acrylic-bg, var(--colorNeutralBackground3)) !important;
		backdrop-filter: blur(20px) saturate(125%) !important;
		-webkit-backdrop-filter: blur(20px) saturate(125%) !important;
		border-color: var(--colorNeutralStroke2) !important;
	}

	/* 分隔线 */
	.f-popover-divider {
		height: 1px;
		margin: 4px 6px;
		background: var(--colorNeutralStroke2);
	}

	/* 菜单项通用样式 */
	:deep(.menu-item) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 10px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
		color: var(--colorNeutralForeground1);
		gap: 12px;
		user-select: none;
		transition: background-color var(--f-transition-fast, 100ms ease);

		&:hover:not(.disabled) {
			background-color: var(--colorNeutralBackgroundSubtleHover, var(--colorSubtleBackgroundHover));
		}

		&:active:not(.disabled) {
			background-color: var(--colorSubtleBackgroundPressed);
		}

		&.disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}

		&.danger:hover:not(.disabled) {
			color: var(--colorStatusErrorForeground, #d13438);
			background-color: color-mix(
				in srgb,
				var(--colorStatusErrorForeground, #d13438) 12%,
				transparent
			);
		}

		&.switch-menu-item {
			cursor: default;
			padding: 4px 6px 4px 10px;
		}

		.check-box {
			width: 16px;
			height: 16px;
			display: flex;
			align-items: center;
			justify-content: center;
			color: var(--colorBrandBackground);
		}

		.item-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 14px;
			height: 14px;
			color: inherit;

			svg {
				width: 14px;
				height: 14px;
				stroke-width: 1.6;
			}
		}

		.item-label {
			flex: 1;
			white-space: nowrap;
		}
	}
}

/* 统一 Fluent 2 动效：缩放 + 4px 垂直微位移浮动 */
.fade-scale-enter-active,
.fade-scale-leave-active {
	transition:
		opacity 0.15s cubic-bezier(0.33, 0, 0.67, 1),
		transform 0.15s cubic-bezier(0.33, 0, 0.67, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
	opacity: 0;
	transform: scale(0.95) translateY(-4px);
}
</style>
