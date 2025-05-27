<script lang="ts">
	import { slide } from 'svelte/transition';

	// Modern Svelte 5 props
	let {
		currentBeat = 0,
		speed = 1.0,
		totalBeats = 0,
		sequenceWord = '',
		sequenceAuthor = '',
		showAdvanced = false
	}: {
		currentBeat?: number;
		speed?: number;
		totalBeats?: number;
		sequenceWord?: string;
		sequenceAuthor?: string;
		showAdvanced?: boolean;
	} = $props();

	// User-friendly calculations
	const elapsedSeconds = $derived(currentBeat / speed);
	const elapsedMinutes = $derived(Math.floor(elapsedSeconds / 60));
	const elapsedRemainingSeconds = $derived(Math.floor(elapsedSeconds % 60));
	const elapsedTimeFormatted = $derived(
		`${elapsedMinutes}:${elapsedRemainingSeconds.toString().padStart(2, '0')}`
	);

	const progressPercent = $derived(
		totalBeats > 0 ? Math.round((currentBeat / totalBeats) * 100) : 0
	);

	const currentStep = $derived(Math.floor(currentBeat) + 1);
	const totalSteps = $derived(Math.floor(totalBeats));

	// Advanced technical details (hidden by default)
	const tValue = $derived(currentBeat - Math.floor(currentBeat));
	const currentStepIndex = $derived(Math.floor(currentBeat));

	// State for advanced toggle
	let showAdvancedInfo = $state(showAdvanced);
</script>

<div class="animator-info">
	<!-- Primary Information - Always Visible -->
	<div class="primary-info">
		{#if sequenceWord || sequenceAuthor}
			<div class="sequence-header">
				{#if sequenceWord}
					<h3 class="sequence-title">{sequenceWord}</h3>
				{/if}
				{#if sequenceAuthor}
					<p class="sequence-author">by {sequenceAuthor}</p>
				{/if}
			</div>
		{/if}

		<!-- Progress Visualization -->
		<div class="progress-section">
			<div class="progress-header">
				<span class="progress-label">Progress</span>
				<span class="progress-value">{progressPercent}%</span>
			</div>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progressPercent}%"></div>
			</div>
			<div class="progress-details">
				<span>Step {currentStep} of {totalSteps}</span>
				<span>{elapsedTimeFormatted}</span>
			</div>
		</div>

		<!-- Speed Display -->
		<div class="speed-display">
			<span class="speed-label">Playback Speed</span>
			<span class="speed-value">{speed.toFixed(1)}×</span>
		</div>
	</div>

	<!-- Advanced Information - Collapsible -->
	<div class="advanced-section">
		<button
			type="button"
			class="advanced-toggle"
			onclick={() => (showAdvancedInfo = !showAdvancedInfo)}
			aria-expanded={showAdvancedInfo}
			title="Show technical details"
		>
			<span>Technical Details</span>
			<span class="toggle-icon" class:rotated={showAdvancedInfo}>▼</span>
		</button>

		{#if showAdvancedInfo}
			<div class="advanced-content" transition:slide>
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
					<span class="label">Total Beats:</span>
					<span class="value">{totalBeats}</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.animator-info {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem;
		background: var(--color-surface);
		border-radius: 12px;
		border: 1px solid var(--color-border);
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		transition: all 0.3s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	/* Primary Information Section */
	.primary-info {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.sequence-header {
		text-align: center;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.sequence-title {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
		letter-spacing: -0.025em;
	}

	.sequence-author {
		margin: 0;
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		font-style: italic;
	}

	/* Progress Section */
	.progress-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.progress-label {
		font-weight: 600;
		color: var(--color-text-primary);
		font-size: 1rem;
	}

	.progress-value {
		font-weight: 700;
		color: var(--color-primary);
		font-size: 1.1rem;
	}

	.progress-bar {
		height: 8px;
		background: var(--color-border);
		border-radius: 4px;
		overflow: hidden;
		position: relative;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), var(--color-success));
		border-radius: 4px;
		transition: width 0.3s ease;
		position: relative;
	}

	.progress-fill::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.progress-details {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	/* Speed Display */
	.speed-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--color-background);
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

	.speed-label {
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.speed-value {
		font-weight: 700;
		color: var(--color-primary);
		font-size: 1.1rem;
	}

	/* Advanced Section */
	.advanced-section {
		border-top: 1px solid var(--color-border);
		padding-top: 1rem;
	}

	.advanced-toggle {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		color: var(--color-text-secondary);
		transition: all 0.2s ease;
	}

	.advanced-toggle:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
		border-color: var(--color-primary);
	}

	.toggle-icon {
		transition: transform 0.2s ease;
		font-size: 0.8rem;
	}

	.toggle-icon.rotated {
		transform: rotate(180deg);
	}

	/* Mobile Responsive Design */
	@media (max-width: 768px) {
		.animator-info {
			padding: 1rem;
			gap: 1rem;
		}

		.sequence-title {
			font-size: 1.25rem;
		}

		.sequence-author {
			font-size: 0.8rem;
		}

		.progress-header {
			font-size: 0.85rem;
		}

		.progress-details {
			font-size: 0.8rem;
		}

		.speed-display {
			flex-direction: row;
			justify-content: space-between;
		}

		.speed-label,
		.speed-value {
			font-size: 0.9rem;
		}

		.advanced-toggle {
			padding: 0.75rem;
			font-size: 0.9rem;
		}

		.info-item {
			font-size: 0.85rem;
		}
	}

	@media (max-width: 480px) {
		.animator-info {
			padding: 0.75rem;
			gap: 0.75rem;
		}

		.sequence-title {
			font-size: 1.1rem;
		}

		.progress-section {
			gap: 0.75rem;
		}

		.advanced-content {
			gap: 0.75rem;
		}
	}

	.advanced-content {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--color-background);
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.info-item:last-child {
		border-bottom: none;
	}

	.label {
		font-weight: 500;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	.value {
		font-family:
			'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
		font-weight: 600;
		color: var(--color-text-primary);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.85rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.animator-info {
			padding: 1rem;
			gap: 1rem;
		}

		.sequence-title {
			font-size: 1.25rem;
		}

		.progress-details {
			font-size: 0.85rem;
		}

		.info-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.value {
			align-self: flex-end;
		}
	}
</style>
