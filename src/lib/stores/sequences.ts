/**
 * Sequences store for reactive sequence data across components
 */
import { writable, derived, get } from 'svelte/store';
import type { SequenceData } from '../types/sequence';
import type { SequenceWithThumbnail } from '../utils/metadataExtractor';
import { getAllSequences } from '../utils/metadataExtractor';

export interface SequencesState {
	items: SequenceWithThumbnail[];
	isLoading: boolean;
	isInitialized: boolean;
	error: string | null;
}

// Create the sequence store with initial values
export const sequencesStore = writable<SequencesState>({
	items: [],
	isLoading: true,
	isInitialized: false,
	error: null
});

// Store for the currently selected sequence
export const selectedSequenceStore = writable<{
	data: SequenceData | null;
	id: string | null;
}>({
	data: null,
	id: null
});

// Derived store for easy access to loaded state
export const sequencesLoaded = derived(
	sequencesStore,
	($state) => $state.isInitialized && !$state.isLoading && $state.items.length > 0
);

// Track if initialization is in progress
let initializationPromise: Promise<void> | null = null;

// Helper functions to update the store
export const sequencesActions = {
	setSequences: (sequences: SequenceWithThumbnail[]): void => {
		sequencesStore.update((state) => ({
			...state,
			items: sequences,
			isLoading: false,
			isInitialized: true
		}));
	},

	setLoading: (loading: boolean): void => {
		sequencesStore.update((state) => ({
			...state,
			isLoading: loading
		}));
	},

	setError: (error: string | null): void => {
		sequencesStore.update((state) => ({
			...state,
			error,
			isLoading: false,
			isInitialized: true
		}));
	},

	selectSequence: (data: SequenceData, id: string): void => {
		selectedSequenceStore.set({ data, id });
	},

	/**
	 * Initializes the sequence store by loading sequence data,
	 * ensures initialization only happens once even if called multiple times
	 */
	initializeStore: async (): Promise<void> => {
		// Return existing promise if initialization is already in progress
		if (initializationPromise) {
			return initializationPromise;
		}

		const store = get(sequencesStore);

		// Skip if already initialized and not in error state
		if (store.isInitialized && !store.error && !store.isLoading) {
			return Promise.resolve();
		}

		sequencesActions.setLoading(true);

		// Create and store the initialization promise
		initializationPromise = new Promise<void>((resolve) => {
			// Use timeout to ensure this runs after current execution
			setTimeout(async () => {
				try {
					// Get sequences from metadata
					const loadedSequences = getAllSequences();

					// Update store with loaded sequences
					if (loadedSequences.length > 0) {
						sequencesActions.setSequences(loadedSequences);

						// Set initial selection if needed
						const currentSelection = get(selectedSequenceStore);
						if (!currentSelection.data && loadedSequences[0]) {
							sequencesActions.selectSequence(
								loadedSequences[0].sequenceData,
								loadedSequences[0].id
							);
						}
						resolve();
					} else {
						console.warn('First attempt found no sequences, trying again in 500ms...');
						// Try one more time with a longer delay to ensure metadata is fully loaded
						setTimeout(() => {
							const retrySequences = getAllSequences();
							if (retrySequences.length > 0) {
								console.log(`Retry successful: Found ${retrySequences.length} sequences`);
								sequencesActions.setSequences(retrySequences);
								
								// Set initial selection if needed
								const currentSelection = get(selectedSequenceStore);
								if (!currentSelection.data && retrySequences[0]) {
									sequencesActions.selectSequence(
										retrySequences[0].sequenceData,
										retrySequences[0].id
									);
								}
							} else {
								console.error('Final attempt failed to find any sequences');
								sequencesActions.setError('No sequences found in metadata after retry');
							}
							resolve();
						}, 500);
					}
				} catch (error) {
					console.error('Failed to initialize sequence store:', error);
					sequencesActions.setError(error instanceof Error ? error.message : 'Unknown error');
					resolve();
				}
			}, 0);
		});

		return initializationPromise;
	}
};
