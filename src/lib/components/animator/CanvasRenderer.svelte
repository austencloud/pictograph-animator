<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import type { PropState } from '../../types/sequence';
	import { GRID_VIEWBOX_SIZE, GRID_HALFWAY_POINT_OFFSET } from '../../utils/gridMapping';
	import { PropRenderer } from './PropRenderer';
	import { ImageLoader } from './ImageLoader';

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
	let isLoading = true;
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
			isLoading = false;
			return;
		}

		// Load images
		try {
			isLoading = true;
			const images = await ImageLoader.loadImages();
			gridImage = images.gridImage;
			blueStaffImage = images.blueStaffImage;
			redStaffImage = images.redStaffImage;
			imagesLoaded = true;
			isLoading = false;

			// Notify parent that images are loaded
			dispatch('imagesLoaded');

			// Initial render
			render();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load images';
			isLoading = false;
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

<div class="canvas-container" class:is-loading={isLoading} class:has-error={loadError}>
	<canvas bind:this={canvasElement} {width} {height} style="width: {width}px; height: {height}px;"
	></canvas>

	{#if isLoading}
		<div class="loading-overlay" transition:fade={{ duration: 300 }}>
			<div class="loading-spinner"></div>
			<p class="loading-text">Preparing canvas...</p>
		</div>
	{/if}

	{#if loadError}
		<div class="error-message" in:fly={{ y: 20, duration: 300 }}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="12" y1="8" x2="12" y2="12"></line>
				<line x1="12" y1="16" x2="12.01" y2="16"></line>
			</svg>
			<span>{loadError}</span>
		</div>
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

	.canvas-container.is-loading {
		cursor: wait;
	}

	.canvas-container.has-error {
		border: 1px solid var(--error-color);
		box-shadow: 0 0 0 1px var(--error-color-focus);
	}

	canvas {
		border: 1px solid var(--border-color);
		background-color: var(--surface-color);
		display: block;
		transition:
			background-color var(--transition-normal),
			border-color var(--transition-normal),
			opacity var(--transition-normal);
	}

	.is-loading canvas {
		opacity: 0.7;
		filter: blur(2px);
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: rgba(var(--surface-color-rgb), 0.7);
		backdrop-filter: blur(4px);
		z-index: 10;
	}

	.loading-text {
		margin-top: var(--spacing-md);
		color: var(--text-color);
		font-weight: 500;
		text-align: center;
		animation: pulse 2s infinite;
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
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.error-message svg {
		flex-shrink: 0;
		color: var(--error-color);
		animation: pulse 2s infinite;
	}
</style>
