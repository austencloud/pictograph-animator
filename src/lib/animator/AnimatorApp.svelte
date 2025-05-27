<script lang="ts">
	import type { SequenceData, PropState, DictionaryItem } from './types/core.js';
	import { AnimationEngine } from './core/engine/animation-engine.js';
	import { AnimatorErrorHandler } from './utils/error/error-handler.js';
	import { InputValidator } from './utils/validation/input-validator.js';

	// Import subcomponents from new architecture
	import ThumbnailBrowser from './components/browser/ThumbnailBrowser.svelte';
	import SequenceInput from './components/input/SequenceInput.svelte';
	import AnimatorCanvas from './components/canvas/AnimatorCanvas.svelte';
	import AnimatorControls from './components/controls/AnimatorControls.svelte';
	import AnimatorInfo from './components/info/AnimatorInfo.svelte';
	import AnimatorMessage from './components/ui/AnimatorMessage.svelte';

	// Setup engine
	const engine = new AnimationEngine();

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
		const states = engine.getPropStates();
		blueProp = states.blueProp;
		redProp = states.redProp;
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
					<h1>Kinetic Alphabet</h1>
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
					{isDarkMode ? '☀️' : '🌙'}
				</button>
			</div>
		</div>
	</header>

	<div class="app-layout">
		<!-- Left Sidebar: Sequence Browser -->
		<aside class="sidebar" style="width: {sidebarWidth}px;">
			<div class="sidebar-header">
				<h2>Sequence Library</h2>
				<div class="input-toggle">
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
				{#if activeTab === 'browser'}
					<ThumbnailBrowser onSequenceSelected={handleSequenceSelected} />
				{:else}
					<SequenceInput onSequenceLoaded={handleLoadSequence} />
				{/if}
			</div>
		</aside>

		<!-- Resizable Splitter -->
		<div
			class="resize-handle"
			class:resizing={isResizing}
			onmousedown={handleResizeStart}
			title="Drag to resize sidebar"
			role="separator"
			aria-label="Resize sidebar"
		></div>

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
						</div>
					{/if}

					<div class="canvas-container">
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
				<div class="welcome-message">
					<div class="welcome-icon">🎭</div>
					<h3>Welcome to Pictograph Animator</h3>
					<p>Select a sequence from the library or upload your own to get started.</p>
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
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
	}

	.animator-app {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-background);
		transition: background-color 0.3s ease;
	}

	.app-header {
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		padding: 1rem 2rem;
		flex-shrink: 0;
		transition: all 0.3s ease;
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
		gap: 1rem;
	}

	.header-icon {
		font-size: 2.5rem;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
	}

	.header-text h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-primary);
		line-height: 1.2;
	}

	.header-subtitle {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		font-weight: 500;
		letter-spacing: 0.5px;
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.theme-toggle {
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: 50%;
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1.2rem;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.theme-toggle:hover {
		background: var(--color-surface-hover);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.theme-toggle:active {
		transform: translateY(0);
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
		overflow: hidden;
		display: flex;
		flex-direction: column;
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

	.welcome-message {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 4rem 2rem;
		color: var(--color-text-secondary);
	}

	.welcome-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.7;
	}

	.welcome-message h3 {
		margin: 0 0 1rem;
		font-size: 1.5rem;
		color: var(--color-text-primary);
	}

	.welcome-message p {
		margin: 0;
		font-size: 1.1rem;
		max-width: 400px;
		line-height: 1.5;
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

	/* Mobile Layout */
	@media (max-width: 768px) {
		.app-header {
			padding: 1rem;
		}

		.header-branding {
			gap: 0.75rem;
		}

		.header-icon {
			font-size: 2rem;
		}

		.header-text h1 {
			font-size: 1.5rem;
		}

		.header-subtitle {
			font-size: 0.8rem;
		}

		.theme-toggle {
			width: 40px;
			height: 40px;
			font-size: 1.1rem;
		}

		.sidebar {
			height: 50vh;
			max-height: 400px;
		}

		.sidebar-header {
			padding: 1rem;
		}

		.sidebar-header h2 {
			font-size: 1.1rem;
		}

		.main-content {
			height: 50vh;
			min-height: 350px;
		}

		.animator-section {
			padding: 1rem;
			gap: 1rem;
		}

		.canvas-container {
			padding: 1rem;
			min-height: 250px;
		}

		.welcome-message {
			padding: 2rem 1rem;
		}

		.welcome-icon {
			font-size: 3rem;
		}

		.welcome-message h3 {
			font-size: 1.25rem;
		}

		.welcome-message p {
			font-size: 1rem;
		}
	}

	/* Small Mobile Layout */
	@media (max-width: 480px) {
		.header-text h1 {
			font-size: 1.25rem;
		}

		.header-subtitle {
			font-size: 0.75rem;
		}

		.theme-toggle {
			width: 36px;
			height: 36px;
			font-size: 1rem;
		}

		.sidebar {
			height: 45vh;
			max-height: 350px;
		}

		.main-content {
			height: 55vh;
			min-height: 300px;
		}

		.animator-section {
			padding: 0.75rem;
		}

		.canvas-container {
			padding: 0.75rem;
			min-height: 200px;
		}
	}
</style>
