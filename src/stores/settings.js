import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

/**
 * Settings Store
 * Persists user configuration to chrome.storage.sync (with localStorage fallback)
 */
export const useSettingsStore = defineStore('settings', () => {
	// --- State ---
	const sortStructureAtEnd = ref(false);
	const indent = ref(2);

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
			indent: 2,
		};
		const data = await storage.get(defaults);

		sortStructureAtEnd.value = !!data.sortStructureAtEnd;
		indent.value = data.indent;
	};

	// --- Watchers ---
	watch(sortStructureAtEnd, (newVal) => {
		storage.set({ sortStructureAtEnd: newVal });
	});
	watch(indent, (newVal) => {
		storage.set({ indent: newVal });
	});

	return {
		sortStructureAtEnd,
		indent,
		loadSettings,
	};
});
