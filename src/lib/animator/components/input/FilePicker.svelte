<script lang="ts">
	import type { SequenceData } from '../../types/core.js';
	import { extractSequenceFromPNG } from '../../utils/file/png-parser.js';
	import { validateFileType } from '../../utils/validation/sequence-validator.js';

	// Props
	let {
		onSequenceLoaded,
		onError,
		disabled = false,
		isProcessing = false
	}: {
		onSequenceLoaded?: (data: SequenceData) => void;
		onError?: (error: string) => void;
		disabled?: boolean;
		isProcessing?: boolean;
	} = $props();

	// State
	let fileInput: HTMLInputElement;

	function handleFileSelect(): void {
		fileInput.click();
	}

	async function handleFileChange(e: Event): Promise<void> {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		await processFile(file);
	}

	async function processFile(file: File): Promise<void> {
		// Validate file type
		const validation = validateFileType(file);
		if (!validation.isValid) {
			onError?.(validation.error || 'Invalid file type');
			return;
		}

		try {
			const result = await extractSequenceFromPNG(file);
			if (result.success && result.data) {
				onSequenceLoaded?.(result.data);
			} else {
				onError?.(result.error || 'Failed to extract sequence data');
			}
		} catch (err) {
			onError?.(`Error reading PNG file: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
</script>

<!-- Hidden file input -->
<input
	bind:this={fileInput}
	type="file"
	accept=".png"
	onchange={handleFileChange}
	style="display: none;"
/>

<button
	type="button"
	class="file-button"
	onclick={handleFileSelect}
	disabled={disabled || isProcessing}
>
	{#if isProcessing}
		⏳ Processing...
	{:else}
		📁 Load from PNG Image
	{/if}
</button>

<style>
	.file-button {
		padding: 0.75rem 1.5rem;
		border: 2px solid var(--primary-color, #2196f3);
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
		font-size: 0.9rem;
		background: var(--primary-color, #2196f3);
		color: white;
	}

	.file-button:hover:not(:disabled) {
		background: var(--primary-dark, #1976d2);
		border-color: var(--primary-dark, #1976d2);
		transform: translateY(-1px);
	}

	.file-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none !important;
	}
</style>
