<script lang="ts">
	import type { SequenceData, PropState } from './types/core.js';
	import { AnimationEngine } from './core/engine/animation-engine.js';
	import { AnimatorErrorHandler } from './utils/error/error-handler.js';
	import { InputValidator } from './utils/validation/input-validator.js';

	// Import subcomponents from new architecture
	import SequenceInput from './components/input/SequenceInput.svelte';
	import AnimatorCanvas from './components/canvas/AnimatorCanvas.svelte';
	import AnimatorControls from './components/controls/AnimatorControls.svelte';
	import AnimatorInfo from './components/info/AnimatorInfo.svelte';
	import AnimatorMessage from './components/ui/AnimatorMessage.svelte';

	// Setup engine
	const engine = new AnimationEngine();

	// State variables using Svelte 5 runes
	let sequenceData = $state<SequenceData | null>(null);
	let blueProp = $state<PropState>({ centerPathAngle: 0, staffRotationAngle: 0, x: 0, y: 0 });
	let redProp = $state<PropState>({ centerPathAngle: 0, staffRotationAngle: 0, x: 0, y: 0 });
	let isPlaying = $state(false);
	let speed = $state(1.0);
	let currentBeat = $state(0);
	let totalBeats = $state(0);
	let canvasWidth = $state(500);
	let canvasHeight = $state(500);
	let sequenceWord = $state('');
	let sequenceAuthor = $state('');
	let isLooping = $state(false);
	let canLoop = $state(false);

	// Message state
	let errorMessage = $state('');
	let successMessage = $state('');

	// Animation frame reference
	let animationFrameId: number | null = null;
	let lastTimestamp: number | null = null;

	// Clean up on component destroy using $effect
	$effect(() => {
		return () => {
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});

	// Handle sequence load
	function handleLoadSequence(data: SequenceData): void {
		try {
			// Validate sequence data first
			const validation = InputValidator.validateSequenceData(data);
			if (!validation.isValid) {
				errorMessage = `Invalid sequence data: ${validation.errors.join(', ')}`;
				successMessage = '';
				return;
			}

			// Log warnings if any
			if (validation.warnings.length > 0) {
				console.info('Sequence warnings:', validation.warnings.join(', '));
			}

			// Initialize engine with data
			if (engine.initialize(data)) {
				// Load sequence data
				sequenceData = data;
				const metadata = engine.getMetadata();
				totalBeats = metadata.totalBeats;
				sequenceWord = metadata.word;
				sequenceAuthor = metadata.author;
				canLoop = engine.canLoop();

				// Reset animation state
				currentBeat = 0;
				isPlaying = false;
				isLooping = false;

				// Update prop states
				updatePropStates();

				successMessage = 'Sequence loaded successfully!';
				errorMessage = '';
			} else {
				const error = AnimatorErrorHandler.handleEngineError(
					new Error('Failed to initialize sequence')
				);
				errorMessage = AnimatorErrorHandler.formatForUser(error);
				successMessage = '';
			}
		} catch (err) {
			const error = AnimatorErrorHandler.handleSequenceError(
				err instanceof Error ? err : new Error(String(err))
			);
			errorMessage = AnimatorErrorHandler.formatForUser(error);
			successMessage = '';
		}
	}

	// Update prop states from engine
	function updatePropStates(): void {
		const states = engine.getPropStates();
		blueProp = states.blueProp;
		redProp = states.redProp;
	}

	// Animation loop
	function animationLoop(timestamp: number): void {
		if (!isPlaying) return;

		// Calculate deltaTime
		if (lastTimestamp === null) {
			lastTimestamp = timestamp;
		}
		const deltaTime = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		// Update current beat based on speed
		const beatDelta = (deltaTime / 1000) * speed;
		const newBeat = currentBeat + beatDelta;

		// Check if we've reached the end
		if (newBeat >= totalBeats) {
			if (isLooping) {
				// Loop back to start
				currentBeat = 0;
				lastTimestamp = null;

				// Make sure the engine is reset properly for the next loop
				engine.reset();
			} else {
				// Stop at end
				currentBeat = totalBeats;
				isPlaying = false;
			}
		} else {
			currentBeat = newBeat;
		}

		// Calculate state for current beat
		engine.calculateState(currentBeat);

		// Update props from engine state
		updatePropStates();

		// Request next frame if still playing
		if (isPlaying) {
			animationFrameId = requestAnimationFrame(animationLoop);
		}
	}

	// Handle play/pause
	function handlePlayPause(): void {
		if (isPlaying) {
			isPlaying = false;
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		} else {
			isPlaying = true;
			lastTimestamp = null;
			animationFrameId = requestAnimationFrame(animationLoop);
		}
	}

	// Handle reset
	function handleReset(): void {
		currentBeat = 0;
		isPlaying = false;

		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}

		engine.reset();
		updatePropStates();
	}

	// Handle speed change
	function handleSpeedChange(value: number): void {
		speed = Math.max(0.1, Math.min(3.0, value));
	}

	// Handle beat change
	function handleBeatChange(value: number): void {
		currentBeat = Math.max(0, Math.min(totalBeats, value));
		engine.calculateState(currentBeat);
		updatePropStates();
	}

	// Handle loop toggle
	function handleLoopToggle(value: boolean): void {
		if (canLoop) {
			isLooping = value;
		}
	}
</script>

<div class="animator-app">
	<h1>Pictograph Animator</h1>

	<SequenceInput onSequenceLoaded={handleLoadSequence} />
	<AnimatorMessage errorMsg={errorMessage} successMsg={successMessage} />

	{#if sequenceData}
		<AnimatorCanvas {blueProp} {redProp} width={canvasWidth} height={canvasHeight} />

		<AnimatorControls
			{isPlaying}
			{speed}
			{currentBeat}
			maxBeat={totalBeats}
			{canLoop}
			{isLooping}
			onPlayPause={handlePlayPause}
			onReset={handleReset}
			onSpeedChange={handleSpeedChange}
			onBeatChange={handleBeatChange}
			onLoopToggle={handleLoopToggle}
		/>

		<AnimatorInfo {currentBeat} {speed} {totalBeats} {sequenceWord} {sequenceAuthor} />
	{/if}
</div>

<style>
	.animator-app {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 700px;
		margin: 0 auto;
		padding: 1rem;
	}

	h1 {
		font-size: 1.5rem;
		margin: 0;
		color: var(--primary-color, #2196f3);
		text-align: center;
	}
</style>
