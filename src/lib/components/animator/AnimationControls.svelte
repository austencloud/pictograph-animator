<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Props
	export let isPlaying: boolean = false;
	export let speed: number = 1.0;
	export let disabled: boolean = false;
	export let continuousLoop: boolean = false;
	export let canContinuousLoop: boolean = false; // Whether the sequence can be continuously looped

	// Events
	export let onPlay: () => void;
	export let onPause: () => void;
	export let onReset: () => void;
	export let onSpeedChange: (newSpeed: number) => void;
	export let onContinuousLoopChange: (enabled: boolean) => void;

	// Toggle play/pause
	function togglePlayPause() {
		if (isPlaying) {
			onPause();
		} else {
			onPlay();
		}
	}

	// Handle keyboard events
	function handleKeydown(event: KeyboardEvent) {
		if (event.code === 'Space' && !event.repeat) {
			// Prevent default space behavior (scrolling)
			event.preventDefault();
			togglePlayPause();
		}
	}

	// Add and remove keyboard event listeners
	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
	});
</script>

<div class="controls">
	<button class="play-pause-btn" on:click={togglePlayPause} {disabled}>
		{#if isPlaying}
			<span class="icon">⏸</span> Pause
		{:else}
			<span class="icon">▶️</span> Play
		{/if}
	</button>
	<button on:click={onReset} {disabled}>Reset</button>

	<div class="speed-control">
		<label for="speed-slider">Speed: {speed.toFixed(1)}x</label>
		<input
			id="speed-slider"
			type="range"
			min="0.1"
			step="0.1"
			bind:value={speed}
			on:input={() => onSpeedChange(speed)}
			{disabled}
		/>
	</div>

	{#if canContinuousLoop}
		<div class="continuous-loop-control">
			<label class="toggle-switch">
				<input
					type="checkbox"
					bind:checked={continuousLoop}
					on:change={() => onContinuousLoopChange(continuousLoop)}
					{disabled}
				/>
				<span class="toggle-slider"></span>
				<span class="toggle-label">Continuous Loop</span>
			</label>
		</div>
	{/if}
</div>

<style>
	.controls {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
		margin-top: var(--spacing-lg);
		flex-wrap: wrap;
		background-color: var(--surface-color);
		padding: var(--spacing-md);
		border-radius: var(--border-radius-lg);
		box-shadow: var(--shadow-md);
		transition: all var(--transition-normal);
	}

	.controls:hover {
		box-shadow: var(--shadow-lg);
	}

	button {
		padding: var(--spacing-sm) var(--spacing-lg);
		background-color: var(--primary-color);
		color: white;
		border: none;
		border-radius: var(--border-radius-md);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
		font-weight: 500;
		box-shadow: var(--shadow-sm);
	}

	button:hover {
		background-color: var(--primary-color-hover);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	button:active {
		background-color: var(--primary-color-active);
		transform: translateY(0);
	}

	button:disabled {
		background-color: var(--text-color-disabled);
		color: var(--text-color-tertiary);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.play-pause-btn {
		min-width: 100px;
		background-color: var(--button-bg, var(--primary-color));
	}

	.play-pause-btn:hover {
		--button-bg: var(--primary-color-hover);
	}

	/* Change button color when playing */
	:global(.playing) .play-pause-btn {
		--button-bg: var(--success-color);
	}

	:global(.playing) .play-pause-btn:hover {
		--button-bg: var(--success-color-hover);
	}

	.icon {
		margin-right: var(--spacing-sm);
		font-size: var(--font-size-lg);
	}

	.speed-control {
		display: flex;
		flex-direction: column;
		margin-left: var(--spacing-md);
		min-width: 150px;
	}

	.speed-control label {
		font-size: var(--font-size-sm);
		color: var(--text-color-secondary);
		margin-bottom: var(--spacing-xs);
		font-weight: 500;
	}

	.speed-control input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 8px;
		border-radius: var(--border-radius-full);
		background: var(--surface-color-hover);
		outline: none;
		transition: all var(--transition-fast);
	}

	.speed-control input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--primary-color);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.speed-control input[type='range']::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--primary-color);
		cursor: pointer;
		transition: all var(--transition-fast);
		border: none;
	}

	.speed-control input[type='range']::-webkit-slider-thumb:hover {
		background: var(--primary-color-hover);
		transform: scale(1.1);
	}

	.speed-control input[type='range']::-moz-range-thumb:hover {
		background: var(--primary-color-hover);
		transform: scale(1.1);
	}

	.speed-control input[type='range']:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Toggle switch styles */
	.continuous-loop-control {
		margin-left: var(--spacing-md);
		display: flex;
		align-items: center;
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--surface-color-hover);
		border-radius: var(--border-radius-md);
		transition: background-color var(--transition-fast);
	}

	.continuous-loop-control:hover {
		background-color: var(--surface-color-active);
	}

	.toggle-switch {
		position: relative;
		display: inline-flex;
		align-items: center;
		cursor: pointer;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: relative;
		display: inline-block;
		width: 40px;
		height: 20px;
		background-color: var(--surface-color-active);
		border-radius: 20px;
		transition: 0.4s;
	}

	.toggle-slider:before {
		position: absolute;
		content: '';
		height: 16px;
		width: 16px;
		left: 2px;
		bottom: 2px;
		background-color: white;
		border-radius: 50%;
		transition: 0.4s;
		box-shadow: var(--shadow-sm);
	}

	input:checked + .toggle-slider {
		background-color: var(--success-color);
	}

	input:disabled + .toggle-slider {
		background-color: var(--text-color-disabled);
		cursor: not-allowed;
	}

	input:checked + .toggle-slider:before {
		transform: translateX(20px);
	}

	.toggle-label {
		margin-left: var(--spacing-sm);
		font-size: var(--font-size-sm);
		color: var(--text-color-secondary);
		font-weight: 500;
	}

	/* Keyboard shortcut hint */
	.controls::after {
		content: 'Press Space to Play/Pause';
		font-size: var(--font-size-xs);
		color: var(--text-color-tertiary);
		margin-left: var(--spacing-md);
		align-self: center;
		background-color: var(--surface-color-hover);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--border-radius-md);
	}

	@media (max-width: 640px) {
		.controls {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-md);
		}

		.speed-control,
		.continuous-loop-control {
			margin-left: 0;
			margin-top: var(--spacing-sm);
		}

		.controls::after {
			margin: var(--spacing-sm) 0 0 0;
			align-self: center;
		}
	}
</style>
