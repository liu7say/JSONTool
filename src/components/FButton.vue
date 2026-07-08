<template>
	<button :class="classes" :disabled="disabled" @click="handleClick">
		<slot />
	</button>
</template>

<script setup>
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
	// 按钮前景色颜色变体，默认为 'brand'（品牌蓝），支持 'neutral'（中性色，如黑/白）
	color: {
		type: String,
		default: 'brand',
		validator: (val) => ['brand', 'neutral'].includes(val),
	},
	// 如果传入 to 或 href，可以扩展为链接（暂不实现，简单起见）
});

const emit = defineEmits(['click']);

const classes = computed(() => {
	const list = ['f-button'];
	if (props.type !== 'default') list.push(props.type);
	if (props.size !== 'medium') list.push(props.size);
	if (props.iconOnly) list.push('icon-only');
	if (props.disabled) list.push('disabled');
	// 仅当颜色显式设为 'neutral' 时才推入类名，默认的 'brand' 不推入，以避开全局 logo 处的 .brand 样式命名冲突
	if (props.color === 'neutral') list.push('neutral');
	return list;
});

const handleClick = (e) => {
	if (props.disabled) return;
	emit('click', e);
};
</script>

<style scoped lang="scss">
/* 样式已在全局 components.scss 中定义，此处无需重复 */
</style>
