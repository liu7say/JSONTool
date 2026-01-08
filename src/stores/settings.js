import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

/**
 * Settings Store
 * Persists user configuration to chrome.storage.sync (with localStorage fallback)
 */
export const useSettingsStore = defineStore('settings', () => {
	// --- State ---
	const sortStructureAtEnd = ref(false);

	// --- Helper: Universal Storage Access ---
	const storage = {
		get: (defaults) =>
			new Promise((resolve) => {
				// Chrome Extension Environment
				if (
					typeof chrome !== 'undefined' &&
					chrome.storage &&
					chrome.storage.sync
				) {
					chrome.storage.sync.get(defaults, (items) => {
						// chrome.storage.sync returns the complete object with defaults if not found?
						// actually get(defaults) returns found items merged with defaults.
						resolve(items);
					});
				} else {
					// Web Environment (Dev)
					const result = { ...defaults };
					Object.keys(defaults).forEach((key) => {
						const val = localStorage.getItem('settings.' + key);
						if (val !== null) {
							try {
								result[key] = JSON.parse(val);
							} catch (e) {
								console.warn('Failed to parse setting:', key, val);
							}
						}
					});
					resolve(result);
				}
			}),
		set: (items) =>
			new Promise((resolve) => {
				if (
					typeof chrome !== 'undefined' &&
					chrome.storage &&
					chrome.storage.sync
				) {
					chrome.storage.sync.set(items, () => resolve());
				} else {
					Object.entries(items).forEach(([key, val]) => {
						localStorage.setItem('settings.' + key, JSON.stringify(val));
					});
					resolve();
				}
			}),
	};

	// --- Actions ---
	const loadSettings = async () => {
		const defaults = {
			sortStructureAtEnd: false,
		};
		const data = await storage.get(defaults);

		sortStructureAtEnd.value = !!data.sortStructureAtEnd;
	};

	// --- Watchers ---
	watch(sortStructureAtEnd, (newVal) => {
		storage.set({ sortStructureAtEnd: newVal });
	});

	return {
		sortStructureAtEnd,
		loadSettings,
	};
});
