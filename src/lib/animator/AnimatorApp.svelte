<script lang="ts">
	import type { SequenceData, PropState, DictionaryItem } from './types/core.js';
	import { AnimationEngine } from './core/engine/animation-engine.js';
	import { AnimatorErrorHandler } from './utils/error/error-handler.js';
	import { InputValidator } from './utils/validation/input-validator.js';

	// Import Lucide icons
	import Maximize2 from 'lucide-svelte/icons/maximize-2';
	import Minimize2 from 'lucide-svelte/icons/minimize-2';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';

	// Import subcomponents from new architecture
	import ThumbnailBrowser from './components/browser/ThumbnailBrowser.svelte';
	import SequenceInput from './components/input/SequenceInput.svelte';
	import AnimatorCanvas from './components/canvas/AnimatorCanvas.svelte';
	import AnimatorControls from './components/controls/AnimatorControls.svelte';
	import AnimatorInfo from './components/info/AnimatorInfo.svelte';
	import AnimatorMessage from './components/ui/AnimatorMessage.svelte';

	// Full-screen functionality
	let isFullScreen = $state(false);

	// Setup engine
	const engine = new AnimationEngine();

	// Full-screen functionality
	function toggleFullScreen(): void {
		if (!document.fullscreenElement) {
			document.documentElement
				.requestFullscreen()
				.then(() => {
					isFullScreen = true;
				})
				.catch((err) => {
					console.warn('Failed to enter fullscreen:', err);
				});
		} else {
			document
				.exitFullscreen()
				.then(() => {
					isFullScreen = false;
				})
				.catch((err) => {
					console.warn('Failed to exit fullscreen:', err);
				});
		}
	}

	// Listen for fullscreen changes (e.g., ESC key)
	$effect(() => {
		function handleFullscreenChange(): void {
			isFullScreen = !!document.fullscreenElement;
		}

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	});

	// State variables using Svelte 5 runes
	let sequenceData = $state<SequenceData | null>(null);
	let blueProp = $state<PropState>({ centerPathAngle: 0, staffRotationAngle: 0, x: 0, y: 0 });
	let redProp = $state<PropState>({ centerPathAngle: 0, staffRotationAngle: 0, x: 0, y: 0 });
	let isPlaying = $state(false);
	let speed = $state(1.0);
	let currentBeat = $state(0);
	let totalBeats = $state(0);
	let canvasWidth = $state(500);
	let canvasHeight = $state(500);
	let sequenceWord = $state('');
	let sequenceAuthor = $state('');
	let isLooping = $state(false);
	let canLoop = $state(false);

	// Message state
	let errorMessage = $state('');
	let successMessage = $state('');

	// UI state
	let activeTab = $state<'browser' | 'upload'>('browser');
	let selectedItem = $state<DictionaryItem | null>(null);
	let isDarkMode = $state(false);

	// Sticky animation viewer state
	let isAnimationSticky = $state(false);
	let animationContainer: HTMLDivElement | null = $state(null);

	// Resizable sidebar state
	let sidebarWidth = $state(480);
	let isResizing = $state(false);
	let resizeStartX = $state(0);
	let resizeStartWidth = $state(0);

	// Animation frame reference
	let animationFrameId: number | null = null;
	let lastTimestamp: number | null = null;

	// Clean up on component destroy using $effect
	$effect(() => {
		return () => {
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});

	// Handle sequence load
	function handleLoadSequence(data: SequenceData): void {
		try {
			// Validate sequence data first
			const validation = InputValidator.validateSequenceData(data);
			if (!validation.isValid) {
				errorMessage = `Invalid sequence data: ${validation.errors.join(', ')}`;
				successMessage = '';
				return;
			}

			// Log warnings if any
			if (validation.warnings.length > 0) {
				console.info('Sequence warnings:', validation.warnings.join(', '));
			}

			// Initialize engine with data
			if (engine.initialize(data)) {
				// Load sequence data
				sequenceData = data;
				const metadata = engine.getMetadata();
				totalBeats = metadata.totalBeats;
				sequenceWord = metadata.word;
				sequenceAuthor = metadata.author;
				canLoop = engine.canLoop();

				// Reset animation state
				currentBeat = 0;
				isPlaying = false;
				isLooping = false;

				// Update prop states
				updatePropStates();

				successMessage = 'Sequence loaded successfully!';
				errorMessage = '';
			} else {
				const error = AnimatorErrorHandler.handleEngineError(
					new Error('Failed to initialize sequence')
				);
				errorMessage = AnimatorErrorHandler.formatForUser(error);
				successMessage = '';
			}
		} catch (err) {
			const error = AnimatorErrorHandler.handleSequenceError(
				err instanceof Error ? err : new Error(String(err))
			);
			errorMessage = AnimatorErrorHandler.formatForUser(error);
			successMessage = '';
		}
	}

	// Update prop states from engine
	function updatePropStates(): void {
		blueProp = engine.getBluePropState();
		redProp = engine.getRedPropState();
	}

	// Animation loop
	function animationLoop(timestamp: number): void {
		if (!isPlaying) return;

		// Calculate deltaTime
		if (lastTimestamp === null) {
			lastTimestamp = timestamp;
		}
		const deltaTime = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		// Update current beat based on speed
		const beatDelta = (deltaTime / 1000) * speed;
		const newBeat = currentBeat + beatDelta;

		// Check if we've reached the end (allow animation to go to totalBeats + 1 to show final beat)
		if (newBeat > totalBeats) {
			if (isLooping) {
				// Loop back to start
				currentBeat = 0;
				lastTimestamp = null;

				// Make sure the engine is reset properly for the next loop
				engine.reset();
			} else {
				// Stop at end (clamp to totalBeats to show final frame)
				currentBeat = totalBeats;
				isPlaying = false;
			}
		} else {
			currentBeat = newBeat;
		}

		// Calculate state for current beat
		engine.calculateState(currentBeat);

		// Update props from engine state
		updatePropStates();

		// Request next frame if still playing
		if (isPlaying) {
			animationFrameId = requestAnimationFrame(animationLoop);
		}
	}

	// Handle play/pause
	function handlePlayPause(): void {
		if (isPlaying) {
			isPlaying = false;
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		} else {
			isPlaying = true;
			lastTimestamp = null;
			animationFrameId = requestAnimationFrame(animationLoop);
		}
	}

	// Handle reset
	function handleReset(): void {
		currentBeat = 0;
		isPlaying = false;

		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}

		engine.reset();
		updatePropStates();
	}

	// Handle speed change
	function handleSpeedChange(value: number): void {
		speed = Math.max(0.1, Math.min(3.0, value));
	}

	// Handle beat change
	function handleBeatChange(value: number): void {
		currentBeat = Math.max(0, Math.min(totalBeats, value));
		engine.calculateState(currentBeat);
		updatePropStates();
	}

	// Handle loop toggle
	function handleLoopToggle(value: boolean): void {
		if (canLoop) {
			isLooping = value;
		}
	}

	// Handle sequence selection from thumbnail browser
	function handleSequenceSelected(data: SequenceData, item: DictionaryItem): void {
		selectedItem = item;
		handleLoadSequence(data);

		// Auto-play the animation after a short delay to ensure it's loaded
		setTimeout(() => {
			if (sequenceData && !isPlaying) {
				handlePlayPause();
			}
		}, 100);
	}

	// Handle tab change
	function handleTabChange(tab: 'browser' | 'upload'): void {
		activeTab = tab;
	}

	// Theme management
	function toggleTheme(): void {
		isDarkMode = !isDarkMode;
		localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
		updateThemeClass();
	}

	function updateThemeClass(): void {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
		}
	}

	function toggleStickyAnimation(): void {
		isAnimationSticky = !isAnimationSticky;
	}

	function closeStickyAnimation(): void {
		isAnimationSticky = false;
	}

	// Initialize theme from localStorage
	$effect(() => {
		if (typeof window !== 'undefined') {
			const savedTheme = localStorage.getItem('theme');
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			isDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;
			updateThemeClass();
		}
	});

	// Resizable sidebar functions
	function handleResizeStart(e: MouseEvent): void {
		isResizing = true;
		resizeStartX = e.clientX;
		resizeStartWidth = sidebarWidth;

		// Add global event listeners
		document.addEventListener('mousemove', handleResizeMove);
		document.addEventListener('mouseup', handleResizeEnd);
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}

	function handleResizeMove(e: MouseEvent): void {
		if (!isResizing) return;

		const deltaX = e.clientX - resizeStartX;
		const newWidth = resizeStartWidth + deltaX;

		// Constrain width between 300px and 800px
		sidebarWidth = Math.max(300, Math.min(800, newWidth));
	}

	function handleResizeEnd(): void {
		isResizing = false;

		// Remove global event listeners
		document.removeEventListener('mousemove', handleResizeMove);
		document.removeEventListener('mouseup', handleResizeEnd);
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	}
</script>

