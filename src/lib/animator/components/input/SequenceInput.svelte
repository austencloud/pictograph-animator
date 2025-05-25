<script lang="ts">
	import type { SequenceData } from '../../types/core.js';
	import FileDropZone from './FileDropZone.svelte';
	import FilePicker from './FilePicker.svelte';
	import JSONInput from './JSONInput.svelte';

	// Props
	let {
		onSequenceLoaded
	}: {
		onSequenceLoaded?: (data: SequenceData) => void;
	} = $props();

	// State
	let errorMessage = $state('');
	let jsonValue = $state('');
	let isProcessing = $state(false);

	function handleSequenceLoaded(data: SequenceData): void {
		onSequenceLoaded?.(data);
		errorMessage = '';
		jsonValue = JSON.stringify(data, null, 2);
	}

	function handleError(error: string): void {
		errorMessage = error;
	}

	function clearInput(): void {
		jsonValue = '';
		errorMessage = '';
	}
</script>

<div class="sequence-input">
	<h2>Sequence Input</h2>

	<!-- Input method selection -->
	<div class="input-options">
		<FilePicker onSequenceLoaded={handleSequenceLoaded} onError={handleError} {isProcessing} />
		<span class="separator">or</span>
		<button
			type="button"
			class="json-button"
			onclick={clearInput}
			disabled={isProcessing}
			aria-label="Clear input and paste JSON data"
		>
			📝 Paste JSON Data
		</button>
	</div>

	<!-- Drag and drop area with JSON input -->
	<FileDropZone
		onSequenceLoaded={handleSequenceLoaded}
		onError={handleError}
		disabled={isProcessing}
		bind:isProcessing
	>
		<div class="input-container">
			<JSONInput
				bind:value={jsonValue}
				onSequenceLoaded={handleSequenceLoaded}
				onError={handleError}
				disabled={isProcessing}
			/>

			{#if errorMessage}
				<div class="error" role="alert" aria-live="polite">{errorMessage}</div>
			{/if}

			{#if !jsonValue.trim() && !isProcessing}
				<div class="help-text">
					<p><strong>💡 How to use:</strong></p>
					<ul>
						<li>
							<strong>PNG Import:</strong> Click "Load from PNG Image" or drag & drop PNG files with
							embedded metadata (created by the Python pictograph tools)
						</li>
						<li>
							<strong>JSON Input:</strong> Paste sequence data in the format:
							<code>[metadata, step1, step2, ...]</code>
						</li>
						<li>
							<strong>Drag & Drop:</strong> Simply drag PNG image files onto this area for quick import
						</li>
					</ul>
				</div>
			{/if}

			{#if isProcessing}
				<div class="loading-indicator" role="status" aria-live="polite">
					<div class="spinner" aria-hidden="true"></div>
					<span>Processing PNG file...</span>
				</div>
			{/if}
		</div>
	</FileDropZone>
</div>

<style>
	.sequence-input {
		width: 100%;
	}

	.input-options {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
		justify-content: center;
	}

	.separator {
		color: #666;
		font-style: italic;
		font-size: 0.9rem;
	}

	.json-button {
		padding: 0.75rem 1.5rem;
		border: 2px solid var(--primary-color, #2196f3);
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
		font-size: 0.9rem;
		background: transparent;
		color: var(--primary-color, #2196f3);
	}

	.json-button:hover:not(:disabled) {
		background: var(--primary-light, #f3f9ff);
		transform: translateY(-1px);
	}

	.json-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none !important;
	}

	.input-container {
		padding: 1rem;
	}

	.error {
		color: var(--error-color, #d32f2f);
		font-size: 0.875rem;
		margin-top: 0.5rem;
		padding: 0.75rem;
		background: var(--error-light, #ffebee);
		border-radius: 8px;
		border-left: 4px solid var(--error-color, #d32f2f);
		white-space: pre-line;
		line-height: 1.5;
		max-height: 200px;
		overflow-y: auto;
	}

	.loading-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 1rem;
		padding: 1rem;
		background: var(--warning-light, #fff8e1);
		border-radius: 8px;
		border-left: 4px solid var(--warning-color, #ff9800);
		color: #e65100;
		font-weight: 500;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #ffcc02;
		border-top: 2px solid var(--warning-color, #ff9800);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.help-text {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--background-light, #f8f9fa);
		border-radius: 8px;
		border-left: 4px solid var(--primary-color, #2196f3);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.help-text p {
		margin: 0 0 0.5rem 0;
		color: var(--primary-color, #2196f3);
	}

	.help-text ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.help-text li {
		margin-bottom: 0.5rem;
		color: #555;
	}

	.help-text code {
		background: var(--primary-light, #e3f2fd);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: monospace;
		font-size: 0.8rem;
		color: var(--primary-dark, #1976d2);
	}
</style>
