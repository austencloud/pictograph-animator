<script lang="ts">
	import type { PropState } from '../../types/core.js';
	import { svgStringToImage } from '../../svgStringToImage.js';
	import { PROP_COLORS } from '../../constants/colors.js';
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

	// Layer2 visibility state with localStorage persistence
	let layer2Visible = $state(false);

	// Dark mode detection
	let isDarkMode = $state(false);

	// Initialize from localStorage and detect dark mode
	$effect(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('grid-layer2-visible');
			layer2Visible = saved === 'true';
			isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
		}
	});

	// Save layer2 visibility to localStorage
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('grid-layer2-visible', layer2Visible.toString());
		}
	});

	// Watch for theme changes
	$effect(() => {
		if (typeof window !== 'undefined') {
			const observer = new MutationObserver(() => {
				isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
			});

			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme']
			});

			return () => observer.disconnect();
		}
	});

	let canvasElement: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let gridImage: HTMLImageElement | null = null;
	let blueStaffImage: HTMLImageElement | null = null;
	let redStaffImage: HTMLImageElement | null = null;
	let imagesLoaded = $state(false);
	let rafId: number | null = null;
	let needsRender = $state(true);

	// Function to generate theme-aware grid SVG
	function generateGridSvg(showLayer2: boolean, isDarkMode: boolean): string {
		const gridColor = isDarkMode ? '#ffffff' : '#000000';
		const layer2Color = showLayer2 ? gridColor : 'none';

		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 950 950">
			<g>
				<circle fill="${gridColor}" cx="475" cy="175" r="25"/>
				<circle fill="${gridColor}" cx="775" cy="475" r="25"/>
				<circle fill="${gridColor}" cx="475" cy="775" r="25"/>
				<circle fill="${gridColor}" cx="175" cy="475" r="25"/>
			</g>
			<g>
				<circle fill="${gridColor}" cx="475" cy="331.9" r="8"/>
				<circle fill="${gridColor}" cx="618.1" cy="475" r="8"/>
				<circle fill="${gridColor}" cx="475" cy="618.1" r="8"/>
				<circle fill="${gridColor}" cx="331.9" cy="475" r="8"/>
			</g>
			<g>
				<circle fill="${layer2Color}" cx="618.1" cy="331.9" r="8.8"/>
				<circle fill="${layer2Color}" cx="618.1" cy="618.1" r="8.8"/>
				<circle fill="${layer2Color}" cx="331.9" cy="618.1" r="8.8"/>
				<circle fill="${layer2Color}" cx="331.9" cy="331.9" r="8.8"/>
			</g>
			<g>
				<circle fill="${layer2Color}" cx="625" cy="325" r="8.8"/>
				<circle fill="${layer2Color}" cx="625" cy="625" r="8.8"/>
				<circle fill="${layer2Color}" cx="325" cy="625" r="8.8"/>
				<circle fill="${layer2Color}" cx="325" cy="325" r="8.8"/>
			</g>
			<g>
				<circle fill="${layer2Color}" cx="475" cy="325" r="4.7"/>
				<circle fill="${layer2Color}" cx="625" cy="475" r="4.7"/>
				<circle fill="${layer2Color}" cx="475" cy="625" r="4.7"/>
				<circle fill="${layer2Color}" cx="325" cy="475" r="4.7"/>
			</g>
			<circle fill="${gridColor}" cx="475" cy="475" r="12"/>
		</svg>`;
	}

	// Staff SVG using exact design from specification
	const blueStaffSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252.8 77.8" style="enable-background:new 0 0 252.8 77.8;">
		<style type="text/css">
			.staff-body { fill: ${PROP_COLORS.BLUE}; stroke: #FFFFFF; stroke-width: 2.75; stroke-miterlimit: 10; }
			.center-point { fill: #0000FF; }
		</style>
		<path class="staff-body" d="M251.4,67.7V10.1c0-4.8-4.1-8.7-9.1-8.7s-9.1,3.9-9.1,8.7v19.2H10.3c-4.9,0-8.9,3.8-8.9,8.5V41
			c0,4.6,4,8.5,8.9,8.5h222.9v18.2c0,4.8,4.1,8.7,9.1,8.7S251.4,72.5,251.4,67.7z"/>
		<circle class="center-point" cx="126.4" cy="38.9" r="2"/>
	</svg>`;

	const redStaffSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252.8 77.8" style="enable-background:new 0 0 252.8 77.8;">
		<style type="text/css">
			.staff-body { fill: ${PROP_COLORS.RED}; stroke: #FFFFFF; stroke-width: 2.75; stroke-miterlimit: 10; }
			.center-point { fill: #0000FF; }
		</style>
		<path class="staff-body" d="M251.4,67.7V10.1c0-4.8-4.1-8.7-9.1-8.7s-9.1,3.9-9.1,8.7v19.2H10.3c-4.9,0-8.9,3.8-8.9,8.5V41
			c0,4.6,4,8.5,8.9,8.5h222.9v18.2c0,4.8,4.1,8.7,9.1,8.7S251.4,72.5,251.4,67.7z"/>
		<circle class="center-point" cx="126.4" cy="38.9" r="2"/>
	</svg>`;

	// Track prop changes to trigger re-renders
	$effect(() => {
		blueProp;
		redProp;
		gridVisible;
		needsRender = true;
		startRenderLoop();
	});

	// Initial load of staff images and canvas setup
	$effect(() => {
		const loadStaffImages = async () => {
			try {
				[blueStaffImage, redStaffImage] = await Promise.all([
					svgStringToImage(
						blueStaffSvg,
						ANIMATION_CONSTANTS.STAFF_VIEWBOX_WIDTH,
						ANIMATION_CONSTANTS.STAFF_VIEWBOX_HEIGHT
					),
					svgStringToImage(
						redStaffSvg,
						ANIMATION_CONSTANTS.STAFF_VIEWBOX_WIDTH,
						ANIMATION_CONSTANTS.STAFF_VIEWBOX_HEIGHT
					)
				]);

				ctx = canvasElement.getContext('2d');

				await loadGridImage();
				imagesLoaded = true;
				needsRender = true;
				startRenderLoop();
			} catch (err) {
				console.error('Failed to load SVG images:', err);
			}
		};

		if (canvasElement) {
			loadStaffImages();
		}

		return () => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}
		};
	});

	// Grid regeneration when layer2 or theme changes
	$effect(() => {
		layer2Visible;
		isDarkMode;
		if (imagesLoaded) {
			loadGridImage();
		}
	});

	async function loadGridImage() {
		try {
			const currentGridSvg = generateGridSvg(layer2Visible, isDarkMode);
			gridImage = await svgStringToImage(currentGridSvg, width, height);
			needsRender = true;
			startRenderLoop();
		} catch (err) {
			console.error('Failed to load grid image:', err);
		}
	}

	function renderLoop(): void {
		if (!ctx || !imagesLoaded) return;

		if (needsRender) {
			render();
			needsRender = false;
			rafId = requestAnimationFrame(renderLoop);
		} else {
			rafId = null;
		}
	}

	function startRenderLoop(): void {
		if (rafId === null && ctx && imagesLoaded) {
			rafId = requestAnimationFrame(renderLoop);
		}
	}

	function render(): void {
		if (!ctx || !imagesLoaded) return;

		ctx.clearRect(0, 0, width, height);

		if (gridVisible && gridImage) {
			ctx.drawImage(gridImage, 0, 0, width, height);
		}

		if (blueStaffImage) {
			drawProp(ctx, blueStaffImage, blueProp);
		}

		if (redStaffImage) {
			drawProp(ctx, redStaffImage, redProp);
		}
	}

	function drawProp(
		context: CanvasRenderingContext2D,
		image: HTMLImageElement,
		prop: PropState
	): void {
		context.save();

		const gridScaleFactor = width / ANIMATION_CONSTANTS.GRID_VIEWBOX_SIZE;
		const canvasX = prop.x * gridScaleFactor;
		const canvasY = prop.y * gridScaleFactor;

		context.translate(canvasX, canvasY);
		context.rotate(prop.staffRotationAngle);

		const staffWidth = ANIMATION_CONSTANTS.STAFF_VIEWBOX_WIDTH * gridScaleFactor;
		const staffHeight = ANIMATION_CONSTANTS.STAFF_VIEWBOX_HEIGHT * gridScaleFactor;
		const centerOffsetX = ANIMATION_CONSTANTS.STAFF_CENTER_X * gridScaleFactor;
		const centerOffsetY = ANIMATION_CONSTANTS.STAFF_CENTER_Y * gridScaleFactor;

		context.drawImage(image, -centerOffsetX, -centerOffsetY, staffWidth, staffHeight);
		context.restore();
	}
</script>

<div class="canvas-wrapper">
	<canvas bind:this={canvasElement} {width} {height} style="width: {width}px; height: {height}px;"
	></canvas>

	<div class="grid-controls">
		<label class="layer2-toggle">
			<input type="checkbox" bind:checked={layer2Visible} title="Show/hide layer2 grid points" />
			<span>Show Layer2 Points</span>
		</label>
	</div>
</div>

<style>
	.canvas-wrapper {
		position: relative;
		display: inline-block;
	}

	canvas {
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-surface);
		transition: all 0.3s ease;
		display: block;
	}

	.grid-controls {
		position: absolute;
		top: 8px;
		right: 8px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 0.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}

	.layer2-toggle {
		display: flex;
		align-items: center;
		cursor: pointer;
		font-size: 0.85rem;
		color: var(--color-text-primary);
		margin: 0;
		user-select: none;
	}

	.layer2-toggle input[type='checkbox'] {
		margin-right: 0.5rem;
		cursor: pointer;
		accent-color: var(--color-primary);
	}

	.layer2-toggle span {
		font-weight: 500;
	}

	.layer2-toggle:hover {
		color: var(--color-primary);
	}

	/* Dark mode adjustments */
	:global([data-theme='dark']) .grid-controls {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}
</style>
