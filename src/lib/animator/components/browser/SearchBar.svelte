<script lang="ts">
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

	// Local state for input handling
	let searchInput = $state(searchQuery);
	let isRefreshing = $state(false);

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
</script>

<div class="search-bar">
	<div class="search-controls">
		<div class="search-input-container">
			<div class="search-icon" aria-hidden="true">🔍</div>
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
					✕
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
				<span class="refresh-icon">⟳</span>
			</button>
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
	}

	.refresh-button:hover:not(:disabled) {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.refresh-button:active:not(:disabled) {
		transform: scale(0.95);
	}

	.refresh-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.refresh-icon {
		display: inline-block;
		transition: transform 0.6s ease;
		font-size: 1.1rem;
	}

	.refresh-button.refreshing .refresh-icon {
		transform: rotate(360deg);
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
		.search-bar {
			padding: 0.75rem;
		}

		.search-controls {
			flex-direction: column;
			gap: 0.5rem;
		}

		.search-input {
			font-size: 16px; /* Prevent zoom on iOS */
		}
	}
</style>
