<script setup>
import logoIcon from '@/assets/icon24.svg';
defineProps({
	collapsed: {
		type: Boolean,
		default: false,
	},
});
</script>

<template>
	<div class="app-logo">
		<img :src="logoIcon" alt="Logo" />
		<Transition name="fade">
			<span class="logo-text" v-show="!collapsed">JSON Tool</span>
		</Transition>
		<!-- <svg
			:width="collapsed ? 24 : 24"
			height="24"
			:viewBox="collapsed ? '0 0 24 24' : '0 0 24 24'"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<path
				d="M6.5 4C6.5 2.89543 7.39543 2 8.5 2H10C11.1046 2 12 2.89543 12 4V9C12 10.1046 11.1046 11 10 11H8C6.89543 11 6 11.8954 6 13V20C6 21.1046 6.89543 22 8 22H10C11.1046 22 12 21.1046 12 20"
				stroke="var(--f-brand-base)"
				stroke-width="2.5"
				stroke-linecap="round" />
			<path
				d="M17.5 4C17.5 2.89543 16.6046 2 15.5 2H14C12.8954 2 12 2.89543 12 4V9C12 10.1046 12.8954 11 14 11H16C17.1046 11 18 11.8954 18 13V20C18 21.1046 17.1046 22 16 22H14C12.8954 22 12 21.1046 12 20"
				stroke="var(--f-brand-base)"
				stroke-width="2.5"
				stroke-linecap="round"
				transform="rotate(180 15 12)" />
		</svg> -->
	</div>
</template>

<style scoped>
.app-logo {
	display: flex;
	align-items: center;
	/* 确保 SVG 颜色随主题变量更新 */
	gap: 8px;
	.logo-text {
		line-height: 24px;
		font-size: 16px;
		font-weight: 500;
		color: var(--f-text-primary);
		white-space: nowrap;
		user-select: none;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: translateX(-10px);
}
</style>
