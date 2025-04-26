<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createAnimatorStore } from '../stores/animator.js';
	import type { Pictograph, AnimatorConfig } from '../types/index.js';
	import { validatePictograph } from '../utils/animation.js';
	import PictographFrame from './PictographFrame.svelte';

	// Props
	let { pictograph, config = {} } = $props<{
		pictograph: Pictograph;
		config?: AnimatorConfig;
	}>();

	// Default configuration
	const defaultConfig: AnimatorConfig = {
		autoplay: false,
		loop: false,
		speed: 1,
		onComplete: undefined,
		onStart: undefined,
		onFrameChange: undefined
	};

	// Merge default config with provided config
	const mergedConfig = { ...defaultConfig, ...config };

	// Create the animator store
	const animator = createAnimatorStore(pictograph);

	// Local state
	let isValid = $state(false);
	let error = $state('');
	let currentFrameContent = $state('');

	// Track previous values for event callbacks
	let prevFrameIndex = $state(-1);
	let prevIsPlaying = $state(false);

	// Subscribe to store changes
	const unsubscribe = animator.subscribe((state) => {
		if (state.currentFrameIndex !== prevFrameIndex) {
			prevFrameIndex = state.currentFrameIndex;
			if (mergedConfig.onFrameChange) {
				mergedConfig.onFrameChange(state.currentFrameIndex);
			}
		}

		// Check if animation just completed
		if (prevIsPlaying && !state.isPlaying && state.currentFrameIndex === state.totalFrames - 1) {
			if (mergedConfig.onComplete) {
				mergedConfig.onComplete();
			}
		}

		// Check if animation just started
		if (!prevIsPlaying && state.isPlaying && state.currentFrameIndex === 0) {
			if (mergedConfig.onStart) {
				mergedConfig.onStart();
			}
		}

		prevIsPlaying = state.isPlaying;
	});

	// Update pictograph when prop changes
	$effect(() => {
		if (pictograph) {
			isValid = validatePictograph(pictograph);
			if (isValid) {
				animator.pictograph.set(pictograph);
				error = '';
			} else {
				error = 'Invalid pictograph format';
			}
		} else {
			isValid = false;
			error = 'No pictograph provided';
		}
	});

	// Update config when props change
	$effect(() => {
		animator.setLoop(mergedConfig.loop || false);
		animator.setSpeed(mergedConfig.speed || 1);
	});

	// Get current frame content
	$effect(() => {
		// Get the current animation state
		const state = $animator;
		// Get the current pictograph from the separate store
		let pic: Pictograph | undefined;
		animator.pictograph.subscribe((p) => {
			pic = p;
		})();

		if (pic && pic.frames && pic.frames.length > 0 && state.currentFrameIndex < pic.frames.length) {
			currentFrameContent = pic.frames[state.currentFrameIndex].content;
		} else {
			currentFrameContent = '';
		}
	});

	// Lifecycle hooks
	onMount(() => {
		if (mergedConfig.autoplay && isValid) {
			animator.play();
		}
	});

	onDestroy(() => {
		unsubscribe();
		animator.stop();
	});

	// Public API - expose methods to parent components
	export function play() {
		animator.play();
	}

	export function pause() {
		animator.pause();
	}

	export function stop() {
		animator.stop();
	}

	export function goToFrame(index: number) {
		animator.goToFrame(index);
	}

	export function setSpeed(speed: number) {
		animator.setSpeed(speed);
	}
</script>

<div class="pictograph-animator" class:error={!isValid}>
	{#if error}
		<div class="error-message">{error}</div>
	{:else}
		<PictographFrame content={currentFrameContent} />
	{/if}
</div>

<style>
	.pictograph-animator {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.error-message {
		color: #ff3e00;
		font-size: 0.875rem;
	}

	.error {
		border: 1px dashed #ff3e00;
		padding: 1rem;
		border-radius: 0.25rem;
	}
</style>
