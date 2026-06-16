<template>
	<button
		type="button"
		:class="classes"
		:disabled="disabled"
		:aria-label="computedAriaLabel"
		:aria-checked="modelValue"
		:title="title || computedAriaLabel"
		role="switch"
		@click="toggle">
		<span class="switch-track" aria-hidden="true">
			<span class="switch-thumb"></span>
		</span>
	</button>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	title: {
		type: String,
		default: '',
	},
	ariaLabel: {
		type: String,
		default: '',
	},
});

const emit = defineEmits(['update:modelValue', 'change']);

const classes = computed(() => [
	'f-switch',
	{
		checked: props.modelValue,
		disabled: props.disabled,
	},
]);

const computedAriaLabel = computed(() => props.ariaLabel || t('common.switch'));

const toggle = () => {
	if (props.disabled) return;
	const nextValue = !props.modelValue;
	emit('update:modelValue', nextValue);
	emit('change', nextValue);
};
</script>

<style scoped lang="scss">
.f-switch {
	appearance: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 38px;
	height: 22px;
	padding: 0;
	border: 0;
	border-radius: 999px;
	background-color: transparent;
	color: var(--f-text-primary);
	cursor: pointer;
	user-select: none;

	&:focus-visible {
		outline: none;

		.switch-track {
			border-color: var(--f-color-info);
			box-shadow: 0 0 0 2px
				color-mix(in srgb, var(--f-color-info) 28%, transparent);
		}
	}

	&:hover:not(:disabled):not(.checked) {
		.switch-track {
			border-color: var(--f-text-secondary);
			background-color: var(--f-bg-control-hover);
		}
	}

	&:active:not(:disabled):not(.checked) {
		.switch-track {
			background-color: var(--f-bg-control-active);
		}
	}

	&.checked {
		.switch-track {
			border-color: var(--f-color-info);
			background-color: var(--f-color-info);
			opacity: 1;
		}

		.switch-thumb {
			transform: translate(16px, -50%);
			background-color: #fff;
		}

		&:hover:not(:disabled) {
			.switch-track {
				opacity: 0.9;
			}
		}

		&:active:not(:disabled) {
			.switch-track {
				opacity: 0.82;
			}
		}
	}

	&:disabled,
	&.disabled {
		cursor: not-allowed;

		.switch-track {
			background-color: var(--f-bg-control-disabled);
			border-color: transparent;
		}

		.switch-thumb {
			background-color: var(--f-text-disabled);
			box-shadow: none;
		}
	}
}

.switch-track {
	position: relative;
	width: 34px;
	height: 18px;
	border: 1px solid var(--f-border-default);
	border-radius: 999px;
	background-color: var(--f-bg-control-active);
	transition:
		background-color var(--f-transition-fast),
		border-color var(--f-transition-fast),
		box-shadow var(--f-transition-fast),
		opacity var(--f-transition-fast);
}

.switch-thumb {
	position: absolute;
	top: 50%;
	left: 3px;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background-color: #5f5f5f;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
	transform: translateY(-50%);
	transition:
		transform var(--f-transition-normal),
		background-color var(--f-transition-fast),
		box-shadow var(--f-transition-fast);
}
</style>
