<script setup>
/**
 * FButton - 通用按钮组件（遵循 Fluent 2 设计规范）
 * 支持多种样式类型和尺寸，以及仅图标模式和禁用状态
 */
import { computed } from 'vue';

const props = defineProps({
	type: {
		type: String,
		default: 'default', // 'default' | 'primary' | 'subtle' | 'danger'
		validator: (val) =>
			['default', 'primary', 'subtle', 'danger'].includes(val),
	},
	size: {
		type: String,
		default: 'medium', // 'medium' | 'small'
		validator: (val) => ['medium', 'small'].includes(val),
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	iconOnly: {
		type: Boolean,
		default: false,
	},
	// 如果传入 to 或 href，可以扩展为链接（暂不实现，简单起见）
});

const emit = defineEmits(['click']);

/**
 * 根据 props 动态计算按钮的 CSS 类名列表
 * @returns {string[]} CSS 类名数组
 */
const classes = computed(() => {
	const list = ['f-button'];
	if (props.type !== 'default') list.push(props.type);
	if (props.size !== 'medium') list.push(props.size);
	if (props.iconOnly) list.push('icon-only');
	if (props.disabled) list.push('disabled');
	return list;
});

/**
 * 处理按钮点击事件，禁用状态下阻止事件传播
 * @param {MouseEvent} e - 原生点击事件
 */
const handleClick = (e) => {
	if (props.disabled) return;
	emit('click', e);
};
</script>

<template>
	<button :class="classes" :disabled="disabled" @click="handleClick">
		<slot />
	</button>
</template>

<style scoped lang="scss">
/* 样式已在全局 components.scss 中定义，此处无需重复 */
</style>
