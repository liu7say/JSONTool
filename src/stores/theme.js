import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

/**
 * 主题状态管理
 * 负责切换亮色/暗色模式，并持久化到 localStorage
 */
export const useThemeStore = defineStore('theme', () => {
	// 默认暗色，读取 localStorage
	const isDark = ref(localStorage.getItem('theme') !== 'light');

	const toggle = () => {
		isDark.value = !isDark.value;
	};

	// 监听变化，同步到 DOM 和 Storage
	watch(
		isDark,
		(val) => {
			const html = document.documentElement;
			if (val) {
				html.classList.remove('light');
				html.classList.add('dark');
				localStorage.setItem('theme', 'dark');
			} else {
				html.classList.remove('dark');
				html.classList.add('light');
				localStorage.setItem('theme', 'light');
			}
		},
		{ immediate: true }
	);

	return { isDark, toggle };
});
