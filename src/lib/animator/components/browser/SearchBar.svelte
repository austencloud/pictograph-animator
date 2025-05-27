<script lang="ts">
	// Import Lucide icons
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';

	// Props
	let {
		searchQuery = '',
		selectedCategory = 'All',
		categories = [],
		onSearchChange,
		onCategoryChange,
		onRefresh,
		disabled = false
	}: {
		searchQuery: string;
		selectedCategory: string;
		categories: string[];
		onSearchChange?: (query: string) => void;
		onCategoryChange?: (category: string) => void;
		onRefresh?: () => void;
		disabled?: boolean;
	} = $props();

	// Step count filter options
	const stepFilters = [
		{ id: 'all', label: 'All Steps', min: 0, max: Infinity },
		{ id: 'quick', label: 'Quick (1-3)', min: 1, max: 3 },
		{ id: 'short', label: 'Short (4-7)', min: 4, max: 7 },
		{ id: 'medium', label: 'Medium (8-15)', min: 8, max: 15 },
		{ id: 'long', label: 'Long (16+)', min: 16, max: Infinity }
	];

	// Local state for input handling
	let searchInput = $state(searchQuery);
	let isRefreshing = $state(false);
	let isExpanded = $state(false);
	let selectedStepFilter = $state('all');

	// Sync with external searchQuery changes
	$effect(() => {
		searchInput = searchQuery;
	});

	// Debounced search handling
	let searchTimeout: ReturnType<typeof setTimeout> | undefined;

	function handleSearchInput(event: Event): void {
		const target = event.target as HTMLInputElement;
		searchInput = target.value;

		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		// Debounce search to avoid excessive filtering
		searchTimeout = setTimeout(() => {
			onSearchChange?.(searchInput);
		}, 300);
	}

	function handleCategorySelect(event: Event): void {
		const target = event.target as HTMLSelectElement;
		onCategoryChange?.(target.value);
	}

	function handleClearSearch(): void {
		searchInput = '';
		onSearchChange?.('');
	}

	function handleRefreshClick(): void {
		isRefreshing = true;
		onRefresh?.();

		// Reset refreshing state after animation
		setTimeout(() => {
			isRefreshing = false;
		}, 600);
	}

	function toggleExpanded(): void {
		isExpanded = !isExpanded;
	}

	function handleStepFilterChange(filterId: string): void {
		selectedStepFilter = filterId;
		// For now, we'll just store the filter state
		// In a real implementation, this would trigger filtering
	}
</script>

