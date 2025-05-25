<script lang="ts">
	import { InputValidator } from '../../utils/validation/input-validator.js';

	// Modern Svelte 5 props with callback functions
	let {
		isPlaying = false,
		speed = 1.0,
		currentBeat = 0,
		maxBeat = 4,
		canLoop = false,
		isLooping = false,
		onPlayPause,
		onReset,
		onSpeedChange,
		onBeatChange,
		onLoopToggle
	}: {
		isPlaying?: boolean;
		speed?: number;
		currentBeat?: number;
		maxBeat?: number;
		canLoop?: boolean;
		isLooping?: boolean;
		onPlayPause?: () => void;
		onReset?: () => void;
		onSpeedChange?: (value: number) => void;
		onBeatChange?: (value: number) => void;
		onLoopToggle?: (value: boolean) => void;
	} = $props();

	function handlePlayPause(): void {
		onPlayPause?.();
	}

	function handleReset(): void {
		onReset?.();
	}

	function handleSpeedChange(event: Event): void {
		const value = parseFloat((event.target as HTMLInputElement).value);
		const validation = InputValidator.validateSpeed(value);

		if (validation.isValid) {
			onSpeedChange?.(value);
		} else {
			console.warn('Invalid speed:', validation.errors.join(', '));
		}

		// Log warnings if any
		if (validation.warnings.length > 0) {
			console.info('Speed warnings:', validation.warnings.join(', '));
		}
	}

	function handleBeatChange(event: Event): void {
		const value = parseFloat((event.target as HTMLInputElement).value);
		const validation = InputValidator.validateBeat(value, maxBeat);

		if (validation.isValid) {
			onBeatChange?.(value);
		} else {
			console.warn('Invalid beat:', validation.errors.join(', '));
		}
	}

	function handleLoopToggle(event: Event): void {
		const checked = (event.target as HTMLInputElement).checked;
		onLoopToggle?.(checked);
	}
</script>

<div class="animator-controls">
	<div class="controls-row">
		<button type="button" class="btn-reset" onclick={handleReset} title="Reset animation">
			<span class="icon">⏮</span>
		</button>
		<button
			type="button"
			class="btn-play"
			onclick={handlePlayPause}
			title={isPlaying ? 'Pause animation' : 'Play animation'}
		>
			<span class="icon">{isPlaying ? '⏸' : '▶'}</span>
		</button>
		<div class="speed-control">
			<label>
				<span>Speed: {speed.toFixed(1)}x</span>
				<input
					type="range"
					min="0.1"
					max="3.0"
					step="0.1"
					value={speed}
					oninput={handleSpeedChange}
				/>
			</label>
		</div>
	</div>

	<div class="timeline">
		<input
			type="range"
			class="beat-slider"
			min="0"
			max={maxBeat}
			step="0.01"
			value={currentBeat}
			oninput={handleBeatChange}
			disabled={isPlaying}
		/>
		<div class="beat-display">
			<span>Beat: {currentBeat.toFixed(2)}</span>
		</div>
	</div>

	<div class="loop-control">
		<label>
			<input type="checkbox" checked={isLooping} onchange={handleLoopToggle} disabled={!canLoop} />
			<span>Loop Animation</span>
		</label>
	</div>
</div>

<style>
	.animator-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background-color: var(--background-color, #f5f5f5);
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.controls-row {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	button {
		background: var(--primary-color, #2196f3);
		color: white;
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
	}

	button:hover {
		background: var(--primary-dark, #1976d2);
	}

	.btn-reset {
		background: #757575;
	}

	.btn-reset:hover {
		background: #616161;
	}

	.icon {
		font-size: 1.25rem;
	}

	.speed-control {
		flex-grow: 1;
	}

	.speed-control label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	input[type='range'] {
		width: 100%;
		cursor: pointer;
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.beat-slider {
		width: 100%;
	}

	.beat-display {
		display: flex;
		justify-content: space-between;
		font-family: monospace;
		font-size: 0.9rem;
		color: #666;
	}

	.loop-control {
		display: flex;
		justify-content: flex-end;
	}

	.loop-control label {
		display: flex;
		align-items: center;
		cursor: pointer;
		font-size: 0.9rem;
	}

	input[type='checkbox'] {
		margin-right: 0.5rem;
		cursor: pointer;
	}

	input[type='checkbox']:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
</style>