<div class="animator-app">
	<header class="app-header">
		<div class="header-content">
			<div class="header-branding">
				<div class="header-icon">🎭</div>
				<div class="header-text">
					<h1>The Kinetic Alphabet</h1>
					<p class="header-subtitle">Sequence Animation Tool</p>
				</div>
			</div>
			<div class="header-controls">
				<button
					type="button"
					class="theme-toggle"
					onclick={toggleTheme}
					title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
					aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
				>
					{#if isDarkMode}
						<Sun size={20} />
					{:else}
						<Moon size={20} />
					{/if}
				</button>
				<!-- Desktop full-screen button -->
				<button
					type="button"
					class="fullscreen-toggle desktop-only"
					onclick={toggleFullScreen}
					title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
					aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
				>
					{#if isFullScreen}
						<Minimize2 size={20} />
					{:else}
						<Maximize2 size={20} />
					{/if}
				</button>
			</div>
		</div>
	</header>

	<!-- Mobile floating full-screen button -->
	<button
		type="button"
		class="floating-fullscreen-btn mobile-only"
		onclick={toggleFullScreen}
		title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
		aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
	>
		{#if isFullScreen}
			<Minimize2 size={24} />
		{:else}
			<Maximize2 size={24} />
		{/if}
	</button>

	<div class="app-layout">
		<!-- Left Sidebar: Sequence Browser -->
		<aside class="sidebar" style="width: {sidebarWidth}px;">
			<div class="sidebar-header">
				<h2>Sequence Library</h2>
				<!-- Desktop only: Upload/JSON input toggle -->
				<div class="input-toggle desktop-only">
					<button
						type="button"
						class="toggle-button"
						class:active={activeTab === 'browser'}
						onclick={() => handleTabChange('browser')}
						title="Browse sequence library"
					>
						📚
					</button>
					<button
						type="button"
						class="toggle-button"
						class:active={activeTab === 'upload'}
						onclick={() => handleTabChange('upload')}
						title="Upload file or paste JSON"
					>
						📁
					</button>
				</div>
			</div>

			<div class="sidebar-content">
				<!-- Mobile: Always show browser, Desktop: Show based on active tab -->
				<div class="mobile-only">
					<ThumbnailBrowser onSequenceSelected={handleSequenceSelected} />
				</div>
				<div class="desktop-only">
					{#if activeTab === 'browser'}
						<ThumbnailBrowser onSequenceSelected={handleSequenceSelected} />
					{:else}
						<SequenceInput onSequenceLoaded={handleLoadSequence} />
					{/if}
				</div>
			</div>
		</aside>

		<!-- Resizable Splitter -->
		<button
			type="button"
			class="resize-handle"
			class:resizing={isResizing}
			onmousedown={handleResizeStart}
			title="Drag to resize sidebar"
			aria-label="Resize sidebar"
		></button>

		<!-- Right Main Area: Animator -->
		<main class="main-content">
			<AnimatorMessage errorMsg={errorMessage} successMsg={successMessage} />

			{#if sequenceData}
				<div class="animator-section">
					{#if selectedItem}
						<div class="sequence-info">
							<h3>Now Playing: {selectedItem.name}</h3>
							{#if selectedItem.metadata.author}
								<p>by {selectedItem.metadata.author}</p>
							{/if}
							<!-- Mobile sticky animation toggle -->
							<button
								type="button"
								class="sticky-toggle mobile-only"
								onclick={toggleStickyAnimation}
								aria-label="Toggle sticky animation viewer"
							>
								{isAnimationSticky ? 'Exit Sticky View' : 'Sticky View'}
							</button>
						</div>
					{/if}

					<div
						class="canvas-container"
						class:sticky={isAnimationSticky}
						bind:this={animationContainer}
					>
						{#if isAnimationSticky}
							<button
								type="button"
								class="close-sticky"
								onclick={closeStickyAnimation}
								aria-label="Close sticky view"
							>
								✕
							</button>
						{/if}
						<AnimatorCanvas {blueProp} {redProp} width={canvasWidth} height={canvasHeight} />
					</div>

					<AnimatorControls
						{isPlaying}
						{speed}
						{currentBeat}
						maxBeat={totalBeats}
						{canLoop}
						{isLooping}
						onPlayPause={handlePlayPause}
						onReset={handleReset}
						onSpeedChange={handleSpeedChange}
						onBeatChange={handleBeatChange}
						onLoopToggle={handleLoopToggle}
					/>

					<AnimatorInfo {currentBeat} {speed} {totalBeats} {sequenceWord} {sequenceAuthor} />
				</div>
			{:else}
				<!-- Minimal placeholder when no sequence is selected -->
				<div class="minimal-placeholder">
					<p>Select a sequence from the library to begin animation</p>
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
	/* Global Mobile-First Reset */
	:global(html, body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		overflow-x: hidden;
		-webkit-text-size-adjust: 100%;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	:global(body) {
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
		line-height: 1.5;
	}

	:global(#svelte) {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	:global(*) {
		box-sizing: border-box;
	}

	/* CSS Variables for Light and Dark Themes */
	:global(:root) {
		/* Light theme (default) */
		--color-background: #ffffff;
		--color-surface: #f8f9fa;
		--color-surface-hover: #e9ecef;
		--color-border: #e0e0e0;
		--color-text-primary: #333333;
		--color-text-secondary: #666666;
		--color-primary: #2196f3;
		--color-primary-alpha: rgba(33, 150, 243, 0.2);
		--color-success: #4caf50;
		--color-error: #f44336;
		--color-warning: #ff9800;

		/* Grid colors for light theme */
		--color-grid-point: #000000;
		--color-grid-center: #000000;

		/* Header gradients and shadows */
		--header-gradient: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
		--header-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
		--fab-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		--fab-backdrop: rgba(255, 255, 255, 0.9);
	}

	:global([data-theme='dark']) {
		/* Dark theme */
		--color-background: #1a1a1a;
		--color-surface: #2a2a2a;
		--color-surface-hover: #3a3a3a;
		--color-border: #404040;
		--color-text-primary: #f0f0f0;
		--color-text-secondary: #b0b0b0;
		--color-primary: #4dabf7;
		--color-primary-alpha: rgba(77, 171, 247, 0.2);
		--color-success: #69db7c;
		--color-error: #ff6b6b;
		--color-warning: #ffd43b;

		/* Grid colors for dark theme */
		--color-grid-point: #ffffff;
		--color-grid-center: #ffffff;

		/* Header gradients and shadows for dark theme */
		--header-gradient: linear-gradient(135deg, #4dabf7 0%, #339af0 100%);
		--header-shadow: 0 2px 8px rgba(77, 171, 247, 0.2);
		--fab-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		--fab-backdrop: rgba(42, 42, 42, 0.9);
	}

	.animator-app {
		height: 100vh;
		height: 100dvh; /* Use dynamic viewport height for mobile */
		display: flex;
		flex-direction: column;
		background: var(--color-background);
		transition: background-color 0.3s ease;
		overflow: hidden; /* Prevent body scroll on mobile */
		position: relative;
	}

	.app-header {
		background: var(--header-gradient);
		border-bottom: none;
		box-shadow: var(--header-shadow);
		padding: 1rem 2rem;
		flex-shrink: 0;
		transition: all 0.3s ease;
		position: relative;
		z-index: 100;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 1400px;
		margin: 0 auto;
	}

	.header-branding {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0; /* Allow branding to shrink */
		flex: 1;
	}

	.header-icon {
		font-size: 2rem;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
		flex-shrink: 0;
	}

	.header-text {
		min-width: 0; /* Allow text to shrink */
		overflow: hidden;
	}

	.header-text h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		letter-spacing: -0.025em;
	}

	.header-subtitle {
		margin: 0;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
		letter-spacing: 0.5px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.theme-toggle,
	.fullscreen-toggle {
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1.1rem;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	.theme-toggle:hover,
	.fullscreen-toggle:hover {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.theme-toggle:active,
	.fullscreen-toggle:active {
		transform: translateY(0);
	}

	/* Mobile/Desktop Visibility Classes */
	.mobile-only {
		display: none;
	}

	.desktop-only {
		display: block;
	}

	/* Floating Action Button */
	.floating-fullscreen-btn {
		position: fixed;
		bottom: 16px;
		right: 16px;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--fab-backdrop);
		border: 1px solid var(--color-border);
		box-shadow: var(--fab-shadow);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
		z-index: 1000;
		color: var(--color-text-primary);
	}

	.floating-fullscreen-btn:hover {
		transform: scale(1.1);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
	}

	.floating-fullscreen-btn:active {
		transform: scale(0.95);
	}

	/* Sticky Animation Viewer */
	.sticky-toggle {
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	.sticky-toggle:hover {
		background: var(--color-primary-dark, #1976d2);
		transform: translateY(-1px);
	}

	.canvas-container.sticky {
		position: sticky;
		top: 16px;
		z-index: 100;
		background: var(--color-surface);
		border: 2px solid var(--color-primary);
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		margin-bottom: 1rem;
	}

	.close-sticky {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 32px;
		height: 32px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		font-size: 1.2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		transition: all 0.2s ease;
	}

	.close-sticky:hover {
		background: rgba(0, 0, 0, 0.9);
		transform: scale(1.1);
	}

	.app-layout {
		display: flex;
		flex: 1;
		min-height: 0; /* Important for flex children to shrink */
	}

	/* Left Sidebar */
	.sidebar {
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		min-width: 300px;
		max-width: 800px;
		transition: all 0.3s ease;
	}

	.sidebar-header {
		padding: 1.5rem 1.5rem 1rem;
		border-bottom: 1px solid var(--color-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.sidebar-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.input-toggle {
		display: flex;
		gap: 0.25rem;
		background: var(--color-background);
		border-radius: 6px;
		padding: 0.25rem;
		border: 1px solid var(--color-border);
		transition: all 0.3s ease;
	}

	.toggle-button {
		padding: 0.5rem;
		background: transparent;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1.1rem;
		transition: all 0.2s ease;
		color: var(--color-text-secondary);
		min-width: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toggle-button:hover {
		background: var(--color-surface-hover);
	}

	.toggle-button.active {
		background: var(--color-primary);
		color: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.sidebar-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	/* Resize Handle */
	.resize-handle {
		width: 4px;
		background: var(--color-border);
		cursor: col-resize;
		flex-shrink: 0;
		transition: background-color 0.2s ease;
		position: relative;
	}

	.resize-handle:hover {
		background: var(--color-primary);
	}

	.resize-handle.resizing {
		background: var(--color-primary);
	}

	.resize-handle::before {
		content: '';
		position: absolute;
		top: 0;
		left: -2px;
		right: -2px;
		bottom: 0;
		cursor: col-resize;
	}

	/* Right Main Content */
	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0; /* Important for flex children to shrink */
		background: var(--color-background);
		transition: background-color 0.3s ease;
		overflow-y: auto;
		min-height: 0;
	}

	.animator-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 2rem;
		gap: 1.5rem;
		width: 100%;
		box-sizing: border-box;
		overflow-y: auto;
	}

	.sequence-info {
		text-align: center;
		padding: 1rem;
		background: var(--color-surface);
		border-radius: 8px;
		border: 1px solid var(--color-border);
		transition: all 0.3s ease;
	}

	.sequence-info h3 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		color: var(--color-text-primary);
	}

	.sequence-info p {
		margin: 0;
		color: var(--color-text-secondary);
		font-style: italic;
	}

	.minimal-placeholder {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
	}

	.minimal-placeholder p {
		color: var(--color-text-secondary);
		font-size: 1.1rem;
		margin: 0;
	}

	.canvas-container {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
		background: var(--color-surface);
		border-radius: 8px;
		border: 1px solid var(--color-border);
		min-height: 500px;
		flex: 1;
		width: 100%;
		max-width: none;
		transition: all 0.3s ease;
	}

	.welcome-content h3 {
		margin: 0 0 1rem;
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-primary);
		letter-spacing: -0.025em;
	}

	.welcome-description {
		margin: 0 0 2.5rem;
		font-size: 1.2rem;
		line-height: 1.6;
		color: var(--color-text-primary);
		opacity: 0.9;
	}

	.getting-started {
		margin-bottom: 2.5rem;
		text-align: left;
	}

	.getting-started h4 {
		margin: 0 0 1.5rem;
		font-size: 1.3rem;
		font-weight: 600;
		color: var(--color-text-primary);
		text-align: center;
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.step {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--color-surface);
		border-radius: 12px;
		border: 1px solid var(--color-border);
		transition: all 0.3s ease;
	}

	.step:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.step-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--color-primary);
		color: white;
		border-radius: 50%;
		font-weight: 700;
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.step-content {
		flex: 1;
	}

	.step-content strong {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 1.1rem;
		color: var(--color-text-primary);
		font-weight: 600;
	}

	.step-content p {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--color-text-secondary);
	}

	.features-preview {
		text-align: left;
	}

	.features-preview h4 {
		margin: 0 0 1.5rem;
		font-size: 1.3rem;
		font-weight: 600;
		color: var(--color-text-primary);
		text-align: center;
	}

	.feature-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.feature {
		padding: 0.75rem 1rem;
		background: var(--color-surface);
		border-radius: 8px;
		border: 1px solid var(--color-border);
		font-weight: 500;
		color: var(--color-text-primary);
		text-align: center;
		transition: all 0.2s ease;
	}

	.feature:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
		transform: translateY(-1px);
	}

	/* Responsive Design */
	@media (max-width: 1200px) {
		.animator-section {
			padding: 1.5rem;
		}

		.canvas-container {
			padding: 1.5rem;
			min-height: 400px;
		}

		.resize-handle {
			width: 6px;
		}
	}

	/* Tablet Layout */
	@media (max-width: 1024px) {
		.app-layout {
			flex-direction: column;
		}

		.sidebar {
			width: 100% !important;
			height: 45vh;
			max-height: 500px;
			border-right: none;
			border-bottom: 1px solid var(--color-border, #e0e0e0);
			min-width: unset;
			max-width: unset;
		}

		.resize-handle {
			display: none;
		}

		.main-content {
			height: 55vh;
			min-height: 400px;
		}

		.animator-section {
			padding: 1.5rem;
		}

		.canvas-container {
			min-height: 350px;
		}
	}

	/* Mobile Layout - Complete Redesign */
	@media (max-width: 768px) {
		/* Mobile/Desktop Visibility */
		.mobile-only {
			display: block;
		}

		.desktop-only {
			display: none;
		}

		.animator-app {
			height: 100vh;
			height: 100dvh; /* Use dynamic viewport height */
			overflow: hidden;
		}

		.app-header {
			padding: 0.75rem 1rem;
			min-height: auto;
			flex-shrink: 0;
		}

		.header-content {
			min-width: 0;
		}

		.header-branding {
			gap: 0.5rem;
			min-width: 0;
		}

		.header-icon {
			font-size: 1.75rem;
		}

		.header-text h1 {
			font-size: 1.25rem;
			line-height: 1.1;
		}

		.header-subtitle {
			font-size: 0.7rem;
			display: none; /* Hide subtitle on very small screens */
		}

		.header-controls {
			gap: 0.25rem;
		}

		.theme-toggle,
		.fullscreen-toggle {
			width: 36px;
			height: 36px;
			font-size: 1rem;
		}

		.app-layout {
			flex-direction: column;
			height: calc(100vh - 60px); /* Account for header */
			height: calc(100dvh - 60px);
		}

		.sidebar {
			width: 100% !important;
			height: 60vh; /* Increased from 50vh for better browsing */
			max-height: none;
			border-right: none;
			border-bottom: 1px solid var(--color-border);
			min-width: unset;
			max-width: unset;
			overflow: hidden;
		}

		.sidebar-header {
			padding: 0.75rem 1rem;
			min-height: auto;
		}

		.sidebar-header h2 {
			font-size: 1rem;
		}

		.sidebar-content {
			flex: 1;
			overflow: hidden;
		}

		.main-content {
			height: 40vh; /* Reduced to give more space to sidebar */
			min-height: 200px;
			overflow: hidden;
		}

		.animator-section {
			padding: 0.75rem;
			gap: 0.75rem;
			height: 100%;
			overflow-y: auto;
		}

		.canvas-container {
			padding: 0.75rem;
			min-height: 180px;
			flex: 1;
		}

		.welcome-message {
			padding: 1rem;
			height: 100%;
			overflow-y: auto;
		}

		.welcome-content {
			max-width: 100%;
		}

		.welcome-icon {
			font-size: 2.5rem;
		}

		.welcome-content h3 {
			font-size: 1.25rem;
		}

		.welcome-description {
			font-size: 1rem;
			margin-bottom: 1.5rem;
		}

		.getting-started h4 {
			font-size: 1.1rem;
			margin-bottom: 1rem;
		}

		.steps {
			gap: 1rem;
		}

		.step {
			padding: 1rem;
		}

		.step-number {
			width: 28px;
			height: 28px;
			font-size: 0.8rem;
		}

		.step-content strong {
			font-size: 1rem;
		}

		.step-content p {
			font-size: 0.9rem;
		}

		.features-preview h4 {
			font-size: 1.1rem;
			margin-bottom: 1rem;
		}

		.feature-list {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.feature {
			padding: 0.5rem 0.75rem;
			font-size: 0.9rem;
		}
	}

	/* Small Mobile Layout */
	@media (max-width: 480px) {
		.header-text h1 {
			font-size: 1.1rem;
		}

		.header-subtitle {
			display: none; /* Hide completely on very small screens */
		}

		.header-controls {
			gap: 0.25rem;
		}

		.theme-toggle,
		.fullscreen-toggle {
			width: 32px;
			height: 32px;
			font-size: 0.9rem;
		}

		.sidebar {
			height: 65vh; /* Even more space for browsing on small screens */
		}

		.main-content {
			height: 35vh;
			min-height: 180px;
		}

		.animator-section {
			padding: 0.5rem;
			gap: 0.5rem;
		}

		.canvas-container {
			padding: 0.5rem;
			min-height: 150px;
		}

		.welcome-content h3 {
			font-size: 1.1rem;
		}

		.welcome-description {
			font-size: 0.9rem;
		}

		.step {
			padding: 0.75rem;
		}

		.step-number {
			width: 24px;
			height: 24px;
			font-size: 0.75rem;
		}
	}
</style>
