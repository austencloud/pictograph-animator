import { writable, derived, type Readable } from 'svelte/store';
import type { AnimationState, Pictograph } from '../types/index.js';
import { calculateTotalDuration } from '../utils/animation.js';

/**
 * Creates an animation store for controlling pictograph animations
 * @param initialPictograph Optional initial pictograph
 * @returns Store and control methods
 */
export function createAnimatorStore(initialPictograph?: Pictograph) {
	// Create the base animation state
	const defaultState: AnimationState = {
		currentFrameIndex: 0,
		isPlaying: false,
		speed: 1,
		loop: false,
		totalFrames: initialPictograph?.frames?.length || 0
	};

	// Create the writable store
	const store = writable<AnimationState>(defaultState);

	// Current pictograph store
	const pictographStore = writable<Pictograph | undefined>(initialPictograph);

	// Animation timer reference
	let animationTimer: number | undefined;

	// Derived store for progress (0-1)
	const progress: Readable<number> = derived([store, pictographStore], ([$store, $pictograph]) => {
		if (!$pictograph || $pictograph.frames.length === 0) return 0;
		if ($store.currentFrameIndex >= $pictograph.frames.length) return 1;

		// Calculate frames before current
		const framesBefore = $pictograph.frames.slice(0, $store.currentFrameIndex);
		const timeElapsed = framesBefore.reduce(
			(total: number, frame: { duration: number }) => total + frame.duration,
			0
		);

		// Add partial progress of current frame
		// (This is simplified - in a real implementation we'd track partial frame progress)

		const totalDuration = calculateTotalDuration($pictograph);
		return totalDuration > 0 ? timeElapsed / totalDuration : 0;
	});

	/**
	 * Starts the animation
	 */
	function play() {
		store.update((state) => ({ ...state, isPlaying: true }));
		runAnimation();
	}

	/**
	 * Pauses the animation
	 */
	function pause() {
		store.update((state) => ({ ...state, isPlaying: false }));
		if (animationTimer) {
			clearTimeout(animationTimer);
			animationTimer = undefined;
		}
	}

	/**
	 * Stops the animation and resets to first frame
	 */
	function stop() {
		pause();
		store.update((state) => ({ ...state, currentFrameIndex: 0 }));
	}

	/**
	 * Sets the animation speed
	 * @param speed Speed multiplier (1.0 = normal speed)
	 */
	function setSpeed(speed: number) {
		if (speed <= 0) return;
		store.update((state) => ({ ...state, speed }));
	}

	/**
	 * Sets whether the animation should loop
	 * @param loop Whether to loop
	 */
	function setLoop(loop: boolean) {
		store.update((state) => ({ ...state, loop }));
	}

	/**
	 * Sets the current pictograph
	 * @param pictograph The pictograph to animate
	 */
	function setPictograph(pictograph?: Pictograph) {
		stop();
		pictographStore.set(pictograph);
		store.update((state) => ({
			...state,
			currentFrameIndex: 0,
			totalFrames: pictograph?.frames.length || 0
		}));
	}

	/**
	 * Jumps to a specific frame
	 * @param index Frame index
	 */
	function goToFrame(index: number) {
		let pictograph: Pictograph | undefined;
		pictographStore.update((p) => {
			pictograph = p;
			return p;
		});

		if (!pictograph) return;

		const validIndex = Math.max(0, Math.min(index, pictograph.frames.length - 1));
		store.update((state) => ({ ...state, currentFrameIndex: validIndex }));
	}

	/**
	 * Advances to the next frame
	 */
	function nextFrame() {
		// Get current state
		let currentState: AnimationState | undefined;
		let currentPictograph: Pictograph | undefined;

		store.subscribe((s) => {
			currentState = s;
		})();

		pictographStore.subscribe((p) => {
			currentPictograph = p;
		})();

		if (!currentState || !currentPictograph) return;

		const nextIndex = currentState.currentFrameIndex + 1;

		if (nextIndex >= currentPictograph.frames.length) {
			if (currentState.loop) {
				// Loop back to the beginning
				store.update((s) => ({ ...s, currentFrameIndex: 0 }));
				if (currentState.isPlaying) runAnimation();
			} else {
				// Stop at the end
				store.update((s) => ({
					...s,
					isPlaying: false,
					currentFrameIndex: currentPictograph!.frames.length - 1
				}));
			}
		} else {
			// Advance to next frame
			store.update((s) => ({ ...s, currentFrameIndex: nextIndex }));
			if (currentState.isPlaying) runAnimation();
		}
	}

	/**
	 * Runs the animation timer for the current frame
	 */
	function runAnimation() {
		if (animationTimer) {
			clearTimeout(animationTimer);
		}

		// Get current state
		let currentState: AnimationState | undefined;
		let currentPictograph: Pictograph | undefined;

		store.subscribe((s) => {
			currentState = s;
		})();

		pictographStore.subscribe((p) => {
			currentPictograph = p;
		})();

		if (
			!currentState ||
			!currentState.isPlaying ||
			!currentPictograph ||
			currentPictograph.frames.length === 0
		)
			return;

		const currentFrame = currentPictograph.frames[currentState.currentFrameIndex];
		if (!currentFrame) return;

		// Schedule next frame
		const duration = currentFrame.duration / currentState.speed;
		animationTimer = setTimeout(nextFrame, duration) as unknown as number;
	}

	return {
		subscribe: store.subscribe,
		progress,
		pictograph: {
			subscribe: pictographStore.subscribe,
			set: setPictograph
		},
		play,
		pause,
		stop,
		setSpeed,
		setLoop,
		goToFrame,
		nextFrame
	};
}
