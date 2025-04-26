<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import type { SequenceData } from '../types/sequence';
	import type { SequenceWithThumbnail } from '../utils/metadataExtractor';

	// Props
	export let sequences: SequenceWithThumbnail[] = [];
	export let selectedSequenceId: string | null = null;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		selectSequence: { sequenceData: SequenceData; id: string };
	}>();

	// Handle thumbnail click
	function handleThumbnailClick(sequence: SequenceWithThumbnail) {
		dispatch('selectSequence', {
			sequenceData: sequence.sequenceData,
			id: sequence.id
		});
	}

	// Handle keyboard navigation
	function handleKeyDown(event: KeyboardEvent, sequence: SequenceWithThumbnail) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleThumbnailClick(sequence);
		}
	}

	// Handle image error
	function handleImageError(event: Event, sequence: SequenceWithThumbnail) {
		const target = event.target as HTMLImageElement;
		// Use our placeholder image
		target.src = '/thumbnails/placeholder.svg';
		// Make the sequence preview more visible when the image fails to load
		target.style.opacity = '0.3';
		console.warn(`Failed to load thumbnail for ${sequence.name}. Using placeholder.`);
	}
</script>

<div class="sequence-gallery-container">
	<h2 class="gallery-title">Sequence Library</h2>

	<div class="sequence-gallery">
		{#each sequences as sequence (sequence.id)}
			<div
				class="thumbnail-container"
				class:selected={selectedSequenceId === sequence.id}
				on:click={() => handleThumbnailClick(sequence)}
				on:keydown={(e) => handleKeyDown(e, sequence)}
				tabindex="0"
				role="button"
				aria-pressed={selectedSequenceId === sequence.id}
				in:fade={{ duration: 300, delay: 100 }}
				out:scale={{ duration: 200, start: 0.95 }}
			>
				<div class="thumbnail-image-container">
					<!-- Render the actual thumbnail image -->
					<img
						src={sequence.thumbnailUrl}
						alt={`Thumbnail for ${sequence.name}`}
						class="thumbnail-image"
						loading="lazy"
						on:error={(e) => handleImageError(e, sequence)}
					/>

					<!-- Render a visual representation of the sequence -->
					<div class="sequence-preview">
						<div class="grid-container">
							{#if sequence.sequenceData && sequence.sequenceData.length > 1}
								<!-- Get the first step with props -->
								{@const firstStep = sequence.sequenceData[1] || {}}

								<!-- Determine blue prop position -->
								{@const bluePos =
									firstStep.blue_prop?.location ||
									(firstStep.blue_attributes?.start_loc
										? firstStep.blue_attributes.start_loc
										: 'center')}

								<!-- Determine red prop position -->
								{@const redPos =
									firstStep.red_prop?.location ||
									(firstStep.red_attributes?.start_loc
										? firstStep.red_attributes.start_loc
										: 'center')}

								<!-- Render blue prop -->
								<div
									class="prop blue-prop"
									class:horizontal={firstStep.blue_prop?.orientation === 'horizontal' ||
										firstStep.blue_attributes?.start_ori === 'horizontal'}
									data-position={bluePos}
								></div>

								<!-- Render red prop -->
								<div
									class="prop red-prop"
									class:horizontal={firstStep.red_prop?.orientation === 'horizontal' ||
										firstStep.red_attributes?.start_ori === 'horizontal'}
									data-position={redPos}
								></div>
							{/if}
						</div>
					</div>

					{#if selectedSequenceId === sequence.id}
						<div class="selected-indicator" transition:scale={{ duration: 200 }}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polyline points="20 6 9 17 4 12"></polyline>
							</svg>
						</div>
					{/if}
				</div>

				<div class="thumbnail-info">
					<span class="thumbnail-name">{sequence.name}</span>
					<span class="thumbnail-meta">
						{#if sequence.sequenceData[0].level}
							<span class="level-badge">Level {sequence.sequenceData[0].level}</span>
						{/if}
						<span class="steps-badge">{sequence.sequenceData.length - 1} steps</span>
					</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.sequence-gallery-container {
		margin-bottom: var(--spacing-xl);
		padding: var(--spacing-md);
		background: var(--surface-gradient);
		border-radius: var(--border-radius-lg);
		box-shadow: var(--shadow-md);
		transition: all var(--transition-normal);
	}

	.sequence-gallery-container:hover {
		box-shadow: var(--shadow-lg);
	}

	.gallery-title {
		font-size: var(--font-size-xl);
		margin-bottom: var(--spacing-md);
		color: var(--text-color);
		position: relative;
		display: inline-block;
	}

	.gallery-title::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 0;
		width: 40px;
		height: 3px;
		background: var(--primary-gradient);
		border-radius: var(--border-radius-full);
	}

	.sequence-gallery {
		display: flex;
		overflow-x: auto;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-xs);
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		scrollbar-color: var(--text-color-tertiary) transparent;
	}

	/* Custom scrollbar styling */
	.sequence-gallery::-webkit-scrollbar {
		height: 6px;
	}

	.sequence-gallery::-webkit-scrollbar-track {
		background: transparent;
		border-radius: var(--border-radius-full);
	}

	.sequence-gallery::-webkit-scrollbar-thumb {
		background-color: var(--text-color-tertiary);
		border-radius: var(--border-radius-full);
	}

	.sequence-gallery::-webkit-scrollbar-thumb:hover {
		background-color: var(--text-color-secondary);
	}

	.thumbnail-container {
		flex: 0 0 auto;
		width: 180px;
		border-radius: var(--border-radius-lg);
		background: var(--surface-color);
		border: 1px solid var(--border-color);
		overflow: hidden;
		cursor: pointer;
		transition: all var(--transition-fast);
		position: relative;
		box-shadow: var(--shadow-sm);
	}

	.thumbnail-container:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-md);
		border-color: var(--border-color-hover);
	}

	.thumbnail-container:active {
		transform: translateY(-2px);
	}

	.thumbnail-container:focus-visible {
		outline: none;
		box-shadow: var(--shadow-outline);
	}

	.thumbnail-container.selected {
		border-color: var(--primary-color);
		box-shadow:
			0 0 0 2px var(--primary-color-focus),
			var(--shadow-md);
		background: var(--surface-color-accent);
	}

	.thumbnail-image-container {
		position: relative;
		width: 100%;
		height: 180px;
		overflow: hidden;
		background: var(--surface-color-hover);
	}

	.thumbnail-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--transition-normal);
		opacity: 0.7; /* Make the image slightly transparent to show the sequence preview */
	}

	.thumbnail-container:hover .thumbnail-image {
		transform: scale(1.05);
	}

	/* Sequence preview styling */
	.sequence-preview {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1;
		pointer-events: none;
	}

	.grid-container {
		position: relative;
		width: 80%;
		height: 80%;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		gap: 2px;
	}

	.prop {
		position: absolute;
		width: 20px;
		height: 6px;
		border-radius: 3px;
		transition: all var(--transition-normal);
	}

	.prop.horizontal {
		width: 20px;
		height: 6px;
	}

	.prop:not(.horizontal) {
		width: 6px;
		height: 20px;
	}

	.blue-prop {
		background-color: #2e3192; /* HEX_BLUE */
		box-shadow: 0 0 8px rgba(46, 49, 146, 0.6);
	}

	.red-prop {
		background-color: #ed1c24; /* HEX_RED */
		box-shadow: 0 0 8px rgba(237, 28, 36, 0.6);
	}

	/* Position the props based on their data-position attribute */
	.prop[data-position='top_left'] {
		top: 10%;
		left: 10%;
	}

	.prop[data-position='top'] {
		top: 10%;
		left: 50%;
		transform: translateX(-50%);
	}

	.prop[data-position='top_right'] {
		top: 10%;
		right: 10%;
	}

	.prop[data-position='left'] {
		top: 50%;
		left: 10%;
		transform: translateY(-50%);
	}

	.prop[data-position='center'] {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.prop[data-position='right'] {
		top: 50%;
		right: 10%;
		transform: translateY(-50%);
	}

	.prop[data-position='bottom_left'] {
		bottom: 10%;
		left: 10%;
	}

	.prop[data-position='bottom'] {
		bottom: 10%;
		left: 50%;
		transform: translateX(-50%);
	}

	.prop[data-position='bottom_right'] {
		bottom: 10%;
		right: 10%;
	}

	.selected-indicator {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 24px;
		height: 24px;
		background: var(--primary-gradient);
		border-radius: var(--border-radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-color-on-primary);
		box-shadow: var(--shadow-md);
	}

	.thumbnail-info {
		padding: var(--spacing-sm);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.thumbnail-name {
		font-weight: 600;
		font-size: var(--font-size-sm);
		color: var(--text-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.thumbnail-meta {
		display: flex;
		gap: var(--spacing-xs);
		font-size: var(--font-size-xs);
		color: var(--text-color-secondary);
	}

	.level-badge,
	.steps-badge {
		display: inline-flex;
		align-items: center;
		padding: 2px 6px;
		border-radius: var(--border-radius-full);
		background: var(--surface-color-hover);
		font-weight: 500;
	}

	.level-badge {
		color: var(--accent-color);
	}

	.steps-badge {
		color: var(--secondary-color);
	}

	@media (max-width: 640px) {
		.thumbnail-container {
			width: 140px;
		}

		.thumbnail-image-container {
			height: 140px;
		}

		.thumbnail-info {
			padding: var(--spacing-xs);
		}
	}
</style>
