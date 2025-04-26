<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { SequenceData, SequenceStep, PropState } from '../../types/sequence.js';
	import { AnimationEngine } from './AnimationEngine.js';
	import CanvasRenderer from './CanvasRenderer.svelte';
	import AnimationControls from './AnimationControls.svelte';

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

	// Prop states
	let bluePropState: PropState = {
		centerPathAngle: 0,
		staffRotationAngle: 0,
		x: 0,
		y: 0,
		_stepStartStaffRotationAngle: 0,
		_stepTargetStaffRotationAngle: 0,
		_stepStartCenterPathAngle: 0,
		_stepTargetCenterPathAngle: 0
	};

	let redPropState: PropState = {
		centerPathAngle: 0,
		staffRotationAngle: 0,
		x: 0,
		y: 0,
		_stepStartStaffRotationAngle: 0,
		_stepTargetStaffRotationAngle: 0,
		_stepStartCenterPathAngle: 0,
		_stepTargetCenterPathAngle: 0
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
		parseSequence();
		resetAnimationState();
	}

	/**
	 * Parses the sequence data into a more usable format
	 */
	function parseSequence() {
		if (!sequenceData || sequenceData.length < 2) {
			error = 'Invalid sequence data';
			return;
		}

		// First element is metadata, rest are steps
		const steps = sequenceData.slice(1) as SequenceStep[];

		parsedSteps = steps.map((step) => {
			// Pre-calculate angles and other values for faster animation
			return {
				...step
				// Add any pre-calculated values here if needed
			};
		});

		// Calculate initial state
		AnimationEngine.calculateState(0, parsedSteps, bluePropState, redPropState);
	}

	/**
	 * Main animation loop
	 */
	function animationLoop(timestamp: number) {
		if (!isPlaying) return;

		// Calculate time delta and update current beat
		if (lastTimestamp === null) {
			lastTimestamp = timestamp;
		}

		const deltaTime = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		// Update current beat based on speed
		const previousBeat = currentBeat;
		currentBeat += (deltaTime / 1000) * speed;

		// Check if we've reached the end of the sequence
		if (currentBeat >= parsedSteps.length) {
			// Loop back to the beginning
			currentBeat = 0;
			lastTimestamp = null;

			// Reset prop states for the new loop
			bluePropState._stepStartCenterPathAngle = undefined;
			bluePropState._stepTargetCenterPathAngle = undefined;
			bluePropState._stepStartStaffRotationAngle = undefined;
			bluePropState._stepTargetStaffRotationAngle = undefined;

			redPropState._stepStartCenterPathAngle = undefined;
			redPropState._stepTargetCenterPathAngle = undefined;
			redPropState._stepStartStaffRotationAngle = undefined;
			redPropState._stepTargetStaffRotationAngle = undefined;
		}

		// Check if we've crossed a beat boundary
		const previousStepIndex = Math.floor(previousBeat);
		const currentStepIndex = Math.floor(currentBeat);

		if (currentStepIndex > previousStepIndex) {
			// We've crossed a beat boundary, so we need to update the start angles
			// for the new step based on the end angles of the previous step
			const prevStep = parsedSteps[previousStepIndex];
			const currentStep = parsedSteps[currentStepIndex];

			// Log for debugging
			console.log(`Transitioning from step ${previousStepIndex} to step ${currentStepIndex}`);
			console.log(
				`Blue: ${prevStep.blue_attributes.end_loc} -> ${currentStep.blue_attributes.start_loc}`
			);
			console.log(
				`Red: ${prevStep.red_attributes.end_loc} -> ${currentStep.red_attributes.start_loc}`
			);
		}

		// Calculate prop states for the current beat
		AnimationEngine.calculateState(currentBeat, parsedSteps, bluePropState, redPropState);

		// Render the current frame
		if (canvasRenderer && canRender) {
			canvasRenderer.render();
		}

		// Request next frame
		animationFrameId = requestAnimationFrame(animationLoop);
	}

	/**
	 * Starts the animation
	 */
	function play() {
		if (isPlaying) return;

		isPlaying = true;
		lastTimestamp = null;
		animationFrameId = requestAnimationFrame(animationLoop);
	}

	/**
	 * Pauses the animation
	 */
	function pause() {
		isPlaying = false;

		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	}

	/**
	 * Stops the animation and resets to the beginning
	 */
	function reset() {
		pause();
		resetAnimationState();
	}

	/**
	 * Resets the animation state to the beginning
	 */
	function resetAnimationState() {
		currentBeat = 0;
		lastTimestamp = null;

		// Calculate initial state
		AnimationEngine.calculateState(0, parsedSteps, bluePropState, redPropState);

		// Render the initial state
		if (canvasRenderer && canRender) {
			canvasRenderer.render();
		}
	}

	/**
	 * Updates the animation speed
	 */
	function updateSpeed(newSpeed: number) {
		speed = newSpeed;
	}

	/**
	 * Handles the imagesLoaded event from the CanvasRenderer
	 */
	function handleImagesLoaded() {
		canRender = true;
		resetAnimationState();
	}

	/**
	 * Handles errors from the CanvasRenderer
	 */
	function handleError(event: CustomEvent) {
		error = event.detail.message;
	}

	// Clean up on component destruction
	onDestroy(() => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}
	});
</script>

<div class="sequence-animator">
	<CanvasRenderer
		bind:this={canvasRenderer}
		{width}
		{height}
		{bluePropState}
		{redPropState}
		on:imagesLoaded={handleImagesLoaded}
		on:error={handleError}
	/>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	<AnimationControls
		{isPlaying}
		{speed}
		onPlay={play}
		onPause={pause}
		onReset={reset}
		onSpeedChange={updateSpeed}
	/>
</div>

<style>
	.sequence-animator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.error-message {
		color: red;
		font-weight: bold;
		margin-top: 1rem;
	}
</style>
