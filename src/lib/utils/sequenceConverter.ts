import type { SequenceData } from '../types/sequence.js';

/**
 * Determines if the sequence data is in the new format (with metadata and steps)
 * or the old format (flat array)
 */
export function isNewFormat(data: any): boolean {
	return data && typeof data === 'object' && 'metadata' in data && 'steps' in data;
}

/**
 * Converts a sequence from the new format (metadata + steps) to the old format (flat array)
 */
export function convertNewToOldFormat(newFormatData: { metadata: any; steps: any[] }): any[] {
	const { metadata, steps } = newFormatData;
	return [metadata, ...steps];
}

/**
 * Converts a sequence from the old format (flat array) to the new format (metadata + steps)
 */
export function convertOldFormatToNew(oldFormatData: any[]): { metadata: any; steps: any[] } {
	if (!Array.isArray(oldFormatData) || oldFormatData.length === 0) {
		throw new Error('Invalid sequence data: must be a non-empty array');
	}

	// The first item in the old format is the metadata
	const metadata = { ...oldFormatData[0] };

	// The rest of the items are steps
	const steps = oldFormatData.slice(1).map((step) => {
		// Copy the step to avoid modifying the original
		const newStep = { ...step };

		// If the step has a sequence_start_position but no start_pos, use it as start_pos
		if (newStep.sequence_start_position && !newStep.start_pos) {
			newStep.start_pos = newStep.sequence_start_position;
			delete newStep.sequence_start_position;
		}

		return newStep;
	});

	return { metadata, steps };
}

/**
 * Parses a JSON string containing sequence data in the old format and converts it to the new format
 */
export function parseAndConvertSequence(jsonString: string): { metadata: any; steps: any[] } {
	try {
		const oldFormatData = JSON.parse(jsonString);
		return convertOldFormatToNew(oldFormatData);
	} catch (error) {
		console.error('Error parsing sequence data:', error);
		throw new Error('Invalid JSON: ' + (error as Error).message);
	}
}

/**
 * Converts a sequence from the old format to the SequenceData format
 */
export function convertOldFormatToSequenceData(oldFormatData: any[]): SequenceData {
	const { metadata, steps } = convertOldFormatToNew(oldFormatData);
	return [metadata, ...steps];
}

/**
 * Parses a JSON string containing sequence data in the old format and converts it to SequenceData
 */
export function parseAndConvertToSequenceData(jsonString: string): SequenceData {
	const { metadata, steps } = parseAndConvertSequence(jsonString);
	return [metadata, ...steps];
}

/**
 * Parses a JSON string and determines its format, then returns it in the requested format
 */
export function parseSequenceJson(jsonString: string, outputFormat: 'old' | 'new' = 'new'): any {
	try {
		const data = JSON.parse(jsonString);

		// Check if the data is in the new format or old format
		const isNew = Array.isArray(data) ? false : isNewFormat(data);

		if (outputFormat === 'new') {
			return isNew ? data : convertOldFormatToNew(data);
		} else {
			return isNew ? convertNewToOldFormat(data) : data;
		}
	} catch (error) {
		console.error('Error parsing sequence data:', error);
		throw new Error('Invalid JSON: ' + (error as Error).message);
	}
}

/**
 * Converts a sequence to the SequenceData format (flat array)
 */
export function convertToSequenceData(data: any): SequenceData {
	if (Array.isArray(data)) {
		// Already in the old format (flat array)
		return data as SequenceData;
	} else if (isNewFormat(data)) {
		// Convert from new format to old format
		return convertNewToOldFormat(data) as SequenceData;
	} else {
		throw new Error('Invalid sequence data format');
	}
}

/**
 * Stringifies a sequence in the old format (flat array)
 */
export function stringifySequenceOldFormat(sequence: SequenceData): string {
	return JSON.stringify(sequence, null, 2);
}
