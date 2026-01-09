import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), crx({ manifest })],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: {
		port: 5173,
		strictPort: true,
		hmr: {
			port: 5173,
		},
		cors: true,
	},
	build: {
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) {
						if (
							id.includes('vue') ||
							id.includes('pinia') ||
							id.includes('vue-router') ||
							id.includes('@vueuse')
						) {
							return 'vendor-vue';
						}
						if (id.includes('codemirror') || id.includes('@codemirror')) {
							return 'vendor-codemirror';
						}
						if (
							id.includes('jsondiffpatch') ||
							id.includes('diff') ||
							id.includes('lz-string')
						) {
							return 'vendor-utils';
						}
						return 'vendor';
					}
				},
			},
		},
	},
});
