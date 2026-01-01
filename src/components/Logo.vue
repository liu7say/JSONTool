<template>
	<div class="app-logo">
		<svg
			width="124"
			height="24"
			viewBox="0 0 124 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<!-- Icon: Stylized Curly Braces -->
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

			<!-- Text: JSON -->
			<text
				x="28"
				y="18"
				fill="var(--f-text-primary)"
				font-size="16"
				font-family="'Segoe UI', sans-serif"
				font-weight="700"
				letter-spacing="-0.5">
				JSON
			</text>

			<!-- Text: Tool -->
			<text
				x="73"
				y="18"
				fill="var(--f-text-primary)"
				font-size="16"
				font-family="'Segoe UI', sans-serif"
				font-weight="400">
				Tool
			</text>
		</svg>
	</div>
</template>

<style scoped>
.app-logo {
	display: flex;
	align-items: center;
	/* Ensure SVG colors update with theme variables */
}
</style>
