<script lang="ts">
	import type { DictionaryItem } from '../../types/core.js';

	// Props
	let {
		item,
		onSelect
	}: {
		item: DictionaryItem;
		onSelect?: () => void;
	} = $props();

	// State
	let isImageLoaded = $state(false);
	let imageError = $state(false);
	let imageElement: HTMLImageElement | null = $state(null);
	let containerElement: HTMLDivElement | null = $state(null);

	// Computed properties
	const stepCount = $derived(item.sequenceData.length - 2); // Subtract metadata and start position
	const hasMultipleVersions = $derived(item.versions.length > 1);

	function handleImageLoad(event: Event): void {
		const img = event.target as HTMLImageElement;
		imageElement = img;
		isImageLoaded = true;
		imageError = false;

		// Dynamically adjust container height based on image aspect ratio
		adjustContainerHeight();
	}

	function adjustContainerHeight(): void {
		if (!imageElement || !containerElement) return;

		// Get responsive padding values
		const computedStyle = window.getComputedStyle(containerElement);
		const paddingLeft = parseFloat(computedStyle.paddingLeft);
		const paddingRight = parseFloat(computedStyle.paddingRight);
		const paddingTop = parseFloat(computedStyle.paddingTop);
		const paddingBottom = parseFloat(computedStyle.paddingBottom);

		// Get the container width (accounting for horizontal padding)
		const containerWidth = containerElement.clientWidth - paddingLeft - paddingRight;

		// Calculate the scaled height based on image aspect ratio
		const imageAspectRatio = imageElement.naturalHeight / imageElement.naturalWidth;
		const scaledHeight = containerWidth * imageAspectRatio;

		// Add vertical padding to the scaled height
		const totalHeight = scaledHeight + paddingTop + paddingBottom;

		// Set responsive minimum height
		const minHeight = window.innerWidth <= 480 ? 100 : window.innerWidth <= 768 ? 120 : 150;
		const finalHeight = Math.max(totalHeight, minHeight);

		// Apply the calculated height
		containerElement.style.height = `${finalHeight}px`;
	}

	function handleImageError(): void {
		isImageLoaded = false;
		imageError = true;
	}

	function handleCardClick(): void {
		onSelect?.();
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onSelect?.();
		}
	}

	// Format author name
	function formatAuthor(author?: string): string {
		if (!author) return 'Unknown Author';
		return author.length > 20 ? `${author.substring(0, 20)}...` : author;
	}

	// Get difficulty indicator
	function getDifficultyLevel(level?: number): string {
		if (!level) return 'Unknown';
		if (level <= 1) return 'Beginner';
		if (level <= 3) return 'Intermediate';
		return 'Advanced';
	}

	// Get step count description
	function getStepDescription(count: number): string {
		if (count <= 5) return 'Short';
		if (count <= 10) return 'Medium';
		return 'Long';
	}

	// Handle window resize to readjust container height
	$effect(() => {
		if (!containerElement) return;

		const resizeObserver = new ResizeObserver(() => {
			if (isImageLoaded && imageElement) {
				adjustContainerHeight();
			}
		});

		resizeObserver.observe(containerElement);

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div
	class="thumbnail-card"
	role="button"
	tabindex="0"
	onclick={handleCardClick}
	onkeydown={handleKeyDown}
	aria-label={`Select sequence ${item.name} by ${formatAuthor(item.metadata.author)}`}
>
	<div class="card-image-container" bind:this={containerElement}>
		{#if !imageError}
			<img
				src={item.thumbnailUrl || item.filePath}
				alt={`Thumbnail for ${item.name}`}
				class="card-image"
				class:loaded={isImageLoaded}
				onload={handleImageLoad}
				onerror={handleImageError}
			/>
		{/if}

		{#if !isImageLoaded && !imageError}
			<div class="image-placeholder">
				<div class="placeholder-spinner"></div>
			</div>
		{/if}

		{#if imageError}
			<div class="image-error">
				<div class="error-icon">🖼️</div>
				<span>Image not available</span>
			</div>
		{/if}

		{#if hasMultipleVersions}
			<div class="version-badge" title={`${item.versions.length} versions available`}>
				{item.versions.length}
			</div>
		{/if}

		<div class="card-overlay">
			<button type="button" class="play-button" aria-label="Play sequence"> ▶️ </button>
		</div>
	</div>

	<div class="card-content">
		<div class="card-header">
			<h3 class="card-title">{item.name}</h3>
			{#if item.metadata.level}
				<span class="difficulty-badge" title={`Level ${item.metadata.level}`}>
					{getDifficultyLevel(item.metadata.level)}
				</span>
			{/if}
		</div>

		<div class="card-meta">
			<div class="meta-item">
				<span class="meta-label">Author:</span>
				<span class="meta-value">{formatAuthor(item.metadata.author)}</span>
			</div>

			<div class="meta-item">
				<span class="meta-label">Steps:</span>
				<span class="meta-value">
					{stepCount} ({getStepDescription(stepCount)})
				</span>
			</div>

			{#if item.metadata.grid_mode}
				<div class="meta-item">
					<span class="meta-label">Grid:</span>
					<span class="meta-value">{item.metadata.grid_mode}</span>
				</div>
			{/if}
		</div>

		{#if item.metadata.word && item.metadata.word !== item.name}
			<div class="card-description">
				<span class="description-label">Word:</span>
				<span class="description-text">{item.metadata.word}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.thumbnail-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		height: fit-content;
	}

	.thumbnail-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border-color: var(--color-primary);
	}

	.thumbnail-card:focus {
		outline: none;
		box-shadow: 0 0 0 3px var(--color-primary-alpha);
	}

	.card-image-container {
		position: relative;
		width: 100%;
		background: var(--color-surface);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px 8px 0 0;
		padding: 12px;
		box-sizing: border-box;
		min-height: 150px; /* Minimum height for loading states */
		transition:
			height 0.3s ease,
			background-color 0.3s ease; /* Smooth height transitions */
	}

	.card-image {
		width: calc(100% - 24px); /* Account for container padding */
		height: auto;
		object-fit: contain;
		object-position: center;
		opacity: 0;
		transition: opacity 0.3s ease;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		display: block;
	}

	.card-image.loaded {
		opacity: 1;
	}

	.image-placeholder,
	.image-error {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--color-surface);
		color: var(--color-text-secondary);
	}

	.image-placeholder {
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		color: transparent;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	.placeholder-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--color-border);
		border-top: 2px solid var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.image-error span {
		font-size: 0.9rem;
	}

	.version-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		background: var(--color-primary);
		color: white;
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		min-width: 20px;
		text-align: center;
	}

	.card-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.thumbnail-card:hover .card-overlay {
		opacity: 1;
	}

	.play-button {
		background: rgba(255, 255, 255, 0.9);
		border: none;
		border-radius: 50%;
		width: 60px;
		height: 60px;
		font-size: 1.5rem;
		cursor: pointer;
		transition: transform 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.play-button:hover {
		transform: scale(1.1);
		background: white;
	}

	.card-content {
		padding: 0.75rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
		gap: 0.5rem;
	}

	.card-title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		line-height: 1.2;
		flex: 1;
	}

	.difficulty-badge {
		background: var(--color-surface);
		color: var(--color-text-secondary);
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		border: 1px solid var(--color-border);
		transition: all 0.3s ease;
	}

	.card-meta {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		margin-bottom: 0.5rem;
	}

	.meta-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.8rem;
	}

	.meta-label {
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.meta-value {
		color: var(--color-text-primary);
		text-align: right;
	}

	.card-description {
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.8rem;
		transition: border-color 0.3s ease;
	}

	.description-label {
		color: var(--color-text-secondary);
		font-weight: 500;
		margin-right: 0.5rem;
	}

	.description-text {
		color: var(--color-text-primary);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.card-image-container {
			padding: 16px;
			min-height: 120px;
		}

		.card-image {
			width: calc(100% - 32px); /* Account for larger padding */
		}

		.card-content {
			padding: 1rem;
		}

		.card-title {
			font-size: 1.2rem;
		}

		.meta-item {
			font-size: 0.9rem;
		}

		.card-description {
			font-size: 0.9rem;
		}

		.play-button {
			width: 60px;
			height: 60px;
			font-size: 1.5rem;
		}
	}

	@media (max-width: 480px) {
		.card-image-container {
			padding: 12px;
			min-height: 100px;
		}

		.card-image {
			width: calc(100% - 24px);
		}
	}
</style>
