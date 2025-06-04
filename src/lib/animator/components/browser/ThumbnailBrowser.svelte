<script lang="ts">
	import type { DictionaryItem, SequenceData } from '../../types/core.js';
	import { DictionaryService } from '../../core/services/dictionary-service.js';
	import SearchBar from './SearchBar.svelte';
	import BrowserStates from './BrowserStates.svelte';
	import ResultsInfo from './ResultsInfo.svelte';
	import VirtualThumbnailGrid from './VirtualThumbnailGrid.svelte';
	import JSONImportModal from './JSONImportModal.svelte';

	// Props
	let {
		onSequenceSelected
	}: {
		onSequenceSelected?: (_data: SequenceData, _item: DictionaryItem) => void;
	} = $props();

	// State
	let items = $state<DictionaryItem[]>([]);
	let filteredItems = $state<DictionaryItem[]>([]);
	let categories = $state<string[]>([]);
	let isLoading = $state(true);
	let error = $state('');
	let searchQuery = $state('');
	let selectedCategory = $state('All');
	let isJSONModalOpen = $state(false);

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

	function handleScroll(_event: Event): void {
		// Scroll handling is now managed by VirtualThumbnailGrid component
	}

	function handleJSONImport(): void {
		isJSONModalOpen = true;
	}

	function handleJSONModalClose(): void {
		isJSONModalOpen = false;
	}

	function handleJSONSequenceImport(data: SequenceData): void {
		// Create a temporary DictionaryItem for the imported sequence
		const tempItem: DictionaryItem = {
			id: `imported-${Date.now()}`,
			name: data[0]?.word || 'Imported Sequence',
			filePath: '',
			metadata: data[0] || {},
			sequenceData: data,
			versions: []
		};

		// Call the sequence selected handler
		onSequenceSelected?.(data, tempItem);
		isJSONModalOpen = false;
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
		onJSONImport={handleJSONImport}
		disabled={isLoading}
	/>

	<BrowserStates
		{isLoading}
		{error}
		isEmpty={filteredItems.length === 0}
		{searchQuery}
		{selectedCategory}
		onRetry={handleRefresh}
	/>

	{#if !isLoading && !error && filteredItems.length > 0}
		<ResultsInfo itemCount={filteredItems.length} {searchQuery} {selectedCategory} />

		<VirtualThumbnailGrid
			items={filteredItems}
			onItemSelect={handleItemSelect}
			onScroll={handleScroll}
		/>
	{/if}
</div>

<!-- JSON Import Modal -->
<JSONImportModal
	isOpen={isJSONModalOpen}
	onClose={handleJSONModalClose}
	onImport={handleJSONSequenceImport}
/>

<style>
	.thumbnail-browser {
		height: 100%;
		display: flex;
		flex-direction: column;
	}
</style>