<div class="search-bar">
	<!-- Mobile: Collapsible search toggle -->
	<div class="search-toggle mobile-only">
		<button
			type="button"
			onclick={toggleExpanded}
			class="toggle-button"
			aria-label={isExpanded ? 'Collapse search' : 'Expand search'}
		>
			<Search size={16} />
			<span>Search & Filter</span>
			{#if isExpanded}
				<ChevronUp size={16} />
			{:else}
				<ChevronDown size={16} />
			{/if}
		</button>
	</div>

	<!-- Search controls - always visible on desktop, collapsible on mobile -->
	<div class="search-controls" class:expanded={isExpanded}>
		<div class="search-input-container">
			<div class="search-icon" aria-hidden="true">
				<Search size={16} />
			</div>
			<input
				type="text"
				placeholder="Search sequences by name, author, or word..."
				value={searchInput}
				oninput={handleSearchInput}
				{disabled}
				class="search-input"
				aria-label="Search sequences"
			/>
			{#if searchInput}
				<button
					type="button"
					onclick={handleClearSearch}
					{disabled}
					class="clear-button"
					aria-label="Clear search"
				>
					<X size={14} />
				</button>
			{/if}
		</div>

		<div class="filter-container">
			<label for="category-filter" class="filter-label">Filter:</label>
			<select
				id="category-filter"
				value={selectedCategory}
				onchange={handleCategorySelect}
				{disabled}
				class="category-filter"
				aria-label="Filter by category"
			>
				{#each categories as category}
					<option value={category}>{category}</option>
				{/each}
			</select>

			<button
				type="button"
				onclick={handleRefreshClick}
				{disabled}
				class="refresh-button"
				class:refreshing={isRefreshing}
				aria-label="Refresh library"
				title="Refresh library"
			>
				<RefreshCw size={16} class={isRefreshing ? 'spinning' : ''} />
			</button>
		</div>

		<!-- Step count filter chips -->
		<div class="step-filters">
			<div class="filter-chips">
				{#each stepFilters as filter (filter.id)}
					<button
						type="button"
						class="filter-chip"
						class:active={selectedStepFilter === filter.id}
						onclick={() => handleStepFilterChange(filter.id)}
						{disabled}
						aria-label={`Filter by ${filter.label}`}
					>
						{filter.label}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.search-bar {
		margin-bottom: 1rem;
		padding: 1rem;
		background: var(--color-background);
		border-radius: 6px;
		border: 1px solid var(--color-border);
		flex-shrink: 0;
		transition: all 0.3s ease;
	}

	.search-controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.search-input-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		color: var(--color-text-secondary);
		font-size: 1rem;
		pointer-events: none;
		z-index: 1;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.5rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 1rem;
		background: var(--color-surface);
		color: var(--color-text-primary);
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease,
			background-color 0.3s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-alpha);
	}

	.search-input:disabled {
		background: var(--color-surface-hover);
		color: var(--color-text-secondary);
		cursor: not-allowed;
	}

	.clear-button {
		position: absolute;
		right: 8px;
		background: none;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		font-size: 1rem;
		line-height: 1;
		transition:
			background-color 0.2s ease,
			color 0.2s ease;
	}

	.clear-button:hover:not(:disabled) {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
	}

	.clear-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.filter-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.category-filter {
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 1rem;
		background: var(--color-surface);
		color: var(--color-text-primary);
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			background-color 0.3s ease;
		flex: 1;
	}

	.category-filter:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-alpha);
	}

	.category-filter:disabled {
		background: var(--color-surface-hover);
		color: var(--color-text-secondary);
		cursor: not-allowed;
	}

	.refresh-button {
		padding: 0.5rem;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: 50%;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			box-shadow 0.2s ease;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-left: 0.5rem;
		color: var(--color-text-primary);
	}

	.refresh-button:hover:not(:disabled) {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		color: var(--color-primary);
	}

	.refresh-button:active:not(:disabled) {
		transform: scale(0.95);
	}

	.refresh-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	/* Mobile/Desktop Visibility Classes */
	.mobile-only {
		display: none;
	}

	/* Mobile search toggle */
	.search-toggle {
		margin-bottom: 0.5rem;
	}

	.search-toggle .toggle-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--color-text-primary);
		font-weight: 500;
		gap: 0.5rem;
	}

	.search-toggle .toggle-button:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
	}

	/* Collapsible search controls */
	.search-controls {
		transition: all 0.3s ease;
		overflow: hidden;
	}

	/* Step filter chips */
	.step-filters {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
	}

	.filter-chips {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		overflow-x: auto;
		padding-bottom: 0.25rem;
		scrollbar-width: none;
		-ms-overflow-style: none;
		-webkit-overflow-scrolling: touch;
	}

	.filter-chips::-webkit-scrollbar {
		display: none;
	}

	.filter-chip {
		padding: 0.5rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		transition: all 0.2s ease;
		white-space: nowrap;
		flex-shrink: 0;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.filter-chip:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
		color: var(--color-text-primary);
	}

	.filter-chip.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.filter-chip:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	/* Spinning animation for refresh icon */
	:global(.spinning) {
		animation: spin 0.6s linear;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive adjustments */
	@media (max-width: 1024px) {
		.search-controls {
			flex-direction: row;
			align-items: center;
			gap: 0.75rem;
		}

		.search-input-container {
			flex: 1;
		}

		.filter-container {
			flex-shrink: 0;
			min-width: 120px;
		}

		.refresh-button {
			flex-shrink: 0;
		}
	}

	@media (max-width: 768px) {
		/* Mobile/Desktop Visibility */
		.mobile-only {
			display: block;
		}

		/* Collapsible search on mobile */
		.search-controls {
			max-height: 0;
			opacity: 0;
			margin-bottom: 0;
			padding: 0;
			flex-direction: column;
			gap: 0.5rem;
			transition: all 0.3s ease;
		}

		.search-controls.expanded {
			max-height: 200px;
			opacity: 1;
			margin-bottom: 0.75rem;
			padding: 0.75rem;
			background: var(--color-surface);
			border: 1px solid var(--color-border);
			border-radius: 8px;
		}

		.search-bar {
			padding: 0.5rem;
			margin-bottom: 0.5rem;
		}

		.search-input {
			font-size: 16px; /* Prevent zoom on iOS */
		}

		.filter-container {
			gap: 0.25rem;
		}

		.filter-label {
			font-size: 0.8rem;
		}

		.category-filter {
			font-size: 0.9rem;
		}

		.refresh-button {
			width: 36px;
			height: 36px;
		}

		/* Mobile filter chips - horizontal scroll */
		.filter-chips {
			flex-wrap: nowrap;
			overflow-x: auto;
			padding-right: 1rem;
			margin-right: -1rem;
			scroll-behavior: smooth;
			-webkit-overflow-scrolling: touch;
		}

		.filter-chip {
			font-size: 0.8rem;
			padding: 0.4rem 0.8rem;
			min-height: 40px;
		}
	}
</style>
