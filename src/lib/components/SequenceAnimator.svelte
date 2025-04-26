<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { SequenceData, SequenceStep, PropState } from '../types/sequence.js';
	import {
		GRID_CENTER,
		GRID_VIEWBOX_SIZE,
		GRID_HALFWAY_POINT_OFFSET,
		STAFF_VIEWBOX_WIDTH,
		STAFF_VIEWBOX_HEIGHT,
		STAFF_CENTER_X,
		STAFF_CENTER_Y,
		PI,
		TWO_PI,
		HALF_PI,
		mapPositionToAngle,
		mapOrientationToAngle,
		normalizeAnglePositive
	} from '../utils/gridMapping.js';
	import { lerp, lerpAngle } from '../utils/animationUtils.js';

	// Props
	export let sequenceData: SequenceData;
	export let width: number = 600;
	export let height: number = 600;
	export let speed: number = 1.0;

	// SVG strings for grid and staff
	const gridSvgString = `
        <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
             viewBox="0 0 950 950" style="enable-background:new 0 0 950 950; background-color: #ffffff;" xml:space="preserve">
        <g id="outer_points"><circle fill="#000000" cx="475" cy="175" r="25"/><circle fill="#000000" cx="775" cy="475" r="25"/><circle fill="#000000" cx="475" cy="775" r="25"/><circle fill="#000000" cx="175" cy="475" r="25"/></g>
        <g id="halfway_points"><circle fill="#000000" cx="475" cy="323.5" r="8"/><circle fill="#000000" cx="626.5" cy="475" r="8"/><circle fill="#000000" cx="475" cy="626.5" r="8"/><circle fill="#000000" cx="323.5" cy="475" r="8"/></g>
        <g id="center_group"><circle fill="#000000" cx="475" cy="475" r="12"/></g>
        </svg>
    `;

	const staffBaseSvgString = (fillColor: string) => `
        <svg version="1.1" id="staff" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
             viewBox="0 0 252.8 77.8" style="enable-background:new 0 0 252.8 77.8;" xml:space="preserve">
        <path fill="${fillColor}" stroke="#555555" stroke-width="1" stroke-miterlimit="10" d="M251.4,67.7V10.1c0-4.8-4.1-8.7-9.1-8.7s-9.1,3.9-9.1,8.7v19.2H10.3c-4.9,0-8.9,3.8-8.9,8.5V41 c0,4.6,4,8.5,8.9,8.5h222.9v18.2c0,4.8,4.1,8.7,9.1,8.7S251.4,72.5,251.4,67.7z"/>
        <circle id="centerPoint" fill="#FF0000" cx="126.4" cy="38.9" r="5" />
        </svg>
    `;

	const blueColor = '#0072BC'; // CMYK Blue Approx for Blue Prop
	const redColor = '#ED1C24'; // CMYK Red Approx for Red Prop

	// Canvas and context references
	let canvasElement: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	// Animation state
	let animationFrameId: number | null = null;
	let isPlaying = false;
	let currentBeat = 0;
	let lastTimestamp: number | null = null;

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

	// Image loading state
	let gridImage: HTMLImageElement;
	let staffImageA: HTMLImageElement; // Blue Prop
	let staffImageB: HTMLImageElement; // Red Prop
	let gridImageLoaded = false;
	let staffImageALoaded = false;
	let staffImageBLoaded = false;
	let loadError = '';
	let imagesToLoad = 3;

	// Calculated values
	let canvasSize = Math.min(width, height);
	let gridScaleFactor = canvasSize / GRID_VIEWBOX_SIZE;
	let scaledHalfwayRadius = GRID_HALFWAY_POINT_OFFSET * gridScaleFactor;

	// Parsed sequence
	let parsedSteps: SequenceStep[] = [];

	// Initialize on mount
	onMount(() => {
		// Check if we're running in a browser environment
		const isBrowser = typeof window !== 'undefined';
		if (!isBrowser) return;

		if (!canvasElement) return;

		ctx = canvasElement.getContext('2d');
		if (!ctx) {
			loadError = 'Canvas context could not be created';
			drawErrorMessage();
			return;
		}

		// Load images
		loadImages();

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

	// Watch for changes in canvas size
	$: if (width && height) {
		canvasSize = Math.min(width, height);
		gridScaleFactor = canvasSize / GRID_VIEWBOX_SIZE;
		scaledHalfwayRadius = GRID_HALFWAY_POINT_OFFSET * gridScaleFactor;
		resizeCanvas();
	}

	// Watch for changes in speed
	$: if (speed) {
		// Speed is used directly in the animationLoop function
		// No need to store it in a separate variable
	}

	/**
	 * Loads all required images from SVG strings
	 */
	function loadImages() {
		// Initialize Image objects (browser-only)
		gridImage = new Image();
		staffImageA = new Image();
		staffImageB = new Image();

		// Convert SVG strings to data URLs
		const gridSvgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(gridSvgString);
		const blueStaffSvgDataUrl =
			'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(staffBaseSvgString(blueColor));
		const redStaffSvgDataUrl =
			'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(staffBaseSvgString(redColor));

		// Load grid image
		gridImage.onload = () => {
			gridImageLoaded = true;
			checkAllImagesLoaded();
		};
		gridImage.onerror = () => {
			loadError = 'Failed to load grid image';
		};
		gridImage.src = gridSvgDataUrl;

		// Load blue staff image
		staffImageA.onload = () => {
			staffImageALoaded = true;
			checkAllImagesLoaded();
		};
		staffImageA.onerror = () => {
			loadError = 'Failed to load blue staff image';
		};
		staffImageA.src = blueStaffSvgDataUrl;

		// Load red staff image
		staffImageB.onload = () => {
			staffImageBLoaded = true;
			checkAllImagesLoaded();
		};
		staffImageB.onerror = () => {
			loadError = 'Failed to load red staff image';
		};
		staffImageB.src = redStaffSvgDataUrl;
	}

	/**
	 * Checks if all images are loaded and initializes the animation
	 */
	function checkAllImagesLoaded() {
		if (gridImageLoaded && staffImageALoaded && staffImageBLoaded) {
			resizeCanvas();
			drawInitialState();
			resetAnimationState();
		}
	}

	/**
	 * Resizes the canvas and updates scale factors
	 */
	function resizeCanvas() {
		if (!canvasElement || !ctx) return;

		canvasElement.width = width;
		canvasElement.height = height;

		// Recalculate scale factors
		canvasSize = Math.min(width, height);
		gridScaleFactor = canvasSize / GRID_VIEWBOX_SIZE;
		scaledHalfwayRadius = GRID_HALFWAY_POINT_OFFSET * gridScaleFactor;

		// Redraw if all images are loaded
		if (gridImageLoaded && staffImageALoaded && staffImageBLoaded) {
			drawInitialState();
		}
	}

	/**
	 * Draws the initial state with the grid
	 */
	function drawInitialState() {
		if (!ctx || !gridImageLoaded) return;

		ctx.clearRect(0, 0, width, height);

		// Draw grid centered in the canvas
		const gridX = (width - canvasSize) / 2;
		const gridY = (height - canvasSize) / 2;
		ctx.drawImage(gridImage, gridX, gridY, canvasSize, canvasSize);

		// Calculate initial prop states
		calculateState(0);

		// Draw props in their initial positions
		drawStaff(staffImageA, bluePropState);
		drawStaff(staffImageB, redPropState);
	}

	/**
	 * Draws an error message on the canvas
	 * Used when there's an error loading images or parsing sequence data
	 */
	function drawErrorMessage() {
		if (!ctx) return;

		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = 'red';
		ctx.font = '16px Arial';
		ctx.textAlign = 'center';
		ctx.fillText(loadError, width / 2, height / 2);
	}

	/**
	 * Draws a staff with the given state
	 */
	function drawStaff(staffImage: HTMLImageElement, propState: PropState) {
		if (!ctx) return;

		const centerX = width / 2;
		const centerY = height / 2;

		// Calculate position based on centerPathAngle and halfway radius
		const x = centerX + Math.cos(propState.centerPathAngle) * scaledHalfwayRadius;
		const y = centerY + Math.sin(propState.centerPathAngle) * scaledHalfwayRadius;

		// Calculate staff dimensions
		const staffWidth = STAFF_VIEWBOX_WIDTH * gridScaleFactor * 0.5; // Scale down for better visuals
		const staffHeight = STAFF_VIEWBOX_HEIGHT * gridScaleFactor * 0.5;

		// Save current context state
		ctx.save();

		// Translate to the prop's position
		ctx.translate(x, y);

		// Rotate by the staff rotation angle
		ctx.rotate(propState.staffRotationAngle);

		// Draw the staff centered on its rotation point
		ctx.drawImage(
			staffImage,
			-STAFF_CENTER_X * gridScaleFactor * 0.5, // Adjust for the staff's center point
			-STAFF_CENTER_Y * gridScaleFactor * 0.5,
			staffWidth,
			staffHeight
		);

		// Restore context state
		ctx.restore();
	}

	/**
	 * Parses the sequence data into a more usable format
	 */
	function parseSequence() {
		if (!sequenceData || sequenceData.length < 2) {
			loadError = 'Invalid sequence data';
			return;
		}

		// First element is metadata, rest are steps
		// const metadata = sequenceData[0]; // Metadata can be used for additional configuration
		const steps = sequenceData.slice(1) as SequenceStep[];

		parsedSteps = steps.map((step) => {
			// Pre-calculate angles and other values for faster animation
			return {
				...step
				// Add any pre-calculated values here if needed
			};
		});
	}

	/**
	 * Calculates the state of both props at a given beat
	 */
	function calculateState(beat: number) {
		if (parsedSteps.length === 0) return;

		// Find the current step based on the beat
		const stepIndex = Math.min(Math.floor(beat), parsedSteps.length - 1);
		const currentStep = parsedSteps[stepIndex];

		// Get the previous step (or use the first step's start state if we're at the beginning)
		const prevStep = stepIndex > 0 ? parsedSteps[stepIndex - 1] : null;

		// Calculate interpolation factor within the current step
		const stepBeat = beat - stepIndex;
		const t = Math.min(stepBeat, 1.0); // Clamp to [0, 1]

		// Calculate Blue Prop state
		calculatePropState(
			bluePropState,
			currentStep.blue_attributes,
			prevStep?.blue_attributes,
			t,
			stepIndex === 0
		);

		// Calculate Red Prop state
		calculatePropState(
			redPropState,
			currentStep.red_attributes,
			prevStep?.red_attributes,
			t,
			stepIndex === 0
		);

		// Update positions based on angles
		updatePropPosition(bluePropState);
		updatePropPosition(redPropState);
	}

	/**
	 * Calculates the state of a single prop
	 */
	function calculatePropState(
		propState: PropState,
		attributes: any,
		_prevAttributes: any | null, // Unused but kept for potential future use
		t: number,
		isFirstStep: boolean
	) {
		// Get start and end locations
		const startLoc = attributes.start_loc;
		const endLoc = attributes.end_loc;

		// Get motion type and rotation direction
		const motionType = attributes.motion_type;
		const rotDir = attributes.prop_rot_dir;
		const turns = attributes.turns || 0;

		// Get start and end orientations
		const startOri = attributes.start_ori;
		const endOri = attributes.end_ori;

		// If this is the first step or first frame, initialize the start angles
		if (isFirstStep && t === 0) {
			// Set initial center path angle based on start location
			propState._stepStartCenterPathAngle = mapPositionToAngle(startLoc);
			propState.centerPathAngle = propState._stepStartCenterPathAngle;

			// Set initial staff rotation angle based on start orientation or motion type
			if (startOri) {
				const oriAngle = mapOrientationToAngle(startOri);
				propState._stepStartStaffRotationAngle =
					oriAngle !== null ? oriAngle : propState._stepStartCenterPathAngle + PI; // Default to pointing toward center
			} else if (motionType === 'pro') {
				// Pro motion: staff points toward center
				propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle + PI;
			} else {
				// Default orientation
				propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle;
			}

			propState.staffRotationAngle = propState._stepStartStaffRotationAngle;
		}

		// Calculate target center path angle for this step
		propState._stepTargetCenterPathAngle = mapPositionToAngle(endLoc);

		// Calculate target staff rotation angle based on motion type
		if (motionType === 'pro') {
			// Pro motion: staff always points toward center
			propState._stepTargetStaffRotationAngle = propState._stepTargetCenterPathAngle + PI;
		} else if (motionType === 'anti') {
			// Anti motion: staff rotates based on rotation direction and turns
			const rotationMultiplier = rotDir === 'cw' ? -1 : 1; // CW is negative in canvas coords
			const totalRotation = TWO_PI * turns * rotationMultiplier;

			// If end orientation is specified, use it as the target
			if (endOri) {
				const oriAngle = mapOrientationToAngle(endOri);
				propState._stepTargetStaffRotationAngle =
					oriAngle !== null
						? oriAngle
						: (propState._stepStartStaffRotationAngle || 0) + totalRotation;
			} else {
				// Otherwise calculate based on start angle and total rotation
				propState._stepTargetStaffRotationAngle =
					(propState._stepStartStaffRotationAngle || 0) + totalRotation;
			}
		} else if (motionType === 'static') {
			// Static motion: staff maintains its orientation
			propState._stepTargetStaffRotationAngle = propState._stepStartStaffRotationAngle;
		} else if (motionType === 'dash') {
			// Dash motion: staff maintains its orientation but may have specific end orientation
			if (endOri) {
				const oriAngle = mapOrientationToAngle(endOri);
				propState._stepTargetStaffRotationAngle =
					oriAngle !== null ? oriAngle : propState._stepStartStaffRotationAngle;
			} else {
				propState._stepTargetStaffRotationAngle = propState._stepStartStaffRotationAngle;
			}
		}

		// Interpolate between start and target angles
		propState.centerPathAngle = lerpAngle(
			propState._stepStartCenterPathAngle || 0,
			propState._stepTargetCenterPathAngle || 0,
			t
		);

		propState.staffRotationAngle = lerpAngle(
			propState._stepStartStaffRotationAngle || 0,
			propState._stepTargetStaffRotationAngle || 0,
			t
		);

		// For the next step, the current end becomes the next start
		if (t === 1.0) {
			propState._stepStartCenterPathAngle = propState._stepTargetCenterPathAngle;
			propState._stepStartStaffRotationAngle = propState._stepTargetStaffRotationAngle;
		}
	}

	/**
	 * Updates the x,y position of a prop based on its centerPathAngle
	 */
	function updatePropPosition(propState: PropState) {
		const centerX = width / 2;
		const centerY = height / 2;

		propState.x = centerX + Math.cos(propState.centerPathAngle) * scaledHalfwayRadius;
		propState.y = centerY + Math.sin(propState.centerPathAngle) * scaledHalfwayRadius;
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
		currentBeat += (deltaTime / 1000) * speed;

		// Check if we've reached the end of the sequence
		if (currentBeat >= parsedSteps.length) {
			// Loop back to the beginning
			currentBeat = 0;
			lastTimestamp = null;
		}

		// Calculate prop states for the current beat
		calculateState(currentBeat);

		// Clear canvas and draw the current frame
		if (ctx) {
			ctx.clearRect(0, 0, width, height);

			// Draw grid
			const gridX = (width - canvasSize) / 2;
			const gridY = (height - canvasSize) / 2;
			ctx.drawImage(gridImage, gridX, gridY, canvasSize, canvasSize);

			// Draw props
			drawStaff(staffImageA, bluePropState); // Blue Prop
			drawStaff(staffImageB, redPropState); // Red Prop
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
	function stop() {
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
		calculateState(0);

		// Redraw the canvas
		if (ctx) {
			ctx.clearRect(0, 0, width, height);

			// Draw grid
			const gridX = (width - canvasSize) / 2;
			const gridY = (height - canvasSize) / 2;
			ctx.drawImage(gridImage, gridX, gridY, canvasSize, canvasSize);

			// Draw props
			drawStaff(staffImageA, bluePropState); // Blue Prop
			drawStaff(staffImageB, redPropState); // Red Prop
		}
	}

	// Clean up on component destruction
	onDestroy(() => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}
	});
</script>

<div class="sequence-animator">
	<canvas bind:this={canvasElement} {width} {height} style="width: {width}px; height: {height}px;"
	></canvas>

	{#if loadError}
		<div class="error-message">{loadError}</div>
	{/if}

	<div class="controls">
		<button on:click={play} disabled={isPlaying}>Play</button>
		<button on:click={pause} disabled={!isPlaying}>Pause</button>
		<button on:click={stop}>Reset</button>

		<div class="speed-control">
			<label for="speed-slider">Speed: {speed.toFixed(1)}x</label>
			<input id="speed-slider" type="range" min="0.1" max="3.0" step="0.1" bind:value={speed} />
		</div>
	</div>
</div>

<style>
	.sequence-animator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	canvas {
		border: 1px solid #ccc;
		background-color: #fff;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	button {
		padding: 0.5rem 1rem;
		background-color: #0072bc;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.speed-control {
		display: flex;
		flex-direction: column;
		margin-left: 1rem;
	}

	.error-message {
		color: red;
		font-weight: bold;
		margin-top: 1rem;
	}
</style>
