<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { SequenceData, SequenceStep, PropState } from '../../types/sequence.js';
	import { AnimationEngine } from './AnimationEngine.js';
	import CanvasRenderer from './CanvasRenderer.svelte';
	import AnimationControls from './AnimationControls.svelte';
	import MotionCompass from './MotionCompass.svelte';

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
		if (!sequenceData) {
			error = 'No sequence data provided';
			return;
		}

		if (sequenceData.length < 2) {
			error =
				'Invalid sequence data: Sequence has no steps. This may be due to using a placeholder or an invalid sequence.';
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

		// Calculate the time to advance
		let deltaTimeRemaining = deltaTime;
		const timePerBeat = 1000 / speed; // Time in ms for one beat at current speed

		// Advance the beat in smaller increments to avoid skipping steps
		while (deltaTimeRemaining > 0) {
			// Calculate how much to advance this iteration (max 1/4 of a beat)
			const maxAdvance = Math.min(timePerBeat / 4, deltaTimeRemaining);
			currentBeat += (maxAdvance / 1000) * speed;
			deltaTimeRemaining -= maxAdvance;

			// If we've reached the end of the sequence, stop advancing
			if (currentBeat >= parsedSteps.length) {
				break;
			}
		}

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
			// We've crossed a beat boundary
			// The AnimationEngine will handle maintaining continuity between steps
			// by using the end angles from the previous step as the start angles for the current step
			// Uncomment for debugging if needed
			// const prevStep = parsedSteps[previousStepIndex];
			// const currentStep = parsedSteps[currentStepIndex];
			// console.log(`Transitioning from step ${previousStepIndex} to step ${currentStepIndex}`);
			// console.log(`Blue: ${prevStep.blue_attributes.end_loc} -> ${currentStep.blue_attributes.start_loc}`);
			// console.log(`Red: ${prevStep.red_attributes.end_loc} -> ${currentStep.red_attributes.start_loc}`);
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

		<div class="beat-info-panel">
			<h3>Animation Info</h3>
			<div class="info-row">
				<span class="info-label">Current Beat:</span>
				<span class="info-value">{Math.floor(currentBeat) + 1}</span>
			</div>
			<div class="info-row">
				<span class="info-label">Total Beats:</span>
				<span class="info-value">{parsedSteps.length}</span>
			</div>
			<div class="info-row">
				<span class="info-label">Progress:</span>
				<div class="progress-bar">
					<div
						class="progress-fill"
						style="width: {Math.min(100, (currentBeat / parsedSteps.length) * 100)}%"
					></div>
				</div>
			</div>

			{#if parsedSteps.length > 0 && Math.floor(currentBeat) < parsedSteps.length}
				<div class="step-details">
					<h4>Current Step Details</h4>
					<div class="info-row">
						<span class="info-label">Letter:</span>
						<span class="info-value">{parsedSteps[Math.floor(currentBeat)]?.letter || 'N/A'}</span>
					</div>

					<!-- Blue Prop Info -->
					<div class="prop-info blue">
						<h5>Blue Prop</h5>
						<MotionCompass
							startLocation={parsedSteps[Math.floor(currentBeat)]?.blue_attributes?.start_loc ||
								'n'}
							endLocation={parsedSteps[Math.floor(currentBeat)]?.blue_attributes?.end_loc || 'n'}
							endOrientation={parsedSteps[Math.floor(currentBeat)]?.blue_attributes?.end_ori ||
								'in'}
							color="#2E3192"
							propName="Blue"
						/>
						<div class="info-row">
							<span class="info-label">Motion:</span>
							<span class="info-value"
								>{parsedSteps[Math.floor(currentBeat)]?.blue_attributes?.motion_type || 'N/A'}</span
							>
						</div>
					</div>

					<!-- Red Prop Info -->
					<div class="prop-info red">
						<h5>Red Prop</h5>
						<MotionCompass
							startLocation={parsedSteps[Math.floor(currentBeat)]?.red_attributes?.start_loc || 'n'}
							endLocation={parsedSteps[Math.floor(currentBeat)]?.red_attributes?.end_loc || 'n'}
							endOrientation={parsedSteps[Math.floor(currentBeat)]?.red_attributes?.end_ori || 'in'}
							color="#ED1C24"
							propName="Red"
						/>
						<div class="info-row">
							<span class="info-label">Motion:</span>
							<span class="info-value"
								>{parsedSteps[Math.floor(currentBeat)]?.red_attributes?.motion_type || 'N/A'}</span
							>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

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

	.animation-container {
		display: flex;
		align-items: flex-start;
		gap: 20px;
	}

	.beat-info-panel {
		width: 250px;
		background-color: #f5f5f5;
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 15px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.beat-info-panel h3 {
		margin-top: 0;
		margin-bottom: 15px;
		font-size: 18px;
		color: #333;
		border-bottom: 1px solid #ddd;
		padding-bottom: 8px;
	}

	.info-row {
		margin-bottom: 10px;
		display: flex;
		flex-direction: column;
	}

	.info-label {
		font-weight: bold;
		color: #555;
		margin-bottom: 3px;
	}

	.info-value {
		color: #333;
		text-transform: uppercase;
	}

	.progress-bar {
		height: 10px;
		background-color: #e0e0e0;
		border-radius: 5px;
		overflow: hidden;
		margin-top: 5px;
	}

	.progress-fill {
		height: 100%;
		background-color: #4caf50;
		transition: width 0.2s ease-in-out;
	}

	.step-details {
		margin-top: 15px;
		border-top: 1px solid #ddd;
		padding-top: 15px;
	}

	.step-details h4 {
		margin-top: 0;
		margin-bottom: 10px;
		font-size: 16px;
		color: #333;
	}

	.prop-info {
		margin-top: 15px;
		padding: 10px;
		border-radius: 4px;
		background-color: rgba(255, 255, 255, 0.7);
	}

	.prop-info h5 {
		margin-top: 0;
		margin-bottom: 8px;
		font-size: 14px;
	}

	.prop-info.blue h5 {
		color: #2e3192; /* HEX_BLUE */
	}

	.prop-info.red h5 {
		color: #ed1c24; /* HEX_RED */
	}

	.prop-info.blue {
		border-left: 4px solid #2e3192; /* HEX_BLUE */
	}

	.prop-info.red {
		border-left: 4px solid #ed1c24; /* HEX_RED */
	}

	/* Styles for the MotionCompass are defined in the component */

	.error-message {
		color: red;
		font-weight: bold;
		margin-top: 1rem;
	}

	@media (max-width: 768px) {
		.animation-container {
			flex-direction: column;
			align-items: center;
		}

		.beat-info-panel {
			width: 100%;
			max-width: 600px;
			margin-top: 15px;
		}
	}
</style>
