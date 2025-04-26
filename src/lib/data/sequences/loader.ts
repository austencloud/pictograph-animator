import type { SequenceData } from '../../types/sequence.js';
import { browser } from '$app/environment';
import { convertToSequenceData } from '../../utils/sequenceConverter.js';

// Define the JSON sequence format
interface JsonSequence {
	metadata: Record<string, any>;
	steps: Record<string, any>[];
}

/**
 * Convert JSON sequence to SequenceData format
 * This handles both old format (flat array) and new format (metadata + steps)
 */
function convertJsonToSequenceData(jsonData: any): SequenceData {
	return convertToSequenceData(jsonData);
}

// Load JSON data from files
// We'll use a dynamic approach to load the JSON files
async function loadJsonFile(path: string): Promise<any> {
	if (browser) {
		try {
			console.log(`Attempting to load JSON file from: ${path}`);
			const response = await fetch(path);
			if (!response.ok) {
				console.error(`Failed to load JSON file: ${response.status} ${response.statusText}`);
				throw new Error(`Failed to load JSON file: ${response.statusText}`);
			}
			const data = await response.json();
			console.log(`Successfully loaded JSON file from: ${path}`, data);
			return data;
		} catch (error) {
			console.error(`Error loading JSON file ${path}:`, error);
			throw error;
		}
	} else {
		// For server-side rendering, we can't use fetch
		// This is a fallback that won't be used in the browser
		console.log(`Server-side rendering, returning empty data for: ${path}`);
		return { metadata: {}, steps: [] };
	}
}

// Create placeholder sequences that will be replaced with actual data
export let aabbSequence: SequenceData = [
	{
		word: 'AABB',
		author: 'Loading...',
		level: 1,
		prop_type: 'staff',
		grid_mode: 'diamond',
		is_circular: true
	}
];

export let complexSequence: SequenceData = [
	{
		word: 'Complex',
		author: 'Loading...',
		level: 2,
		prop_type: 'staff',
		grid_mode: 'diamond',
		is_circular: true
	}
];

export let aSequence: SequenceData = [
	{
		word: 'A',
		author: 'Loading...',
		level: 1,
		prop_type: 'staff',
		grid_mode: 'diamond',
		is_circular: true
	}
];

// Create a registry of all available sequences
export const sequenceRegistry: Record<string, SequenceData> = {
	aabb: aabbSequence,
	complex: complexSequence,
	a: aSequence
};

// Helper functions
export function getSequenceById(id: string): SequenceData | undefined {
	return sequenceRegistry[id];
}

export function getAllSequenceIds(): string[] {
	return Object.keys(sequenceRegistry);
}

export function getAllSequences(): SequenceData[] {
	return Object.values(sequenceRegistry);
}

export function getSequenceMetadata(id: string): Record<string, any> | undefined {
	const sequence = sequenceRegistry[id];
	if (!sequence || sequence.length === 0) return undefined;
	return sequence[0];
}

/**
 * Load a sequence from a URL
 * This can be used to load sequences from external sources
 */
export async function loadSequenceFromUrl(url: string): Promise<SequenceData | null> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load sequence: ${response.statusText}`);
		}
		const jsonData = (await response.json()) as JsonSequence;
		return convertJsonToSequenceData(jsonData);
	} catch (error) {
		console.error('Error loading sequence:', error);
		return null;
	}
}

/**
 * Initialize sequences by loading JSON files
 * This should be called when the app starts
 */
export async function initializeSequences(): Promise<void> {
	if (!browser) {
		console.log('Not in browser, skipping sequence initialization');
		return; // Only run in the browser
	}

	try {
		console.log('Loading sequence data from JSON files...');

		// Load AABB sequence
		console.log('Loading AABB sequence...');
		try {
			// Try to load from the static folder
			const aabbJson = await loadJsonFile('/sequences/AABB.json');
			console.log('Converting AABB sequence...', aabbJson);
			aabbSequence = convertJsonToSequenceData(aabbJson);
			console.log('AABB sequence loaded:', aabbSequence);
			sequenceRegistry.aabb = aabbSequence;
		} catch (error) {
			console.warn('Failed to load AABB sequence from static folder, using placeholder:', error);
			// Keep using the placeholder
		}
		console.log('All sequences loaded successfully');
	} catch (error) {
		console.error('Failed to initialize sequences:', error);
	}
}
