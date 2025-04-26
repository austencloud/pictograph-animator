<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { SequenceData, SequenceStep, PropState } from '../../types/sequence';
	import { AnimationEngine } from './AnimationEngine';
	import CanvasRenderer from './CanvasRenderer.svelte';
	import AnimationControls from './AnimationControls.svelte';
	import { normalizeSequenceFormat } from '../../utils/sequenceFormatAdapter';

	// Props
	export let sequenceData: SequenceData;
	export let width: number = 600;
	export let height: number = 600;
	export let speed: number = 1.0;

	// Animation state
	let animationFrameId: number | null = null;
	let isPlaying = false;
	let currentBeat = 0;
	let lastTimestamp: number | null = null;
	let canRender = false;
	let error = '';

	// --- Variable for total beats ---
	let totalBeats = 0;

	// Continuous loop settings
	let continuousLoop = false; // Whether to loop continuously without pausing
	let canContinuousLoop = false; // Whether the sequence can be continuously looped

	// Prop states
	let bluePropState: PropState = {
		centerPathAngle: 0,
		staffRotationAngle: 0,
		x: 0,
		y: 0,
		_stepStartStaffRotationAngle: undefined, // Initialize as undefined
		_stepTargetStaffRotationAngle: undefined,
		_stepStartCenterPathAngle: undefined,
		_stepTargetCenterPathAngle: undefined,
		_initialized: undefined
	};

	let redPropState: PropState = {
		centerPathAngle: 0,
		staffRotationAngle: 0,
		x: 0,
		y: 0,
		_stepStartStaffRotationAngle: undefined, // Initialize as undefined
		_stepTargetStaffRotationAngle: undefined,
		_stepStartCenterPathAngle: undefined,
		_stepTargetCenterPathAngle: undefined,
		_initialized: undefined
	};

	// Parsed sequence
	let parsedSteps: SequenceStep[] = [];

	// Canvas renderer reference
	let canvasRenderer: CanvasRenderer;

	// Initialize on mount
	onMount(() => {
		// Parse sequence data
		if (sequenceData) {
			parseSequence();
		} else {
			// Handle case where no initial sequenceData is provided
			error = 'No sequence data provided on mount.';
		}

		return () => {
			// Cleanup on component unmount
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});

	// Watch for changes in sequenceData
	$: if (sequenceData) {
		console.log('Sequence data changed, re-parsing and resetting...');
		parseSequence();
		resetAnimationState(); // Reset when data changes
	} else {
		// Clear state if sequenceData becomes null/undefined
		parsedSteps = [];
		totalBeats = 0;
		error = 'Sequence data is missing.';
		resetAnimationState();
	}

	/**
	 * Parses the sequence data into a more usable format
	 */
	function parseSequence() {
		console.log('Parsing sequence data...');
		error = ''; // Clear previous errors

		if (!sequenceData) {
			error = 'No sequence data provided';
			parsedSteps = [];
			totalBeats = 0;
			console.error(error);
			return;
		}

		// Log the actual data structure received
		console.log('Raw sequence data format:', {
			type: typeof sequenceData,
			isArray: Array.isArray(sequenceData),
			length: Array.isArray(sequenceData) ? sequenceData.length : 'N/A',
			sample: JSON.stringify(sequenceData).substring(0, 100) + '...'
		});

		// Normalize the sequence data format
		const normalizedData = normalizeSequenceFormat(sequenceData);

		if (!normalizedData) {
			error = 'Failed to normalize sequence data format';
			parsedSteps = [];
			totalBeats = 0;
			console.error(error, sequenceData);
			return;
		}

		// Use the normalized data for further processing
		console.log('Normalized data format:', {
			isArray: Array.isArray(normalizedData),
			length: normalizedData.length,
			firstElement: typeof normalizedData[0]
		});

		// Expecting [metadata, start_pos, step1, step2, ...]
		if (!Array.isArray(normalizedData) || normalizedData.length < 2) {
			error =
				'Invalid sequence data format: Expected an array with metadata and at least a start position.';
			parsedSteps = [];
			totalBeats = 0;
			console.error(error, normalizedData);
			return;
		}

		// Actual animation steps start from index 2
		const steps = normalizedData.slice(2) as SequenceStep[];

		if (steps.length === 0) {
			// Check if there are actual steps after metadata and start_pos
			error = 'Invalid sequence: Contains metadata and start position, but no animation steps.';
			parsedSteps = [];
			totalBeats = 0;
			console.warn(error, normalizedData);
			// Don't return here, allow resetAnimationState to potentially clear the canvas
		} else {
			parsedSteps = steps.map((step) => ({ ...step }));
			// --- Calculate totalBeats from parsedSteps ---
			totalBeats = parsedSteps.length;
			console.log(`Sequence parsed. Total beats: ${totalBeats}`);

			// Check if the sequence can be continuously looped
			checkContinuousLoopability();
		}

		// Calculate initial state (safe even if totalBeats is 0)
		// Pass totalBeats here for the initial calculation as well
		AnimationEngine.calculateState(0, parsedSteps, bluePropState, redPropState, totalBeats);
	}

	/**
	 * Main animation loop
	 */
	function animationLoop(timestamp: number) {
		if (!isPlaying || totalBeats === 0) return; // Don't run if paused or no beats

		// Calculate time delta and update current beat
		if (lastTimestamp === null) {
			lastTimestamp = timestamp;
		}
		const deltaTime = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		const previousBeat = currentBeat;
		const timePerBeat = 1000 / speed;

		// Advance beat incrementally
		let deltaTimeRemaining = deltaTime;
		while (deltaTimeRemaining > 0) {
			// Ensure we don't advance beyond totalBeats in one go if deltaTime is large
			const timeToAdvance = Math.min(deltaTimeRemaining, timePerBeat / 4); // Advance max 1/4 beat time
			const beatAdvance = (timeToAdvance / 1000) * speed;

			// Check if adding beatAdvance would exceed totalBeats
			if (currentBeat + beatAdvance >= totalBeats) {
				currentBeat = totalBeats;
				deltaTimeRemaining = 0; // Stop advancing
			} else {
				currentBeat += beatAdvance;
				deltaTimeRemaining -= timeToAdvance;
			}
		}

		// --- Check against totalBeats ---
		if (currentBeat >= totalBeats) {
			currentBeat = totalBeats; // Ensure it's exactly totalBeats

			// Save the final angles for both props
			const finalBlueCenterAngle = bluePropState.centerPathAngle;
			const finalBlueStaffAngle = bluePropState.staffRotationAngle;
			const finalRedCenterAngle = redPropState.centerPathAngle;
			const finalRedStaffAngle = redPropState.staffRotationAngle;

			// Check if we should use continuous looping
			if (continuousLoop && canContinuousLoop) {
				// For continuous looping, immediately reset to beat 0 and continue
				console.log('Continuous loop: immediately resetting to beat 0');
				currentBeat = 0;
				lastTimestamp = null; // Reset timestamp for accurate timing

				// Preserve the final angles
				bluePropState.centerPathAngle = finalBlueCenterAngle;
				bluePropState.staffRotationAngle = finalBlueStaffAngle;
				redPropState.centerPathAngle = finalRedCenterAngle;
				redPropState.staffRotationAngle = finalRedStaffAngle;

				// No need to call play() since we're already in the animation loop
			} else {
				// Standard looping with pause
				pause(); // Pause first

				// Use a flag to prevent multiple loop timeouts if reset is called quickly
				if (!propState._isLooping) {
					propState._isLooping = true; // Set flag
					setTimeout(() => {
						// Check if still at the end and flag is set
						if (currentBeat === totalBeats && propState._isLooping) {
							propState._isLooping = false; // Reset flag
							currentBeat = 0;
							lastTimestamp = null; // Reset timestamp for loop

							// --- Crucial: Reset the initialized flag for BOTH props ---
							// This forces the engine to use the JSON start_loc/ori for the first step again
							// NO! This is wrong for looping. We WANT to preserve the end state.
							// bluePropState._initialized = undefined;
							// redPropState._initialized = undefined;

							// --- Instead, preserve the final angles ---
							bluePropState.centerPathAngle = finalBlueCenterAngle;
							bluePropState.staffRotationAngle = finalBlueStaffAngle;
							redPropState.centerPathAngle = finalRedCenterAngle;
							redPropState.staffRotationAngle = finalRedStaffAngle;

							// --- Ensure start angles for the first step are set correctly on loop ---
							// The AnimationEngine's t=0 logic for initialized props handles this now.

							play(); // Restart animation
							console.log('Looping back to beginning with preserved angles');
						} else {
							propState._isLooping = false; // Reset flag if state changed
						}
					}, 1000); // Wait 1 second before looping
				}
			}
		}

		// Calculate prop states for the current beat
		// --- Pass totalBeats to calculateState ---
		AnimationEngine.calculateState(
			currentBeat,
			parsedSteps,
			bluePropState,
			redPropState,
			totalBeats
		);

		// Render frame
		if (canvasRenderer && canRender) {
			canvasRenderer.render();
		}

		// Request next frame only if still playing
		if (isPlaying) {
			animationFrameId = requestAnimationFrame(animationLoop);
		}
	}

	/**
	 * Starts the animation
	 */
	function play() {
		if (isPlaying || totalBeats === 0) return; // Don't play if already playing or no beats
		console.log('Play triggered');
		isPlaying = true;
		lastTimestamp = null; // Reset timestamp for accurate delta on first frame
		// Clear any pending loop timeout
		if (propState._isLooping) {
			// This check might need a different approach if setTimeout ID isn't stored
			console.log('Clearing potential loop timeout on play');
			propState._isLooping = false;
		}
		animationFrameId = requestAnimationFrame(animationLoop);
	}

	/**
	 * Pauses the animation
	 */
	function pause() {
		if (!isPlaying) return;
		console.log('Pause triggered');
		isPlaying = false;
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		// Also clear the looping flag if paused manually during the timeout
		propState._isLooping = false;
	}

	/**
	 * Stops the animation and resets to the beginning
	 */
	function reset() {
		console.log('Reset triggered');
		pause(); // Ensure animation is stopped
		resetAnimationState();
	}

	// Internal state object to hold looping flag
	let propState = { _isLooping: false };

	/**
	 * Resets the animation state to the beginning
	 */
	function resetAnimationState() {
		console.log('Resetting animation state...');
		currentBeat = 0;
		lastTimestamp = null;
		propState._isLooping = false; // Ensure looping flag is reset

		// --- Crucial: Reset the initialized flag for BOTH props on explicit reset ---
		// This forces the engine to use the JSON start_loc/ori for the first step again.
		bluePropState._initialized = undefined;
		redPropState._initialized = undefined;

		// Clear internal step angles as well
		bluePropState._stepStartCenterPathAngle = undefined;
		bluePropState._stepTargetCenterPathAngle = undefined;
		bluePropState._stepStartStaffRotationAngle = undefined;
		bluePropState._stepTargetStaffRotationAngle = undefined;

		redPropState._stepStartCenterPathAngle = undefined;
		redPropState._stepTargetCenterPathAngle = undefined;
		redPropState._stepStartStaffRotationAngle = undefined;
		redPropState._stepTargetStaffRotationAngle = undefined;

		// Calculate initial state using beat 0
		// Pass totalBeats here
		AnimationEngine.calculateState(0, parsedSteps, bluePropState, redPropState, totalBeats);
		console.log('Initial state calculated after reset:', {
			blue: { ...bluePropState },
			red: { ...redPropState }
		});

		// Render initial state if possible
		// Use a slight delay to ensure the engine calculation completes? Maybe not needed.
		if (canvasRenderer && canRender) {
			console.log('Rendering initial state after reset');
			canvasRenderer.render();
		} else {
			console.log(
				'Cannot render initial state - canvasRenderer:',
				!!canvasRenderer,
				'canRender:',
				canRender
			);
		}
	}

	/**
	 * Updates the animation speed
	 */
	function updateSpeed(newSpeed: number) {
		speed = newSpeed;
	}

	/**
	 * Checks if the sequence can be continuously looped
	 * A sequence can be continuously looped if the final position and orientation
	 * of both props match their initial position and orientation
	 */
	function checkContinuousLoopability() {
		if (parsedSteps.length < 2) {
			canContinuousLoop = false;
			return;
		}

		try {
			// Get the first and last steps
			const firstStep = parsedSteps[0] as any;
			const lastStep = parsedSteps[parsedSteps.length - 1] as any;

			// Determine which format the sequence data is in
			const isNewFormat = 'blue_prop' in firstStep && 'red_prop' in firstStep;
			const isOldFormat = 'blue_attributes' in firstStep && 'red_attributes' in firstStep;

			if (!isNewFormat && !isOldFormat) {
				console.warn('Unknown sequence data format for continuous loop check');
				canContinuousLoop = false;
				continuousLoop = false;
				return;
			}

			let blueMatches = false;
			let redMatches = false;

			if (isNewFormat) {
				// New format with blue_prop and red_prop
				blueMatches =
					lastStep.blue_prop.location === firstStep.blue_prop.location &&
					(!lastStep.blue_prop.orientation ||
						!firstStep.blue_prop.orientation ||
						lastStep.blue_prop.orientation === firstStep.blue_prop.orientation);

				redMatches =
					lastStep.red_prop.location === firstStep.red_prop.location &&
					(!lastStep.red_prop.orientation ||
						!firstStep.red_prop.orientation ||
						lastStep.red_prop.orientation === firstStep.red_prop.orientation);
			} else {
				// Old format with blue_attributes and red_attributes
				blueMatches =
					lastStep.blue_attributes.end_loc === firstStep.blue_attributes.start_loc &&
					(!lastStep.blue_attributes.end_ori ||
						!firstStep.blue_attributes.start_ori ||
						lastStep.blue_attributes.end_ori === firstStep.blue_attributes.start_ori);

				redMatches =
					lastStep.red_attributes.end_loc === firstStep.red_attributes.start_loc &&
					(!lastStep.red_attributes.end_ori ||
						!firstStep.red_attributes.start_ori ||
						lastStep.red_attributes.end_ori === firstStep.red_attributes.start_ori);
			}

			canContinuousLoop = blueMatches && redMatches;
			console.log(`Sequence can${canContinuousLoop ? '' : 'not'} be continuously looped`);

			// If we can't continuously loop, make sure the option is disabled
			if (!canContinuousLoop) {
				continuousLoop = false;
			}
		} catch (err) {
			console.warn('Error checking continuous loopability:', err);
			canContinuousLoop = false;
			continuousLoop = false;
		}
	}

	/**
	 * Handles the continuous loop toggle change
	 */
	function handleContinuousLoopChange(enabled: boolean) {
		continuousLoop = enabled;
		console.log(`Continuous loop ${enabled ? 'enabled' : 'disabled'}`);
	}

	/**
	 * Handles the imagesLoaded event from the CanvasRenderer
	 */
	function handleImagesLoaded() {
		console.log('Images loaded, setting canRender=true');
		canRender = true;
		// Re-calculate and render initial state now that we can render
		resetAnimationState();
	}

	/**
	 * Handles errors from the CanvasRenderer
	 */
	function handleError(event: CustomEvent) {
		error = event.detail.message;
		canRender = false; // Prevent rendering if images failed
		console.error('Canvas Renderer Error:', error);
	}

	// Clean up on component destruction
	onDestroy(() => {
		console.log('SequenceAnimator destroyed, cancelling animation frame');
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}
		// Clear any potential looping timeout
		propState._isLooping = false; // Might need to store and clear timeout ID
	});

	// Reactive calculations using totalBeats
	$: displayedBeat =
		isPlaying || currentBeat > 0 ? Math.min(Math.floor(currentBeat) + 1, totalBeats) : 0;
	$: currentStepIndex = totalBeats > 0 ? Math.min(Math.floor(currentBeat), totalBeats - 1) : 0;
	$: currentStep =
		totalBeats > 0 && parsedSteps.length > currentStepIndex
			? parsedSteps[currentStepIndex]
			: undefined;
	$: progressPercent =
		totalBeats > 0 && (isPlaying || currentBeat > 0)
			? Math.min(100, (currentBeat / totalBeats) * 100)
			: 0;
