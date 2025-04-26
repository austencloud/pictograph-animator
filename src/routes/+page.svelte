<script lang="ts">
	import { onMount } from 'svelte';
	import SequenceAnimator from '../lib/components/animator/SequenceAnimator.svelte';
	import type { SequenceData } from '../lib/types/sequence.js';
	import {
		aabbSequence,
		getSequenceById,
		initializeSequences
	} from '$lib/data/sequences/loader.js';

	// Currently selected sequence
	let selectedSequence: SequenceData = aabbSequence;
	let isLoading = true;

	// Function to switch between sequences
	function selectSequence(id: string) {
		const sequence = getSequenceById(id);
		if (sequence) {
			selectedSequence = sequence;
		}
	}

	// Canvas size
	let canvasSize = 500;

	// Animation speed
	let animationSpeed = 1.0;

	// Show sequence data
	let showSequenceData = false;

	// Initialize sequences when the component mounts
	onMount(async () => {
		try {
			await initializeSequences();
			// Update the selected sequence after loading
			selectedSequence = aabbSequence;
			isLoading = false;
		} catch (error) {
			console.error('Failed to initialize sequences:', error);
			isLoading = false;
		}
	});
</script>

<div class="container">
	<section class="hero">
		<h1>Sequence Animator</h1>
		<p class="subtitle">Visualize and animate choreographed staff movements</p>
	</section>

	{#if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<p>Loading sequence data...</p>
		</div>
	{:else}
		<div class="sequence-selector">
			<button
				class="sequence-button"
				class:active={selectedSequence === aabbSequence}
				on:click={() => selectSequence('aabb')}
			>
				<span class="button-icon">🔄</span>
				<span>AABB Pattern</span>
			</button>
		</div>
	{/if}

	{#if !isLoading}
		<div class="animator-container">
			<SequenceAnimator
				sequenceData={selectedSequence}
				width={canvasSize}
				height={canvasSize}
				speed={animationSpeed}
			/>
		</div>

		<div class="controls-section">
			<div class="card settings-card">
				<h2>Animation Settings</h2>
				<div class="settings">
					<div class="setting">
						<label for="canvas-size"
							>Canvas Size: <span class="setting-value">{canvasSize}px</span></label
						>
						<input
							id="canvas-size"
							type="range"
							min="300"
							max="900"
							step="50"
							bind:value={canvasSize}
							class="slider"
						/>
					</div>
					<div class="setting">
						<label for="animation-speed"
							>Animation Speed: <span class="setting-value">{animationSpeed.toFixed(1)}x</span
							></label
						>
						<input
							id="animation-speed"
							type="range"
							min="0.1"
							max="2.0"
							step="0.1"
							bind:value={animationSpeed}
							class="slider"
						/>
					</div>
				</div>
			</div>

			<div class="card info-card">
				<h2>Sequence Information</h2>
				<div class="sequence-info">
					<div class="info-row">
						<span class="info-label">Name:</span>
						<span class="info-value">{selectedSequence[0].word}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Author:</span>
						<span class="info-value">{selectedSequence[0].author || 'Unknown'}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Level:</span>
						<span class="info-value">{selectedSequence[0].level || 'N/A'}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Steps:</span>
						<span class="info-value">{selectedSequence.length - 1}</span>
					</div>

					<div class="data-toggle">
						<label class="toggle-switch">
							<input type="checkbox" bind:checked={showSequenceData} />
							<span class="toggle-slider"></span>
							<span class="toggle-label">Show Sequence Data</span>
						</label>
					</div>
				</div>
			</div>
		</div>

		{#if showSequenceData}
			<div class="card sequence-data-card">
				<h3>Sequence Data</h3>
				<div class="sequence-data">
					<pre>{JSON.stringify(selectedSequence, null, 2)}</pre>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.hero {
		text-align: center;
		margin-bottom: var(--spacing-xl);
		animation: fadeIn var(--transition-normal);
	}

	h1 {
		font-size: var(--font-size-4xl);
		margin-bottom: var(--spacing-sm);
		color: var(--primary-color);
	}

	.subtitle {
		font-size: var(--font-size-lg);
		color: var(--text-color-secondary);
		margin-bottom: var(--spacing-lg);
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 200px;
		gap: var(--spacing-md);
		color: var(--text-color-secondary);
	}

	.sequence-selector {
		display: flex;
		justify-content: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-xl);
	}

	.sequence-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-lg);
		background-color: var(--surface-color);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-md);
		color: var(--text-color);
		font-weight: 500;
		transition: all var(--transition-fast);
		box-shadow: var(--shadow-sm);
	}

	.sequence-button:hover {
		background-color: var(--surface-color-hover);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.sequence-button.active {
		background-color: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
	}

	.button-icon {
		font-size: var(--font-size-lg);
	}

	.animator-container {
		display: flex;
		justify-content: center;
		margin-bottom: var(--spacing-xl);
	}

	.controls-section {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-xl);
	}

	@media (min-width: 768px) {
		.controls-section {
			grid-template-columns: 1fr 1fr;
		}
	}

	.card {
		background-color: var(--surface-color);
		border-radius: var(--border-radius-lg);
		padding: var(--spacing-lg);
		box-shadow: var(--shadow-md);
		transition: all var(--transition-normal);
	}

	.card:hover {
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
	}

	.card h2 {
		font-size: var(--font-size-xl);
		margin-bottom: var(--spacing-md);
		color: var(--text-color);
		border-bottom: 1px solid var(--border-color);
		padding-bottom: var(--spacing-sm);
	}

	.settings {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.setting {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.setting label {
		font-weight: 500;
		color: var(--text-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.setting-value {
		font-weight: 600;
		color: var(--primary-color);
	}

	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 8px;
		border-radius: var(--border-radius-full);
		background: var(--surface-color-hover);
		outline: none;
		transition: all var(--transition-fast);
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--primary-color);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--primary-color);
		cursor: pointer;
		transition: all var(--transition-fast);
		border: none;
	}

	.slider::-webkit-slider-thumb:hover {
		background: var(--primary-color-hover);
		transform: scale(1.1);
	}

	.slider::-moz-range-thumb:hover {
		background: var(--primary-color-hover);
		transform: scale(1.1);
	}

	.info-card {
		height: 100%;
	}

	.sequence-info {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px dashed var(--border-color);
	}

	.info-label {
		font-weight: 500;
		color: var(--text-color-secondary);
	}

	.info-value {
		font-weight: 600;
		color: var(--text-color);
	}

	.data-toggle {
		margin-top: var(--spacing-md);
	}

	.toggle-switch {
		position: relative;
		display: inline-flex;
		align-items: center;
		cursor: pointer;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: relative;
		display: inline-block;
		width: 40px;
		height: 20px;
		background-color: var(--surface-color-hover);
		border-radius: 20px;
		transition: 0.4s;
	}

	.toggle-slider:before {
		position: absolute;
		content: '';
		height: 16px;
		width: 16px;
		left: 2px;
		bottom: 2px;
		background-color: white;
		border-radius: 50%;
		transition: 0.4s;
	}

	input:checked + .toggle-slider {
		background-color: var(--primary-color);
	}

	input:checked + .toggle-slider:before {
		transform: translateX(20px);
	}

	.toggle-label {
		margin-left: var(--spacing-sm);
		font-size: var(--font-size-sm);
		color: var(--text-color-secondary);
	}

	.sequence-data-card {
		margin-top: var(--spacing-xl);
		animation: fadeIn var(--transition-normal);
	}

	.sequence-data {
		background-color: var(--surface-color-hover);
		border-radius: var(--border-radius-md);
		padding: var(--spacing-md);
		overflow-x: auto;
		max-height: 400px;
		overflow-y: auto;
	}

	pre {
		margin: 0;
		white-space: pre-wrap;
		font-size: var(--font-size-sm);
		font-family: monospace;
		color: var(--text-color);
	}

	@media (max-width: 640px) {
		.controls-section {
			grid-template-columns: 1fr;
		}

		.card {
			padding: var(--spacing-md);
		}

		h1 {
			font-size: var(--font-size-3xl);
		}

		.subtitle {
			font-size: var(--font-size-md);
		}
	}
</style>
