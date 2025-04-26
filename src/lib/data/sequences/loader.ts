/**
 * Sequence loader module
 *
 * This module provides functions to load and initialize sequences
 */

import type { SequenceData } from '../../types/sequence';
import {
	getAllSequences,
	initializeMetadata,
	type SequenceWithThumbnail
} from '../../utils/metadataExtractor';
import { sequencesActions } from '../../stores/sequences';

/**
 * Initialize sequences by preloading them
 */
export async function initializeSequences(): Promise<void> {
	console.log('Loading sequence data from JSON files...');

	// Create a timeout promise to ensure the function doesn't hang
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => {
			reject(new Error('Sequence initialization timed out after 10 seconds'));
		}, 10000);
	});

	try {
		// Race the initialization against the timeout
		await Promise.race([
			(async () => {
				// First, ensure metadata is loaded
				await initializeMetadata();

				// Get all available sequences with thumbnails
				const sequences = getAllSequences();

				if (sequences.length === 0) {
					console.warn('No sequences found in metadata - check metadata extraction process');
					sequencesActions.setError('No sequences found in metadata');
				} else {
					console.log(`Found ${sequences.length} sequences in metadata`);

					// Update sequences store with loaded sequences
					sequencesActions.setSequences(sequences);

					// Set the initial sequence if available
					if (sequences.length > 0) {
						sequencesActions.selectSequence(sequences[0].sequenceData, sequences[0].id);
					}
				}

				console.log(`All sequences loaded successfully (${sequences.length} valid sequences)`);
			})(),
			timeoutPromise
		]);
	} catch (error) {
		console.error('Error initializing sequences:', error);

		// Update sequences store with error state
		sequencesActions.setError(error instanceof Error ? error.message : 'Failed to load sequences');
		sequencesActions.setSequences([]);
	}
}

/**
 * Get all available sequences
 * @returns Array of all available sequences
 */
export function getAllSequencesData(): SequenceData[] {
	// Get sequences from metadata extractor
	const sequences = getAllSequences();

	// Extract just the sequence data
	const sequenceData = sequences.map((seq) => seq.sequenceData);
	console.log(`getAllSequencesData: Found ${sequenceData.length} sequences`);

	return sequenceData;
}

/**
 * Get a sequence by ID
 * @param id The sequence ID to retrieve
 * @returns The requested sequence or undefined if not found
 */
export function getSequenceById(id: string): SequenceData | undefined {
	// Get all sequences
	const sequences = getAllSequences();

	// Find the sequence with matching ID
	const found = sequences.find((seq) => seq.id === id);

	if (!found) {
		console.warn(`Sequence ID "${id}" not found`);
		// If we have other sequences, return the first one
		if (sequences.length > 0) {
			return sequences[0].sequenceData;
		}

		return undefined;
	}

	return found.sequenceData;
}
