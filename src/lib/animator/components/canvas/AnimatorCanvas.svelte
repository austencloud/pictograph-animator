<script lang="ts">
	import type { PropState } from '../../types/core.js';
	import { svgStringToImage } from '../../svgStringToImage.js';
	import { PROP_COLORS, CANVAS_COLORS } from '../../constants/colors.js';
	import { ANIMATION_CONSTANTS } from '../../constants/animation.js';

	// Modern Svelte 5 props
	let {
		blueProp,
		redProp,
		width = 500,
		height = 500,
		gridVisible = true
	}: {
		blueProp: PropState;
		redProp: PropState;
		width?: number;
		height?: number;
		gridVisible?: boolean;
	} = $props();

	let canvasElement: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let gridImage: HTMLImageElement | null = null;
	let blueStaffImage: HTMLImageElement | null = null;
	let redStaffImage: HTMLImageElement | null = null;
	let imagesLoaded = $state(false);
	let rafId: number | null = null;
	let needsRender = $state(true);

	// SVG markup for grid and props using constants
	const gridSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="-250 -250 500 500">
    <circle cx="0" cy="0" r="200" fill="none" stroke="${CANVAS_COLORS.GRID}" stroke-width="1" />
    <circle cx="0" cy="0" r="5" fill="${CANVAS_COLORS.CENTER_DOT}" />
    <line x1="-200" y1="0" x2="200" y2="0" stroke="${CANVAS_COLORS.GRID}" stroke-width="1" />
    <line x1="0" y1="-200" x2="0" y2="200" stroke="${CANVAS_COLORS.GRID}" stroke-width="1" />
    <text x="205" y="15" fill="${CANVAS_COLORS.LABELS}" font-family="sans-serif" font-size="14">E</text>
    <text x="-215" y="15" fill="${CANVAS_COLORS.LABELS}" font-family="sans-serif" font-size="14">W</text>
    <text x="-5" y="-205" fill="${CANVAS_COLORS.LABELS}" font-family="sans-serif" font-size="14">N</text>
    <text x="-5" y="220" fill="${CANVAS_COLORS.LABELS}" font-family="sans-serif" font-size="14">S</text>
  </svg>`;

	const blueStaffSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="-50 -50 100 100">
    <rect x="-40" y="-2.5" width="80" height="5" fill="${PROP_COLORS.BLUE}" rx="2" ry="2" />
    <circle cx="0" cy="0" r="4" fill="#1565C0" />
  </svg>`;

	const redStaffSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="-50 -50 100 100">
    <rect x="-40" y="-2.5" width="80" height="5" fill="${PROP_COLORS.RED}" rx="2" ry="2" />
    <circle cx="0" cy="0" r="4" fill="#B71C1C" />
  </svg>`;

	// Track prop changes to trigger re-renders
	$effect(() => {
		// This effect runs when blueProp or redProp changes
		blueProp;
		redProp;
		gridVisible;
		needsRender = true;
		startRenderLoop(); // Start the render loop when changes occur
	});

	// Load SVG images and handle lifecycle with $effect
	$effect(() => {
		const loadImages = async () => {
			try {
				[gridImage, blueStaffImage, redStaffImage] = await Promise.all([
					svgStringToImage(gridSvg, width, height),
					svgStringToImage(
						blueStaffSvg,
						ANIMATION_CONSTANTS.STAFF_WIDTH,
						ANIMATION_CONSTANTS.STAFF_HEIGHT
					),
					svgStringToImage(
						redStaffSvg,
						ANIMATION_CONSTANTS.STAFF_WIDTH,
						ANIMATION_CONSTANTS.STAFF_HEIGHT
					)
				]);

				ctx = canvasElement.getContext('2d');
				imagesLoaded = true;
				needsRender = true;

				// Start optimized render loop
				startRenderLoop();
			} catch (err) {
				console.error('Failed to load SVG images:', err);
			}
		};

		if (canvasElement) {
			loadImages();
		}

		// Cleanup function
		return () => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}
		};
	});

	// Optimized render loop - only renders when needed
	function renderLoop(): void {
		if (!ctx || !imagesLoaded) return;

		if (needsRender) {
			render();
			needsRender = false;
			// Continue the loop only if we rendered something
			rafId = requestAnimationFrame(renderLoop);
		} else {
			// Stop the loop when no rendering is needed
			rafId = null;
		}
	}

	// Start render loop when needed
	function startRenderLoop(): void {
		if (rafId === null && ctx && imagesLoaded) {
			rafId = requestAnimationFrame(renderLoop);
		}
	}

	// Actual render function
	function render(): void {
		if (!ctx || !imagesLoaded) return;

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		// Draw grid if visible
		if (gridVisible && gridImage) {
			ctx.drawImage(gridImage, 0, 0, width, height);
		}

		// Center transform
		const centerX = width / 2;
		const centerY = height / 2;

		// Draw props
		if (blueStaffImage) {
			drawProp(ctx, blueStaffImage, blueProp, centerX, centerY);
		}

		if (redStaffImage) {
			drawProp(ctx, redStaffImage, redProp, centerX, centerY);
		}
	}

	// Draw a prop on canvas
	function drawProp(
		context: CanvasRenderingContext2D,
		image: HTMLImageElement,
		prop: PropState,
		centerX: number,
		centerY: number
	): void {
		const scale = ANIMATION_CONSTANTS.DEFAULT_PROP_SCALE;
		context.save();

		// Translate to center
		context.translate(centerX, centerY);

		// Move to prop position on path (circle)
		const pathRadius = width * ANIMATION_CONSTANTS.DEFAULT_PATH_RADIUS_RATIO;
		const x = Math.cos(prop.centerPathAngle) * pathRadius;
		const y = Math.sin(prop.centerPathAngle) * pathRadius;
		context.translate(x, y);

		// Rotate staff
		context.rotate(prop.staffRotationAngle);

		// Draw staff centered on rotation point
		const drawWidth = image.width * scale;
		const drawHeight = image.height * scale;
		context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

		context.restore();
	}
</script>

<canvas bind:this={canvasElement} {width} {height} style="width: {width}px; height: {height}px;"
></canvas>

<style>
	canvas {
		border: 1px solid var(--border-color, #ddd);
		border-radius: 4px;
		background: var(--canvas-background, white);
	}
</style>