</script>

<div class="sequence-animator {isPlaying ? 'playing' : ''}">
	<div class="animation-container">
		<CanvasRenderer
			bind:this={canvasRenderer}
			{width}
			{height}
			{bluePropState}
			{redPropState}
			on:imagesLoaded={handleImagesLoaded}
			on:error={handleError}
		/>
	</div>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	<AnimationControls
		{isPlaying}
		{speed}
		{continuousLoop}
		{canContinuousLoop}
		onPlay={play}
		onPause={pause}
		onReset={reset}
		onSpeedChange={updateSpeed}
		onContinuousLoopChange={handleContinuousLoopChange}
		disabled={totalBeats === 0 || !!error}
	/>
</div>

<style>
	.sequence-animator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.animation-container {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-xl);
		width: 100%;
		justify-content: center;
		flex-wrap: wrap;
	}

	.error-message {
		color: var(--error-color);
		font-weight: 600;
		margin-top: var(--spacing-md);
		padding: var(--spacing-md);
		background-color: var(--surface-color);
		border: 1px solid var(--error-color);
		border-radius: var(--border-radius-md);
		text-align: center;
		width: 100%;
		max-width: 800px;
		box-sizing: border-box;
		box-shadow: var(--shadow-md);
		border-left: 4px solid var(--error-color);
		animation: fadeIn var(--transition-normal);
	}

	@media (max-width: 900px) {
		.animation-container {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
