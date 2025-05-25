<script lang="ts">
	import type { DictionaryItem, SequenceData } from '../../types/core.js';
	import { DictionaryService } from '../../core/services/dictionary-service.js';
	import ThumbnailCard from './ThumbnailCard.svelte';
	import SearchBar from './SearchBar.svelte';

	// Props
	let {
		onSequenceSelected
	}: {
		onSequenceSelected?: (data: SequenceData, item: DictionaryItem) => void;
	} = $props();

	// State
	let items = $state<DictionaryItem[]>([]);
	let filteredItems = $state<DictionaryItem[]>([]);
	let categories = $state<string[]>([]);
	let isLoading = $state(true);
	let error = $state('');
	let searchQuery = $state('');
	let selectedCategory = $state('All');

	// Services
	const dictionaryService = DictionaryService.getInstance();

	// Load dictionary on mount
	$effect(() => {
		loadDictionary();
	});

	// Filter items when search or category changes
	$effect(() => {
		filterItems();
	});

	async function loadDictionary(): Promise<void> {
		try {
			isLoading = true;
			error = '';

			const index = await dictionaryService.getIndex();
			items = sortByStepCount(index.items);
			categories = ['All', ...index.categories];
			filteredItems = items;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dictionary';
			console.error('Failed to load dictionary:', err);
		} finally {
			isLoading = false;
		}
	}

	async function filterItems(): Promise<void> {
		try {
			const results = await dictionaryService.searchItems(
				searchQuery,
				selectedCategory === 'All' ? undefined : selectedCategory
			);
			// Sort by step count (shortest to longest) as default
			filteredItems = sortByStepCount(results);
		} catch (err) {
			console.error('Failed to filter items:', err);
			filteredItems = sortByStepCount(items);
		}
	}

	function sortByStepCount(itemsToSort: DictionaryItem[]): DictionaryItem[] {
		return [...itemsToSort].sort((a, b) => {
			const stepsA = a.sequenceData.length - 2; // Subtract metadata and start position
			const stepsB = b.sequenceData.length - 2;

			// Primary sort: by step count (ascending)
			if (stepsA !== stepsB) {
				return stepsA - stepsB;
			}

			// Secondary sort: by name (alphabetical)
			return a.name.localeCompare(b.name);
		});
	}

	function handleSearchChange(query: string): void {
		searchQuery = query;
	}

	function handleCategoryChange(category: string): void {
		selectedCategory = category;
	}

	function handleItemSelect(item: DictionaryItem): void {
		onSequenceSelected?.(item.sequenceData, item);
	}

	function handleRefresh(): void {
		loadDictionary();
	}
</script>

<div class="thumbnail-browser">
	<SearchBar
		{searchQuery}
		{selectedCategory}
		{categories}
		onSearchChange={handleSearchChange}
		onCategoryChange={handleCategoryChange}
		onRefresh={handleRefresh}
		disabled={isLoading}
	/>

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner" aria-hidden="true"></div>
			<p>Loading sequence library...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<div class="error-icon" aria-hidden="true">⚠️</div>
			<h3>Failed to Load Library</h3>
			<p>{error}</p>
			<button type="button" onclick={handleRefresh} class="retry-button"> Try Again </button>
		</div>
	{:else if filteredItems.length === 0}
		<div class="empty-state">
			<div class="empty-icon" aria-hidden="true">🔍</div>
			<h3>No Sequences Found</h3>
			<p>
				{searchQuery || selectedCategory !== 'All'
					? 'Try adjusting your search or filter criteria.'
					: 'The sequence library appears to be empty.'}
			</p>
		</div>
	{:else}
		<div class="results-info">
			<span class="results-count">
				{filteredItems.length} sequence{filteredItems.length !== 1 ? 's' : ''}
				{searchQuery || selectedCategory !== 'All' ? 'found' : 'available'}
			</span>
		</div>

		<div class="thumbnail-grid" role="grid" aria-label="Sequence thumbnails">
			{#each filteredItems as item (item.id)}
				<ThumbnailCard {item} onSelect={() => handleItemSelect(item)} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.thumbnail-browser {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1.5rem;
		text-align: center;
		min-height: 200px;
		flex: 1;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--color-border, #e0e0e0);
		border-top: 4px solid var(--color-primary, #2196f3);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-icon,
	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.error-state h3,
	.empty-state h3 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
		color: var(--color-text-primary, #333);
	}

	.error-state p,
	.empty-state p {
		margin: 0 0 1.5rem;
		color: var(--color-text-secondary, #666);
		max-width: 400px;
	}

	.retry-button {
		padding: 0.75rem 1.5rem;
		background: var(--color-primary, #2196f3);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.retry-button:hover {
		background: var(--color-primary-dark, #1976d2);
	}

	.results-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding: 0 0.5rem;
	}

	.results-count {
		color: var(--color-text-secondary, #666);
		font-size: 0.9rem;
	}

	.thumbnail-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-auto-rows: min-content;
		gap: 0.75rem;
		padding: 0.75rem;
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		min-height: 0;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border, #e0e0e0) transparent;
		align-items: start;
		grid-auto-flow: row;
	}

	.thumbnail-grid::-webkit-scrollbar {
		width: 8px;
	}

	.thumbnail-grid::-webkit-scrollbar-track {
		background: transparent;
	}

	.thumbnail-grid::-webkit-scrollbar-thumb {
		background: var(--color-border, #e0e0e0);
		border-radius: 4px;
	}

	.thumbnail-grid::-webkit-scrollbar-thumb:hover {
		background: var(--color-text-secondary, #666);
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.thumbnail-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 0.75rem;
		}
	}

	@media (max-width: 768px) {
		.loading-state,
		.error-state,
		.empty-state {
			padding: 2rem 1rem;
			min-height: 150px;
		}

		.thumbnail-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.5rem;
			padding: 0.5rem;
		}

		.results-info {
			margin-bottom: 1rem;
			padding: 0 0.5rem;
		}

		.results-count {
			font-size: 0.85rem;
		}
	}

	@media (max-width: 480px) {
		.thumbnail-grid {
			grid-template-columns: 1fr; /* Single column on very small screens */
			gap: 0.75rem;
			padding: 0.75rem;
		}

		.loading-state,
		.error-state,
		.empty-state {
			padding: 1.5rem 1rem;
		}
	}
</style>
