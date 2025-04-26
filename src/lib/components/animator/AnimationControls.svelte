<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Props
	export let isPlaying: boolean = false;
	export let speed: number = 1.0;

	// Events
	export let onPlay: () => void;
	export let onPause: () => void;
	export let onReset: () => void;
	export let onSpeedChange: (newSpeed: number) => void;

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
	<button class="play-pause-btn" on:click={togglePlayPause}>
		{#if isPlaying}
			<span class="icon">⏸</span> Pause
		{:else}
			<span class="icon">▶️</span> Play
		{/if}
	</button>
	<button on:click={onReset}>Reset</button>

	<div class="speed-control">
		<label for="speed-slider">Speed: {speed.toFixed(1)}x</label>
		<input
			id="speed-slider"
			type="range"
			min="0.1"
			max="3.0"
			step="0.1"
			bind:value={speed}
			on:input={() => onSpeedChange(speed)}
		/>
	</div>
</div>

<style>
	.controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-top: 1rem;
	}

	button {
		padding: 0.5rem 1rem;
		background-color: #0072bc;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
	}

	button:hover {
		background-color: #005a93;
	}

	button:active {
		background-color: #004a7a;
	}

	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.play-pause-btn {
		min-width: 90px;
		background-color: var(--button-bg, #0072bc);
	}

	.play-pause-btn:hover {
		--button-bg: #005a93;
	}

	/* Change button color when playing */
	:global(.playing) .play-pause-btn {
		--button-bg: #4caf50;
	}

	:global(.playing) .play-pause-btn:hover {
		--button-bg: #3d8b40;
	}

	.icon {
		margin-right: 5px;
		font-size: 1.1em;
	}

	.speed-control {
		display: flex;
		flex-direction: column;
		margin-left: 1rem;
	}

	/* Keyboard shortcut hint */
	.controls::after {
		content: 'Press Space to Play/Pause';
		font-size: 0.75rem;
		color: #666;
		margin-left: 1rem;
		align-self: center;
	}
</style>
