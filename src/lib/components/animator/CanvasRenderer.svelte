<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { PropState } from '../../types/sequence.js';
	import { GRID_VIEWBOX_SIZE, GRID_HALFWAY_POINT_OFFSET } from '../../utils/gridMapping.js';
	import { PropRenderer } from './PropRenderer.js';
	import { ImageLoader } from './ImageLoader.js';

	// Props
	export let width: number = 600;
	export let height: number = 600;
	export let bluePropState: PropState;
	export let redPropState: PropState;

	// Canvas and context references
	let canvasElement: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	// Image state
	let gridImage: HTMLImageElement;
	let blueStaffImage: HTMLImageElement;
	let redStaffImage: HTMLImageElement;
	let imagesLoaded = false;
	let loadError = '';

	// Calculated values
	let canvasSize = Math.min(width, height);
	let gridScaleFactor = canvasSize / GRID_VIEWBOX_SIZE;
	let scaledHalfwayRadius = GRID_HALFWAY_POINT_OFFSET * gridScaleFactor;

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Initialize on mount
	onMount(async () => {
		// Check if we're running in a browser environment
		const isBrowser = typeof window !== 'undefined';
		if (!isBrowser) return;

		if (!canvasElement) return;

		ctx = canvasElement.getContext('2d');
		if (!ctx) {
			loadError = 'Canvas context could not be created';
			return;
		}

		// Load images
		try {
			const images = await ImageLoader.loadImages();
			gridImage = images.gridImage;
			blueStaffImage = images.blueStaffImage;
			redStaffImage = images.redStaffImage;
			imagesLoaded = true;

			// Notify parent that images are loaded
			dispatch('imagesLoaded');

			// Initial render
			render();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load images';
			dispatch('error', { message: loadError });
		}
	});

	// Watch for changes in canvas size
	$: if (width && height) {
		canvasSize = Math.min(width, height);
		gridScaleFactor = canvasSize / GRID_VIEWBOX_SIZE;
		scaledHalfwayRadius = GRID_HALFWAY_POINT_OFFSET * gridScaleFactor;

		// Update prop positions based on new scale
		if (bluePropState && redPropState) {
			updatePropPositions();
		}

		// Resize canvas if it exists
		if (canvasElement && ctx) {
			resizeCanvas();
		}
	}

	// Watch for changes in prop states
	$: if (imagesLoaded && ctx && bluePropState && redPropState) {
		updatePropPositions();
		render();
	}

	/**
	 * Updates the x,y positions of props based on their angles and the current scale
	 */
	function updatePropPositions() {
		const centerX = width / 2;
		const centerY = height / 2;

		// Move the center points slightly inward (95% of the full radius)
		const inwardFactor = 0.95; // 5% inward adjustment

		// Update Blue Prop position
		bluePropState.x =
			centerX + Math.cos(bluePropState.centerPathAngle) * scaledHalfwayRadius * inwardFactor;
		bluePropState.y =
			centerY + Math.sin(bluePropState.centerPathAngle) * scaledHalfwayRadius * inwardFactor;

		// Update Red Prop position
		redPropState.x =
			centerX + Math.cos(redPropState.centerPathAngle) * scaledHalfwayRadius * inwardFactor;
		redPropState.y =
			centerY + Math.sin(redPropState.centerPathAngle) * scaledHalfwayRadius * inwardFactor;
	}

	/**
	 * Resizes the canvas and updates scale factors
	 */
	function resizeCanvas() {
		if (!canvasElement || !ctx) return;

		canvasElement.width = width;
		canvasElement.height = height;

		// Redraw if images are loaded
		if (imagesLoaded) {
			render();
		}
	}

	/**
	 * Renders the current state to the canvas
	 */
	export function render() {
		if (!ctx || !imagesLoaded) return;

		ctx.clearRect(0, 0, width, height);

		// Draw grid
		PropRenderer.drawGrid(ctx, gridImage, width, height, canvasSize);

		// Draw props
		PropRenderer.drawStaff(
			ctx,
			blueStaffImage,
			bluePropState,
			width,
			height,
			scaledHalfwayRadius,
			gridScaleFactor
		);

		PropRenderer.drawStaff(
			ctx,
			redStaffImage,
			redPropState,
			width,
			height,
			scaledHalfwayRadius,
			gridScaleFactor
		);
	}
</script>

<div class="canvas-container">
	<canvas bind:this={canvasElement} {width} {height} style="width: {width}px; height: {height}px;"
	></canvas>

	{#if loadError}
		<div class="error-message">{loadError}</div>
	{/if}
</div>

<style>
	.canvas-container {
		position: relative;
		display: inline-block;
		border-radius: var(--border-radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-md);
		transition: all var(--transition-normal);
	}

	.canvas-container:hover {
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
	}

	canvas {
		border: 1px solid var(--border-color);
		background-color: var(--surface-color);
		display: block;
		transition:
			background-color var(--transition-normal),
			border-color var(--transition-normal);
	}

	.error-message {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: var(--error-color);
		font-weight: 600;
		background-color: var(--surface-color);
		padding: var(--spacing-md);
		border-radius: var(--border-radius-md);
		box-shadow: var(--shadow-md);
		border-left: 4px solid var(--error-color);
		max-width: 80%;
		text-align: center;
		animation: fadeIn var(--transition-normal);
	}
</style>
