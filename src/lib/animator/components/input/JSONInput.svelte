<script lang="ts">
	import type { SequenceData } from '../../types/core.js';
	import { validateJSONInput } from '../../utils/validation/sequence-validator.js';

	// Props
	let {
		onSequenceLoaded,
		onError,
		disabled = false,
		value = $bindable('')
	}: {
		onSequenceLoaded?: (data: SequenceData) => void;
		onError?: (error: string) => void;
		disabled?: boolean;
		value?: string;
	} = $props();

	function handleInputChange(e: Event): void {
		value = (e.target as HTMLTextAreaElement).value;
		onError?.(''); // Clear errors on input change
	}

	function handleLoadSequence(): void {
		const validation = validateJSONInput(value);

		if (!validation.isValid) {
			onError?.(validation.error || 'Invalid input');
			return;
		}

		try {
			const parsed = JSON.parse(value);
			onSequenceLoaded?.(parsed as SequenceData);
		} catch (err) {
			onError?.(`Parse error: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
</script>

<div class="json-input">
	<textarea
		{value}
		oninput={handleInputChange}
		rows="8"
		placeholder="Paste JSON sequence data here..."
		aria-label="Sequence JSON input"
		{disabled}
	></textarea>

	<button
		type="button"
		class="load-button"
		onclick={handleLoadSequence}
		disabled={disabled || !value.trim()}
	>
		🚀 Load Sequence
	</button>
</div>

<style>
	.json-input {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	textarea {
		width: 100%;
		font-family: monospace;
		padding: 0.75rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		resize: vertical;
		transition: border-color 0.2s ease;
		font-size: 0.875rem;
	}

	textarea:focus {
		outline: none;
		border-color: var(--primary-color, #2196f3);
		box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
	}

	textarea:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.load-button {
		padding: 0.75rem 2rem;
		background: linear-gradient(135deg, var(--success-color, #4caf50), #45a049);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.load-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #45a049, #3d8b40);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.load-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none !important;
	}

	.load-button:active {
		transform: translateY(0);
	}
</style>
