<script lang="ts">
	// Modern Svelte 5 props
	let {
		currentBeat = 0,
		speed = 1.0,
		totalBeats = 0,
		sequenceWord = '',
		sequenceAuthor = ''
	}: {
		currentBeat?: number;
		speed?: number;
		totalBeats?: number;
		sequenceWord?: string;
		sequenceAuthor?: string;
	} = $props();

	// Calculate t-value (fractional part of current beat)
	const tValue = $derived(currentBeat - Math.floor(currentBeat));

	// Calculate elapsed time based on beats and speed (using base speed of 1 beat per second)
	const elapsedSeconds = $derived(currentBeat / speed);
	const elapsedMinutes = $derived(Math.floor(elapsedSeconds / 60));
	const elapsedRemainingSeconds = $derived(Math.floor(elapsedSeconds % 60));
	const elapsedTimeFormatted = $derived(
		`${elapsedMinutes}:${elapsedRemainingSeconds.toString().padStart(2, '0')}`
	);

	// Current step index (0-based)
	const currentStepIndex = $derived(Math.floor(currentBeat));

	// Progress percentage
	const progressPercent = $derived(
		totalBeats > 0 ? ((currentBeat / totalBeats) * 100).toFixed(1) : '0.0'
	);
</script>

<div class="animator-info">
	<div class="info-section">
		<h3>Sequence Information</h3>
		{#if sequenceWord}
			<div class="info-item">
				<span class="label">Word:</span>
				<span class="value">{sequenceWord}</span>
			</div>
		{/if}
		{#if sequenceAuthor}
			<div class="info-item">
				<span class="label">Author:</span>
				<span class="value">{sequenceAuthor}</span>
			</div>
		{/if}
		<div class="info-item">
			<span class="label">Total Beats:</span>
			<span class="value">{totalBeats}</span>
		</div>
	</div>

	<div class="info-section">
		<h3>Animation Status</h3>
		<div class="info-item">
			<span class="label">Current Beat:</span>
			<span class="value">{currentBeat.toFixed(2)}</span>
		</div>
		<div class="info-item">
			<span class="label">Step Index:</span>
			<span class="value">{currentStepIndex}</span>
		</div>
		<div class="info-item">
			<span class="label">T-Value:</span>
			<span class="value">{tValue.toFixed(3)}</span>
		</div>
		<div class="info-item">
			<span class="label">Progress:</span>
			<span class="value">{progressPercent}%</span>
		</div>
	</div>

	<div class="info-section">
		<h3>Timing</h3>
		<div class="info-item">
			<span class="label">Speed:</span>
			<span class="value">{speed.toFixed(1)}x</span>
		</div>
		<div class="info-item">
			<span class="label">Elapsed Time:</span>
			<span class="value">{elapsedTimeFormatted}</span>
		</div>
	</div>
</div>

<style>
	.animator-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-surface);
		border-radius: 8px;
		border: 1px solid var(--color-border);
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		transition: all 0.3s ease;
	}

	.info-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-section h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-primary);
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.25rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0;
	}

	.label {
		font-weight: 500;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	.value {
		font-family: monospace;
		font-weight: 600;
		color: var(--color-text-primary);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-size: 0.85rem;
		transition: all 0.3s ease;
	}

	@media (max-width: 768px) {
		.animator-info {
			padding: 0.75rem;
		}

		.info-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.value {
			align-self: flex-end;
		}
	}
</style>
