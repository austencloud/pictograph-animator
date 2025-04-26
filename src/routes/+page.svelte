<script lang="ts">
	import { onMount } from 'svelte';
	import SequenceAnimator from '../lib/components/SequenceAnimator.svelte';
	import type { SequenceData } from '../lib/types/sequence.js';
	import {
		aabbSequence,
		getSequenceById,
		initializeSequences
	} from '../lib/data/sequences/index.js';

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
	<h1>Sequence Animator</h1>

	{#if isLoading}
		<div class="loading">
			<p>Loading sequence data...</p>
		</div>
	{:else}
		<div class="sequence-selector">
			<button
				class:active={selectedSequence === aabbSequence}
				on:click={() => selectSequence('aabb')}
			>
				AABB Pattern
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
	{/if}

	{#if !isLoading}
		<div class="settings">
			<div class="setting">
				<label for="canvas-size">Canvas Size: {canvasSize}px</label>
				<input
					id="canvas-size"
					type="range"
					min="300"
					max="900"
					step="50"
					bind:value={canvasSize}
				/>
			</div>
			<div class="setting">
				<label for="animation-speed">Animation Speed: {animationSpeed.toFixed(1)}x</label>
				<input
					id="animation-speed"
					type="range"
					min="0.1"
					max="2.0"
					step="0.1"
					bind:value={animationSpeed}
				/>
			</div>
		</div>

		<div class="sequence-info">
			<h2>Current Sequence: {selectedSequence[0].word}</h2>
			<p>Author: {selectedSequence[0].author || 'Unknown'}</p>
			<p>Level: {selectedSequence[0].level || 'N/A'}</p>
			<p>Steps: {selectedSequence.length - 1}</p>

			<div class="data-toggle">
				<label>
					<input type="checkbox" bind:checked={showSequenceData} />
					Show Sequence Data
				</label>
			</div>
		</div>

		{#if showSequenceData}
			<div class="sequence-data">
				<h3>Sequence Data</h3>
				<pre>{JSON.stringify(selectedSequence, null, 2)}</pre>
			</div>
		{/if}
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		text-align: center;
		margin-bottom: 2rem;
	}

	.sequence-selector {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.sequence-selector button {
		padding: 0.5rem 1rem;
		background-color: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
	}

	.sequence-selector button.active {
		background-color: #0072bc;
		color: white;
	}

	.animator-container {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.settings {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.setting {
		display: flex;
		flex-direction: column;
	}

	.sequence-info {
		margin-bottom: 2rem;
	}

	.sequence-data {
		margin-top: 2rem;
		padding: 1rem;
		background-color: #f5f5f5;
		border-radius: 4px;
		overflow-x: auto;
	}

	pre {
		margin: 0;
		white-space: pre-wrap;
		font-size: 0.9rem;
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 200px;
		font-size: 1.2rem;
		color: #666;
	}
</style>
