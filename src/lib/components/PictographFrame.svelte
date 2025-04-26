<script lang="ts">
	import { isSvgContent } from '../utils/animation.js';

	// Props
	let {
		content = '',
		width = '100%',
		height = '100%'
	} = $props<{
		content: string;
		width?: string;
		height?: string;
	}>();

	// Local state
	let svgContent = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let frameElement: HTMLDivElement;

	// Process content when it changes
	$effect(() => {
		if (!content) {
			svgContent = '';
			return;
		}

		if (isSvgContent(content)) {
			// Content is already SVG
			svgContent = content;
		} else {
			// Content is a path, load it
			loadSvgFromPath(content);
		}
	});

	/**
	 * Loads SVG content from a file path
	 */
	async function loadSvgFromPath(path: string) {
		isLoading = true;
		error = '';

		try {
			const response = await fetch(path);
			if (!response.ok) {
				throw new Error(`Failed to load SVG: ${response.statusText}`);
			}

			const text = await response.text();
			if (!isSvgContent(text)) {
				throw new Error('Loaded content is not valid SVG');
			}

			svgContent = text;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load SVG';
			svgContent = '';
		} finally {
			isLoading = false;
		}
	}

	// Update the frame content
	$effect(() => {
		if (frameElement && svgContent) {
			frameElement.innerHTML = svgContent;

			// Find all SVG elements and set viewBox if missing
			const svgElements = frameElement.querySelectorAll('svg');
			svgElements.forEach((svg) => {
				if (
					!svg.getAttribute('viewBox') &&
					svg.getAttribute('width') &&
					svg.getAttribute('height')
				) {
					const w = parseFloat(svg.getAttribute('width') || '0');
					const h = parseFloat(svg.getAttribute('height') || '0');
					if (w > 0 && h > 0) {
						svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
					}
				}

				// Make SVG responsive
				svg.setAttribute('width', '100%');
				svg.setAttribute('height', '100%');
				svg.style.display = 'block';
			});
		}
	});
</script>

<div
	class="pictograph-frame"
	class:loading={isLoading}
	style="width: {width}; height: {height};"
	bind:this={frameElement}
>
	{#if isLoading}
		<div class="loading-indicator">Loading...</div>
	{/if}

	{#if error}
		<div class="error-message">{error}</div>
	{/if}
</div>

<style>
	.pictograph-frame {
		position: relative;
		overflow: hidden;
	}

	.loading-indicator {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 0.875rem;
		color: #888;
	}

	.error-message {
		color: #ff3e00;
		font-size: 0.875rem;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		width: 90%;
	}
</style>
