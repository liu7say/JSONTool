<script setup>
import { computed } from 'vue';

const props = defineProps({
	type: {
		type: String,
		default: 'default', // 'default' | 'primary' | 'subtle'
		validator: (val) => ['default', 'primary', 'subtle'].includes(val),
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

const classes = computed(() => {
	const list = ['f-button'];
	if (props.type !== 'default') list.push(props.type);
	if (props.size !== 'medium') list.push(props.size);
	if (props.iconOnly) list.push('icon-only');
	if (props.disabled) list.push('disabled');
	return list;
});

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
